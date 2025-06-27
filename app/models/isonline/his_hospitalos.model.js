"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HisHospitalOsModel = void 0;
const dbName = process.env.HIS_DB_NAME;
const maxLimit = 100;
class HisHospitalOsModel {
    getTableName(knex) {
        return knex('information_schema.tables')
            .select('table_name')
            .where('table_catalog', '=', dbName);
    }
    testConnect(db) {
        return db('t_patient').select('patient_hn').limit(1);
    }
    getPerson(knex, columnName, searchText) {
        columnName = columnName == 'hn' ? 'patient.patient_hn' : columnName;
        columnName = columnName == 'cid' ? 'patient.patient_pid' : columnName;
        return knex('t_patient as patient')
            .select('patient.patient_hn as hn', 'patient.patient_pid as cid', 'f_patient_prefix.patient_prefix_description as prename', 'patient.patient_firstname as fname', 'patient.patient_lastname as lname', 'patient.f_sex_id as sex', 'patient.patient_moo as moo', 'patient.patient_road as road', 'patient.patient_house as address', 'patient.patient_phone_number as tel', 'patient.patient_tambon as addcode')
            .select(knex.raw(`'' as zip, concat(to_number(substr(patient.patient_birthday,1,4),'9999')-543 ,'-',substr(patient.patient_birthday,6)) as dob, CASE WHEN f_patient_occupation.r_rp1853_occupation_id IN ('001') THEN '07' 
			WHEN f_patient_occupation.r_rp1853_occupation_id IN ('002') THEN '14'
			WHEN f_patient_occupation.r_rp1853_occupation_id IN ('003') THEN '06'  
			WHEN f_patient_occupation.r_rp1853_occupation_id IN ('004') THEN '01'  
			WHEN f_patient_occupation.r_rp1853_occupation_id IN ('005') THEN '03' 
			WHEN f_patient_occupation.r_rp1853_occupation_id IN ('006') THEN '99' 
			WHEN f_patient_occupation.r_rp1853_occupation_id IN ('007') THEN '02' 
			WHEN f_patient_occupation.r_rp1853_occupation_id IN ('008') THEN '12' 
			WHEN f_patient_occupation.r_rp1853_occupation_id IN ('009') THEN '99' 
			WHEN f_patient_occupation.r_rp1853_occupation_id IN ('010') THEN '99' 
			WHEN f_patient_occupation.r_rp1853_occupation_id IN ('012') THEN '07' 
			WHEN f_patient_occupation.r_rp1853_occupation_id IN ('013') THEN '09' 
			WHEN f_patient_occupation.r_rp1853_occupation_id IN ('014') THEN '19' 
			WHEN f_patient_occupation.r_rp1853_occupation_id IN ('015') THEN '08' 
			WHEN f_patient_occupation.r_rp1853_occupation_id IN ('900','901') THEN '99' ELSE 'N' END AS occupation`))
            .leftJoin('f_patient_prefix', 'f_patient_prefix.f_patient_prefix_id', 'patient.f_patient_prefix_id')
            .leftJoin('f_patient_occupation', 'patient.f_patient_occupation_id', 'f_patient_occupation.f_patient_occupation_id')
            .orderBy('patient.patient_tambon')
            .where(columnName, "=", searchText);
    }
    getOpdService(knex, hn, date, columnName = '', searchText = '') {
        columnName = columnName == 'visitNo' || columnName == 'vn' ? 't_visit.visit_vn' : columnName;
        let where = {};
        if (hn)
            where['t_visit.visit_hn'] = hn;
        if (columnName && searchText)
            where[columnName] = searchText;
        return knex('t_visit')
            .leftJoin(`t_accident`, 't_accident.t_visit_id', 't_visit.t_visit_id')
            .leftJoin(`t_visit_vital_sign`, 't_visit_vital_sign.t_visit_id', 't_visit.t_visit_id')
            .leftJoin('t_visit_service', 't_visit_service.t_visit_id', 't_visit.t_visit_id')
            .select('t_visit.visit_hn as hn', 't_visit.visit_vn as visitno ', 't_accident.accident_time as time')
            .select(knex.raw(` concat(to_number(substr(t_accident.accident_date,1,4),'9999')-543 ,'-',substr(t_accident.accident_date,6),' ',t_accident.accident_time,':00') as adate ,
    
    cast(substring(t_visit_vital_sign.visit_vital_sign_blood_presure,1,(position('/' in t_visit_vital_sign.visit_vital_sign_blood_presure)-1)) as numeric) as bp_systolic ,  
              cast(substring(t_visit_vital_sign.visit_vital_sign_blood_presure,(position('/' in t_visit_vital_sign.visit_vital_sign_blood_presure)+1)) as numeric) as bp_diastolic ,
    t_visit_vital_sign.visit_vital_sign_heart_rate as pr ,  
                t_visit_vital_sign.visit_vital_sign_respiratory_rate as rr ,  
                concat(to_number(substr(t_accident.accident_to_hos_date,1,4),'9999')-543
                       ,'-',substr(t_accident.accident_to_hos_date,6)) as hdate ,  
                t_accident.accident_to_hos_time as htime ,
                t_accident.accident_moo as mooban,
                t_accident.accident_road_name as apointname,
                substr(t_accident.f_address_id_accident_tambon,5,2) as atumbon,
                substr(t_accident.f_address_id_accident_amphur,3,2) as aampur,
                substr(t_accident.f_address_id_accident_changwat,1,2) as aplace,
                CASE t_accident.accident_emergency_type  WHEN  '0' THEN '6'
                WHEN '1' THEN '5'
                WHEN '2' THEN '3'
                WHEN '3' THEN '2'
                WHEN '4' THEN '1'
                WHEN '5' THEN '4'
                ELSE 'N' END as cause_t,
                t_accident.f_accident_symptom_eye_id as gsc_e ,  
                t_accident.f_accident_symptom_speak_id as gsc_v ,
                t_accident.f_accident_symptom_movement_id as gsc_m ,  
                t_accident.f_accident_symptom_eye_id as eye ,  
                t_accident.f_accident_symptom_speak_id as verbal ,
                t_accident.f_accident_symptom_movement_id as motor ,  
                CASE WHEN t_accident.accident_accident_type IN ('V') THEN '1' 	WHEN t_accident.accident_accident_type IN ('00') THEN 'N' ELSE '2' END as cause ,
                CASE WHEN t_accident.f_accident_place_id IN ('1') THEN '1'
                           WHEN t_accident.f_accident_place_id IN ('2','3') THEN '7'
                           WHEN t_accident.f_accident_place_id IN ('4') THEN '6'
                           WHEN t_accident.f_accident_place_id IN ('5') THEN '4'
                           WHEN t_accident.f_accident_place_id IN ('6') THEN '8'
                           WHEN t_accident.f_accident_place_id IN ('7','8') THEN '5'
                           WHEN t_accident.f_accident_place_id IN ('9','10','11','98') THEN '9' 
                           ELSE 'N' END as apoint , 
    CASE WHEN t_accident.f_accident_patient_vechicle_type_id IN ('0') THEN 'N' 
                           WHEN t_accident.f_accident_patient_vechicle_type_id IN ('2') THEN '01' 
                           WHEN t_accident.f_accident_patient_vechicle_type_id IN ('3') THEN '02' 
                           WHEN t_accident.f_accident_patient_vechicle_type_id IN ('4') THEN '04' 
                           WHEN t_accident.f_accident_patient_vechicle_type_id IN ('5') THEN '05' 
                           WHEN t_accident.f_accident_patient_vechicle_type_id IN ('6') THEN '06' 
                           WHEN t_accident.f_accident_patient_vechicle_type_id IN ('7','9') THEN '08' 
                           WHEN t_accident.f_accident_patient_vechicle_type_id IN ('8') THEN '09' 
                           WHEN t_accident.f_accident_patient_vechicle_type_id IN ('10') THEN '03' 
                           WHEN t_accident.f_accident_patient_vechicle_type_id IN ('11') THEN '17' 
                           WHEN t_accident.f_accident_patient_vechicle_type_id IN ('12') THEN '16' 
                           WHEN t_accident.f_accident_patient_vechicle_type_id IN ('13') THEN '11' 
                           WHEN t_accident.f_accident_patient_vechicle_type_id IN ('14') THEN '18' 
                           WHEN t_accident.f_accident_patient_vechicle_type_id IN ('15','16') THEN '14' 
                           WHEN t_accident.f_accident_patient_vechicle_type_id IN ('17') THEN '13' 
                           ELSE '99' END as injt ,
                           CASE WHEN t_visit.f_visit_service_type_id IN ('3') THEN '3' 
            WHEN t_visit.f_visit_service_type_id IN ('1','2','4') THEN '2' ELSE '' END AS pmi,
            CASE WHEN substr(t_accident.f_accident_visit_type_id,1,1) IN ('1') THEN '0'  
			WHEN substr(t_accident.f_accident_visit_type_id,1,1) IN ('2','3','4','5') THEN '3'
			WHEN substr(t_accident.f_accident_visit_type_id,1,1) IN ('9') THEN 'N'  ELSE '9' END AS atohosp,
    CASE WHEN t_accident.accident_airway = '1' THEN '1' 
                           WHEN t_accident.accident_airway = '2' THEN '0'
                           WHEN t_accident.accident_airway = '3' THEN '3'
                           ELSE '0' END as airway ,
    CASE WHEN t_accident.accident_alcohol IN ('1') THEN '1' ELSE '0' END as risk1 ,
    '0' as risk2 ,
    CASE WHEN t_accident.f_accident_protection_type_id IN ('1') THEN '0' 
                           WHEN t_accident.f_accident_protection_type_id IN ('2')  THEN '1' ELSE 'N' END as risk3 ,
    CASE WHEN t_accident.f_accident_protection_type_id IN ('1') THEN '0' 
                           WHEN t_accident.f_accident_protection_type_id IN ('2')  THEN '1' ELSE 'N' END  as risk4 ,
    CASE WHEN t_accident.accident_stopbleed = '1' THEN '1'
                           WHEN t_accident.accident_stopbleed = '2' THEN '0'
                           WHEN t_accident.accident_stopbleed = '3' THEN '3'			
                           ELSE '0' END as blood ,
    CASE WHEN substr(t_accident.accident_splint,1,1) IN ('1') THEN '1'
                           WHEN substr(t_accident.accident_splint,1,1) IN ('2') THEN '0'
                           WHEN substr(t_accident.accident_splint,1,1) IN ('3') THEN '3'
                           ELSE '0' END as splintc ,
                CASE WHEN t_accident.accident_splint = '1' THEN '1' 
                           WHEN t_accident.accident_splint = '2' THEN '0'
                           WHEN t_accident.accident_splint = '3' THEN '3'
                           ELSE '0' END AS splint,
    CASE WHEN t_accident.accident_fluid = '1' THEN '1'
                           WHEN t_accident.accident_fluid = '2' THEN '0'
                           WHEN t_accident.accident_fluid = '3' THEN '3'
                           ELSE '3' END as iv,
                           to_timestamp(CASE WHEN t_visit.f_visit_type_id = '1' then t_accident.accident_staff_record_date_time else t_visit.visit_financial_discharge_time end ,'YYYY-mm-dd HH24:MI:SS') - INTERVAL '543 years' as disc_date_er,
                           CASE WHEN t_visit.f_visit_opd_discharge_status_id IN ('51') THEN '2' 
      WHEN t_visit.f_visit_opd_discharge_status_id IN ('52') THEN '6' 
      WHEN t_visit.f_visit_opd_discharge_status_id IN ('54') THEN '3' 
      WHEN t_visit.f_visit_opd_discharge_status_id IN ('55') THEN '1'  
      WHEN LENGTH(t_visit.f_visit_ipd_discharge_status_id)>0 THEN '7' 
      ELSE '' END AS staer ,
      CASE WHEN t_visit.f_visit_ipd_discharge_type_id in ('1') THEN '1'
      WHEN t_visit.f_visit_ipd_discharge_type_id in ('4') THEN '2'
      WHEN t_visit.f_visit_ipd_discharge_type_id in ('2') THEN '3'
      WHEN t_visit.f_visit_ipd_discharge_type_id in ('3') THEN '4'
      WHEN t_visit.f_visit_ipd_discharge_type_id in ('8','9') THEN '5'
      WHEN t_visit.f_visit_ipd_discharge_type_id in ('5','6') THEN '6' ELSE '' END AS staward
      `))
            .where(where)
            .whereRaw(`concat(to_number(substr(t_accident.accident_to_hos_date,1,4),'9999')-543
            ,'-',substr(t_accident.accident_to_hos_date,6)) = ?`, [date])
            .limit(maxLimit);
    }
    getDiagnosisOpd(knex, visitno) {
        return knex('t_accident')
            .select('t_visit.visit_vn as visitno', 't_accident.icd10_number as diagcode')
            .innerJoin('t_visit', 't_accident.t_visit_id', 't_visit.t_visit_id')
            .where('t_visit.visit_vn', "=", visitno);
    }
    getProcedureOpd(knex, columnName, searchNo, hospCode) {
        return knex('procedure_opd')
            .where(columnName, "=", searchNo);
    }
    getChargeOpd(knex, columnName, searchNo, hospCode) {
        return knex('charge_opd')
            .where(columnName, "=", searchNo);
    }
    getDrugOpd(knex, columnName, searchNo, hospCode) {
        return knex('drug_opd')
            .where(columnName, "=", searchNo);
    }
    getAdmission(knex, columnName, searchNo, hospCode) {
        return knex('admission')
            .where(columnName, "=", searchNo);
    }
    getDiagnosisIpd(knex, columnName, searchNo, hospCode) {
        return knex('diagnosis_ipd')
            .where(columnName, "=", searchNo);
    }
    getProcedureIpd(knex, columnName, searchNo, hospCode) {
        return knex('procedure_ipd')
            .where(columnName, "=", searchNo);
    }
    getChargeIpd(knex, columnName, searchNo, hospCode) {
        return knex('charge_ipd')
            .where(columnName, "=", searchNo);
    }
    getDrugIpd(knex, columnName, searchNo, hospCode) {
        return knex('drug_ipd')
            .where(columnName, "=", searchNo);
    }
    getAccident(knex, visitno) {
        return knex('er_regist')
            .select('er_regist.vn', 'ovst.hn', 'ovst.vstdate as adate', 'ovst.vsttime as atime', 'er_nursing_detail.accident_person_type_id', 'er_nursing_detail.accident_belt_type_id as belt', 'opdscreen.bps as bp1', 'opdscreen.bpd as bp2', 'er_nursing_detail.gcs_e as e', 'er_nursing_detail.gcs_v as v', 'er_nursing_detail.gcs_m as m')
            .leftJoin(`ovst`, function () { this.on('ovst.vn', '=', 'er_regist.vn'); })
            .leftJoin(`patient`, function () { this.on('patient.hn', '=', 'ovst.hn'); })
            .leftJoin(`er_nursing_detail`, function () { this.on('er_nursing_detail.vn', '=', 'ovst.vn'); })
            .leftJoin(`opdscreen`, function () { this.on('opdscreen.hn', '=', 'ovst.hn'); })
            .where('er_regist.vn', "=", visitno);
    }
    getAppointment(knex, columnName, searchNo, hospCode) {
        return knex('appointment')
            .where(columnName, "=", searchNo);
    }
    getData(knex, tableName, columnName, searchNo, hospCode) {
        return knex(tableName)
            .where(columnName, "=", searchNo)
            .limit(5000);
    }
}
exports.HisHospitalOsModel = HisHospitalOsModel;
