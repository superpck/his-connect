import { Knex } from 'knex';
import * as moment from 'moment';

export class IsReportModel {
  getReport1(knex: Knex, reportCond) {
    let date1 = reportCond.date1 + ' 00:00:00';
    let date2 = reportCond.date2 + ' 23:59:59';
    let Sql = `
      select b.code, b.name as reportname, c.*, h.changwatcode, h.region
      from (select case when a.icdcause between 'W00' and 'W19' then '02'
      when a.icdcause between 'W20' and 'W49' then '03'
      when a.icdcause between 'W50' and 'W64' then '04'
      when a.icdcause between 'W65' and 'W74' then '05'
      when a.icdcause between 'W75' and 'W84' then '06'
      when a.icdcause between 'W85' and 'W99' then '07'
      when a.icdcause between 'X00' and 'X09' then '08'
      when a.icdcause between 'X10' and 'X19' then '09'
      when a.icdcause between 'X20' and 'X29' then '10'
      when a.icdcause between 'X30' and 'X39' then '11'
      when a.icdcause between 'X40' and 'X49' then '12'
      when a.icdcause between 'X50' and 'X57' then '13'
      when a.icdcause between 'X58' and 'X59' then '14'
      when a.icdcause between 'X60' and 'X84' then '15'
      when a.icdcause between 'X85' and 'Y09' then '16'
      when a.icdcause between 'Y10' and 'Y34' then '17'
      when a.icdcause between 'Y35' and 'Y36' then '18'
      when a.icdcause = 'N' then '19'
      else '01' end cause19, count(a.id) as cases
      , count(if(a.staer = '1',1,null)) as dba
      , count(if(a.staer between '2' and '5',1,null)) as outcome
      , count(if(a.staer = '6',1,null)) as dead
      , count(if(a.staer = '7',1,null)) as admit
      , a.hosp, date_format(a.adate,'%Y-%m-%d') as dateaccident ` +
      'from `is` a ' +
      '<where> group by cause19, dateaccident, a.hosp) c right join report_template b on c.cause19 = b.code ' +
      `join lib_hospcode h on c.hosp = h.off_id
      order by b.code` ;
    return knex.raw(Sql);
  }

  getReport(knex: Knex, reportID) {
    return knex('*')
      .from('report')
      .where('id', '=', reportID);
  }

  getData(knex: Knex, sql) {
    return knex.raw(sql);
  }

  selectSql(knex: Knex, tableName: string, selectText: string, whereText: string, groupBy: string, orderBy: string) {
    let sql = 'select ' + selectText + ' from ' + tableName;
    if (whereText != '') {
      sql = sql + ' where ' + whereText;
    }
    if (groupBy != '') {
      sql = sql + ' group by ' + groupBy;
    }
    if (orderBy != '') {
      sql = sql + ' order by ' + orderBy;
    }
    sql = sql + ' limit 0,500';
    return knex.raw(sql);
  }
}
