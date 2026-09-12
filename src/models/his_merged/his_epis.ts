import { Knex } from 'knex';
const maxLimit = 250;
const hcode = process.env.HOSPCODE;
let hisHospcode = process.env.HOSPCODE;

export class HisEPisModel {
  // MOPH ERP =========================================================================
  // รหัส Ward
  getWard(db: Knex, wardCode: string = '', wardName: string = '') {
    return [];
  }

  // รหัส เตียง
  countBedNo(db: Knex) {
    return { total_bed: 100 };
  }

  async getBedNo(db: Knex, bedno: any = null, start = -1, limit: number = 1000) {
    let sql = `SELECT 
      wardroomhst.bedno as bedno
      ,wardroomhst.bedtype as bedtype
      ,bedtype.name as bedtype_name
      ,wardroomhst.room as roomno
      ,wardroomhst.ward as wardcode
      ,ward.name as wardname
      ,(select phisenv.val from phisenv where  phisenv.section = 'HPTENV' and phisenv.var = 'HPTCODE') as std_code
      , Case When UPPER(bedtype.var) like '%ICU' Then 'ICU'
      When UPPER(bedtype.var) like 'RESERVE%' Then 'S'
      Else 'N' End As bed_type
      ,'1' as isactive
      FROM wardroomhst
      LEFT OUTER JOIN bedtype ON wardroomhst.bedtype = bedtype.bedtype
      LEFT OUTER JOIN ward ON wardroomhst.ward  = ward.ward
      WHERE
        wardroomhst.canceldate is null
        and wardroomhst.wardroomst = 10;`;
    const result = await db.raw(sql);
    return result[0];
  }

  async concurrentIPDByWard(db: Knex, date: any) {
    let sql = `
      select         
        (select phisenv.val from cbh.phisenv
            where phisenv.section = 'HPTENV'
                  and phisenv.var = 'HPTCODE'
            ) as hospcode
          , sysdate as curdate
          , wardcode
          , '' as std_code
          , count(*) as cases
          , count(case when iptadmostname = 'รับใหม่' then 1 else null end)  as new_case
          , count(case when iptadmostname like 'จำหน่าย%' then 1 else null end)  as discharge
          , count(case when drg in (8,9) then 1 else null end)  as death

          , count(case when lower(bedvar) in ( 'normal' , 'normal2')  then 1 else null end) as normal

          , count(case when lower(bedvar) = 'extra'  then 1 else null end) as special

          , count(case when lower(bedvar)  = 'normalicu'  then 1 else null end) as icu
          , 0 as semi
          , 0 as stroke 
          , 0 as burn
          , 0 as imc
          , 0 as lr
          , 0 as clip
          , 0 as minithanyaruk
          , 0 as homeward
        from 
        (select  10662 as hospcode
          , sysdate as dates
          , iptadm.ward as wardcode
        ,case 
          when ipt.ward = iptadm.ward 
            and (  (ipt.dchconfdate = a.Fdate and ipt.dchconftime >= a.Ftime) or
                (ipt.dchconfdate > a.Fdate and ipt.dchconfdate < a.Edate) or
                (ipt.dchconfdate = a.Edate and ipt.dchconftime <= a.Etime) ) 
            then 'จำหน่าย / '|| dchtype.name 
          when iptadm.iptadmost = 99 
            and (  (ipt.dchconfdate = a.Fdate and ipt.dchconftime >= a.Ftime) or
                (ipt.dchconfdate > a.Fdate and ipt.dchconfdate < a.Edate) or
                (ipt.dchconfdate = a.Edate and ipt.dchconftime <= a.Etime) ) 
            then 'จำหน่าย / '|| dchtype.name 

          when iptadm.indate = a.Fdate and iptadm.iptadmist = 1 and iptadm.iptadmost = 2  then 'รับใหม่'

          when iptadm.iptadmost = 90 
            and (  (iptadm.outdate = a.Fdate and iptadm.outtime >= a.Ftime) or
                (iptadm.outdate > a.Fdate and iptadm.outdate < a.Edate) or
                (iptadm.outdate = a.Edate and iptadm.outtime <= a.Etime) ) 
          then 'ย้ายหอ'  
              when iptadm.iptadmost = 80 
            and (  (iptadm.outdate = a.Fdate and iptadm.outtime >= a.Ftime) or
                (iptadm.outdate > a.Fdate and iptadm.outdate < a.Edate) or
                (iptadm.outdate = a.Edate and iptadm.outtime <= a.Etime) or
                                      (iptadm.outdate is null )  ) 
          then 'ผู้ป่วยกลับบ้าน'  
          else 'อยู่ที่หอ' end as iptadmostname 

        , case when  iptadm.iptadmost = 99 
            and (  (ipt.dchconfdate = a.Fdate and ipt.dchconftime >= a.Ftime) or
                (ipt.dchconfdate > a.Fdate and ipt.dchconfdate < a.Edate) or
                (ipt.dchconfdate = a.Edate and ipt.dchconftime <= a.Etime) ) 
            then   iptadm.iptadmost 
          else 0 end iptadmost
        , dchtype.drg as drg
        , bedtype.var as bedvar
        from cbh.iptadm  left outer join cbh.dct on iptadm.dct = dct.dct  
                left outer join (select to_date('02/12/2025','dd/mm/yyyy') as  Fdate   ///--- วันที่เริ่มต้น
                  , 0 as Ftime      //-- เวลาที่เริ่มต้น
                  , to_date('03/12/2025','dd/mm/yyyy') as Edate   //---วันที่สิ้นสุด
                  , 235959 as Etime  //-- เวลาที่สิ้นสุด
                from dual )   a on (1=1)
              , cbh.ipt   left outer join cbh.dchtype on ipt.dchtype = dchtype.dchtype 
          , cbh.pt 
          , cbh.ward 
          , cbh.bedtype 
        where iptadm.an = ipt.an 
        and ipt.canceldate is null 
        and ipt.hn = pt.hn
        and iptadm.ward = ward.ward 
        and iptadm.bedtype = bedtype.bedtype 

        and (iptadm.indate < a.Edate or (iptadm.indate = a.Edate and iptadm.intime <= a.Etime)) 
        and (iptadm.outdate > a.Fdate or (iptadm.outdate = a.Fdate and iptadm.outtime >= a.Ftime ) or iptadm.outdate is null )
            and iptadm.firstdate = (select max(x9.firstdate) from cbh.iptadm x9 where x9.an = iptadm.an and x9.ward = iptadm.ward 
            and (x9.indate < a.Edate or (x9.indate = a.Edate and x9.intime <= a.Etime))  
            and ( x9.outdate > a.Fdate or (x9.outdate = a.Fdate and x9.outtime >= a.Ftime) or x9.outdate is null))  
        )
        group by wardcode
        order  by wardcode;
    `;
    return db.raw(sql).then((result) => result[0]);
  }
  async concurrentIPDByClinic(db: Knex, date: any) {
    const sql = `
      select (
            select
                    phisenv.val
            from
                    cbh.phisenv
            where
                    phisenv.section = 'HPTENV'
                    and phisenv.var = 'HPTCODE'
          ) as hospcode
        , sysdate as curdate
        , clliniccode as  clliniccode
        , '' as std_code
        , count(*) as cases
        , count(case when iptadmostname = 'รับใหม่' then 1 else null end)  as new_case
        , count(case when iptadmostname like 'จำหน่าย%' then 1 else null end)  as discharge
        , count(case when drg in (8,9) then 1 else null end)  as death

        , count(case when lower(bedvar) in ( 'normal' , 'normal2')  then 1 else null end) as normal

        , count(case when lower(bedvar) = 'extra'  then 1 else null end) as special

        , count(case when lower(bedvar)  = 'normalicu'  then 1 else null end) as icu
        , 0 as semi
        , 0 as stroke 
        , 0 as burn
        , 0 as imc
        , 0 as lr
        , 0 as clip
        , 0 as minithanyaruk
        , 0 as homeward
      from 
      (
      select  10662 as hospcode
        , sysdate as dates
        , spcltyb.exp43file as clliniccode

      ,case 
        when ipt.ward = iptadm.ward 
          and (  (ipt.dchconfdate = a.Fdate and ipt.dchconftime >= a.Ftime) or
              (ipt.dchconfdate > a.Fdate and ipt.dchconfdate < a.Edate) or
              (ipt.dchconfdate = a.Edate and ipt.dchconftime <= a.Etime) ) 
          then 'จำหน่าย / '|| dchtype.name 

        when iptadm.iptadmost = 99 
          and (  (ipt.dchconfdate = a.Fdate and ipt.dchconftime >= a.Ftime) or
              (ipt.dchconfdate > a.Fdate and ipt.dchconfdate < a.Edate) or
              (ipt.dchconfdate = a.Edate and ipt.dchconftime <= a.Etime) ) 
          then 'จำหน่าย / '|| dchtype.name 

        when iptadm.indate = a.Fdate and iptadm.iptadmist = 1 and iptadm.iptadmost = 2  then 'รับใหม่'

        when iptadm.iptadmost = 90 
          and (  (iptadm.outdate = a.Fdate and iptadm.outtime >= a.Ftime) or
              (iptadm.outdate > a.Fdate and iptadm.outdate < a.Edate) or
              (iptadm.outdate = a.Edate and iptadm.outtime <= a.Etime) ) 
        then 'ย้ายหอ'  
            when iptadm.iptadmost = 80 
          and (  (iptadm.outdate = a.Fdate and iptadm.outtime >= a.Ftime) or
              (iptadm.outdate > a.Fdate and iptadm.outdate < a.Edate) or
              (iptadm.outdate = a.Edate and iptadm.outtime <= a.Etime) or
                                    (iptadm.outdate is null )  ) 
        then 'ผู้ป่วยกลับบ้าน'  
        else 'อยู่ที่หอ' end as iptadmostname 

      , case when  iptadm.iptadmost = 99 
          and (  (ipt.dchconfdate = a.Fdate and ipt.dchconftime >= a.Ftime) or
              (ipt.dchconfdate > a.Fdate and ipt.dchconfdate < a.Edate) or
              (ipt.dchconfdate = a.Edate and ipt.dchconftime <= a.Etime) ) 
          then   iptadm.iptadmost 
        else 0 end iptadmost
      , dchtype.drg as drg
      , bedtype.var as bedvar
      from cbh.iptadm  left outer join cbh.dct on iptadm.dct = dct.dct  
              left outer join (select to_date('02/12/2025','dd/mm/yyyy') as  Fdate   ///--- วันที่เริ่มต้น
                , 0 as Ftime      //-- เวลาที่เริ่มต้น
                , to_date('03/12/2025','dd/mm/yyyy') as Edate   //---วันที่สิ้นสุด
                , 235959 as Etime  //-- เวลาที่สิ้นสุด
              from dual )   a on (1=1)
            , cbh.ipt   left outer join cbh.dchtype on ipt.dchtype = dchtype.dchtype 
          left outer join cbh.lct spcltyb on ipt.ward = spcltyb.lct
        , cbh.pt 
        , cbh.ward 
        , cbh.bedtype 
      where iptadm.an = ipt.an 
      and ipt.canceldate is null 
      and ipt.hn = pt.hn
      and iptadm.ward = ward.ward 
      and iptadm.bedtype = bedtype.bedtype 

      and (iptadm.indate < a.Edate or (iptadm.indate = a.Edate and iptadm.intime <= a.Etime)) 
      and (iptadm.outdate > a.Fdate or (iptadm.outdate = a.Fdate and iptadm.outtime >= a.Ftime ) or iptadm.outdate is null )
          and iptadm.firstdate = (select max(x9.firstdate) from cbh.iptadm x9 where x9.an = iptadm.an and x9.ward = iptadm.ward 
          and (x9.indate < a.Edate or (x9.indate = a.Edate and x9.intime <= a.Etime))  
          and ( x9.outdate > a.Fdate or (x9.outdate = a.Fdate and x9.outtime >= a.Ftime) or x9.outdate is null))  
      )
      group by clliniccode
      order  by clliniccode`;
    return db.raw(sql).then((result) => result[0]);
  }
  sumOpdVisitByClinic(db: Knex, date: any) {
    return [];
  }

  getVisitForMophAlert(db: Knex, date: any, isRowCount: boolean = false, limit: number = 1000, start = -1) {
    if (isRowCount) {
      return { row_count: 0 };
    } else {
      return [];
    }
  }

  // nRefer =============================================================================
  check() {
    return true;
  }

  async testConnect(db: Knex) {
    const row = await db('wardroomhst').first();
    return { connection: row ? true : false };
  }

  // รหัสห้องตรวจ
  async getDepartment(db: Knex, depCode: string = '', depName: string = '') {
    let sql = `select cliniclct.cliniclct as department_code ,
      cliniclct.dspname as department_name,
      '-' as moph_code,
      case when upper(cliniclct.var) = 'ER' then 1 else 0 end as emergency 
      from cbh.cliniclct 
      where cliniclct.canceldate is null`;
    if (depCode) {
      sql += ` and cliniclct.cliniclct = '${depCode}'`;
    }
    if (depName) {
      sql += ` and cliniclct.dspname like '%${depName}%'`;
    }
    return db.raw(sql).then((result) => result[0]);
  }

  // รายละเอียดแพทย์
  async getDr(db: Knex, code: string, license_no: string) {
    let query = db('dct')
      .select('dct.dct as dr_code', 'dct.lcno as dr_license_code',
        db.raw("'' as expire_date"))
      .whereNotNull('dct.lcno');
    if (code) {
      query = query.andWhere('dct.dct', code);
    }
    if (license_no) {
      query = query.andWhere('dct.lcno', license_no);
    }
    return await query.orderBy('dct.dct');
  }

  async getPerson1(db: Knex, columnName, searchText) {
    return [];
  }

  // select รายชื่อเพื่อแสดงทะเบียน
  getReferOut(db: Knex, date: any, hospCode = hisHospcode, visitNo: string = null) {
    return [];
  }

  sumReferOut(db: Knex, dateStart: any, dateEnd: any) {
    return [];
  }

  getPerson(db: Knex, columnName, searchText, hospCode = hisHospcode) {
    return [];
  }

  getAddress(db: Knex, columnName, searchNo, hospCode = hisHospcode) {
    return [];
  }

  getService(db: Knex, columnName: string, searchText: any, hospCode = hisHospcode) {
    return [];
  }

  getDiagnosisOpd(db: Knex, visitno: string, hospCode = hisHospcode) {
    return [];
  }
  getDiagnosisOpdAccident(db: Knex, dateStart: any, dateEnd: any, hospCode = hisHospcode) {
    return [];
  }
  async getDiagnosisOpdVWXY(db: Knex, date: any) {
    return [];
  }
  async getDiagnosisSepsisOpd(db: Knex, dateStart: any, dateEnd: any) {
    return [];
  }
  async getDiagnosisSepsisIpd(db: Knex, dateStart: any, dateEnd: any) {
    return [];
  }

  getProcedureOpd(db: Knex, visitno: string, hospCode = hisHospcode) {
    return [];
  }

  getChargeOpd(db: Knex, visitNo: string, hospCode = hisHospcode) {
    return [];
  }

  getLabRequest(db: Knex, columnName, searchNo, hospCode = hisHospcode) {
    return [];
  }

  getLabResult(db: Knex, columnName, searchNo, referID = '', hospCode = hisHospcode) {
    return [];
  }

  getInvestigation(db: Knex, columnName, searchNo, hospCode = hisHospcode) {
    return [];
  }

  getDrugOpd(db: Knex, visitNo: string, hospCode = hisHospcode) {
    return [];
  }

  getAdmission(db: Knex, columnName: string, searchValue: any, hospCode = hisHospcode) {
    return [];
  }

  getDiagnosisIpd(db: Knex, columnName: string, searchNo: string, hospCode = hisHospcode) {
    return [];
  }
  getDiagnosisIpdAccident(db: Knex, dateStart: any, dateEnd: any, hospCode = hisHospcode) {
    return [];
  }

  getProcedureIpd(db: Knex, an, hospCode = hisHospcode) {
    return [];
  }

  getChargeIpd(db: Knex, an: string, hospCode = hisHospcode) {
    return [];
  }

  async getDrugIpd(db: Knex, an: string, hospCode = hisHospcode) {
    return [];
  }

  getAccident(db: Knex, visitNo: string, hospCode = hisHospcode) {
    return [];
  }

  getDrugAllergy(db: Knex, hn, hospCode = hisHospcode) {
    return [];
  }

  getAppointment(db: Knex, visitNo: string, hospCode = hisHospcode) {
    return [];
  }

  async getReferHistory(db: Knex, columnName, searchNo, hospCode = hisHospcode) {
    return [];
  }

  getClinicalRefer(db: Knex, referNo, hospCode = hisHospcode) {
    return [];
  }

  getInvestigationRefer(db: Knex, referNo, hospCode = hisHospcode) {
    return [];
  }

  getCareRefer(db: Knex, referNo, hospCode = hisHospcode) {
    return [];
  }

  getReferResult(db: Knex, visitDate, hospCode = hisHospcode) {
    return [];
  }
  getProviderDr(db: Knex, drList: any[]) {
    return [];
  }
  getProvider(db: Knex, columnName, searchNo, hospCode = hisHospcode) {
    return [];
  }

  getData(db: Knex, tableName, columnName, searchNo, hospCode = hisHospcode) {
    return [];
  }

  // Report zone
  sumReferIn(db: Knex, dateStart: any, dateEnd: any) {
    return [];
  }

}