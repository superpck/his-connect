# HIS Connection API สำหรับ nRefer, ISOnline, และ PHER Plus

## 1.การติดตั้ง

- คู่มือการติดตั้งด้วย NodeJS [เอกสารขั้นตอนการติดตั้ง API](https://connect.moph.go.th/pher-plus/#/main/api-installation)
- Link สำหรับการติดตั้งด้วย Docker [HIS Connect Docker](https://hub.docker.com/r/superpck/his-connect)

## 1.1 SSB (ตัวอย่าง รพ.สระบุรี) สร้าง VIEW สำหรับดึงข้อมูล

```
- PERSON
- OPD_SERVICE
- DIAGNOSIS
- ADMISSION
```

## 1.2 Hospital-OS สร้าง VIEW และ Function สำหรับดึงข้อมูล

สำหรับ Hospital-OS ต้องสร้าง views และ functions ใน schema `his_connect` ก่อน

### ตารางสรุป Views และ Functions

| File                    | Function                  | PostgreSQL Function               | View Name                   |
| ----------------------- | ------------------------- | --------------------------------- | --------------------------- |
| his_hospitalos.ts       | getDepartment()           | fn_get_department()               | view_department             |
| his_hospitalos.ts       | getDr()                   | fn_get_dr()                       | view_dr                     |
| his_hospitalos.ts       | getReferOut()             | fn_get_refer_out()                | view_refer_out              |
| his_hospitalos.ts       | getPerson()               | fn_get_person()                   | view_person                 |
| his_hospitalos.ts       | getAddress()              | fn_get_address()                  | view_address                |
| his_hospitalos.ts       | getService()              | fn_get_service()                  | view_service                |
| his_hospitalos.ts       | getDiagnosisOpd()         | fn_get_diagnosis_opd()            | view_diagnosis_opd          |
| his_hospitalos.ts       | getDiagnosisOpdAccident() | fn_get_diagnosis_opd_accident()   | view_diagnosis_opd_accident |
| his_hospitalos.ts       | getDiagnosisOpdVWXY()     | fn_get_diagnosis_opd_vwxy()       | view_diagnosis_opd_vwxy     |
| his_hospitalos.ts       | getDiagnosisSepsisOpd()   | fn_get_diagnosis_sepsis_opd()     | view_diagnosis_sepsis       |
| his_hospitalos.ts       | getDiagnosisSepsisIpd()   | fn_get_diagnosis_sepsis_ipd()     | view_diagnosis_sepsis       |
| his_hospitalos.ts       | getLabRequest()           | fn_get_lab_request()              | view_lab_request            |
| his_hospitalos.ts       | getLabResult()            | fn_get_lab_result()               | view_lab_result             |
| his_hospitalos.ts       | getDrugOpd()              | fn_get_drug_opd()                 | view_drug_opd               |
| his_hospitalos.ts       | getProcedureOpd()         | fn_get_procedure_opd()            | view_procedure_opd          |
| his_hospitalos.ts       | getChargeOpd()            | fn_get_charge_opd()               | view_charge_opd             |
| his_hospitalos.ts       | getAdmission()            | fn_get_admission()                | view_admission              |
| his_hospitalos.ts       | getProcedureIpd()         | fn_get_procedure_ipd()            | view_procedure_ipd          |
| his_hospitalos.ts       | getChargeIpd()            | fn_get_charge_ipd()               | view_charge_ipd             |
| his_hospitalos.ts       | getDrugIpd()              | fn_get_drug_ipd()                 | view_drug_ipd               |
| his_hospitalos.ts       | getDiagnosisIpd()         | fn_get_diagnosis_ipd()            | view_diagnosis_ipd          |
| his_hospitalos.ts       | getDiagnosisIpdAccident() | fn_get_diagnosis_ipd_accident()   | view_diagnosis_ipd_accident |
| his_hospitalos.ts       | getAccident()             | fn_get_accident()                 | view_accident               |
| his_hospitalos.ts       | getDrugAllergy()          | fn_get_drug_allergy()             | view_drug_allergy           |
| his_hospitalos.ts       | getAppointment()          | fn_get_appointment()              | view_appointment            |
| his_hospitalos.ts       | getReferHistory()         | fn_get_refer_history()            | view_refer_history          |
| his_hospitalos.ts       | getClinicalRefer()        | fn_get_clinical_refer()           | view_clinical_refer         |
| his_hospitalos.ts       | getInvestigationRefer()   | fn_get_investigation_refer()      | view_investigation_refer    |
| his_hospitalos.ts       | getCareRefer()            | fn_get_care_refer()               | view_care_refer             |
| his_hospitalos.ts       | getReferResult()          | fn_get_refer_result()             | view_refer_result           |
| his_hospitalos.ts       | getProvider()             | fn_get_provider()                 | view_provider               |
| his_hospitalos.ts       | getProviderDr()           | fn_get_provider_dr()              | view_provider               |
| his_hospitalos.ts       | sumReferOut()             | fn_sum_refer_out()                | view_refer_summary          |
| his_hospitalos.ts       | sumReferIn()              | fn_sum_refer_in()                 | view_refer_summary          |
| his_hospitalos.ts       | concurrentIPDByWard()     | fn_concurrent_ipd_by_ward()       | view_ipd_concurrent         |
| his_hospitalos.ts       | concurrentIPDByClinic()   | fn_concurrent_ipd_by_clinic()     | view_ipd_concurrent         |
| his_hospitalos.ts       | sumOpdVisitByClinic()     | fn_sum_opd_visit_by_clinic()      | view_opd_visit_summary      |
| his_hospitalos.ts       | getWard()                 | fn_get_ward()                     | view_ward                   |
| his_hospitalos.ts       | countBedNo()              | fn_count_bed_no()                 | view_bed                    |
| his_hospitalos.ts       | getBedNo()                | fn_get_bed_no()                   | view_bed                    |
| his_hospitalos.ts       | getVisitForMophAlert()    | fn_get_visit_for_moph_alert()     | view_visit_opd              |
| his_hospitalos.model.ts | getPerson()               | fn_get_person_model()             | view_person                 |
| his_hospitalos.model.ts | getOpdService()           | fn_get_opd_service_model()        | view_opd_service            |
| his_hospitalos.model.ts | getOpdServiceByVN()       | fn_get_opd_service_by_vn_model()  | view_opd_service            |
| his_hospitalos.model.ts | getDiagnosisOpd()         | fn_get_diagnosis_opd_model()      | view_diagnosis_opd          |
| his_hospitalos.model.ts | getDiagnosisOpdVWXY()     | fn_get_diagnosis_opd_vwxy_model() | view_diagnosis_opd_vwxy     |

# 2.push to git กรณีเป็นทีมพัฒนา (Develop@MOPH)

```
2.1 > git add .
2.2 > git commit -m "คำอธิบายสิ่งที่แก้ไข"
2.3 > git push origin <branch name>
2.4 กรณี push ไม่ได้ ให้ทำการ git pull ก่อน
```

# 3.ข้อควรระวัง

```
3.1 user/password ที่เข้าถึงฐานข้อมูล ควรให้สิทธิ์ select อย่างเดียว
3.2 ไม่ควรติดตั้ง API บนเครื่องที่มีผู้ใช้งานเข้าถึงได้ง่าย เพื่อป้องกันอ่าน file config
3.3 เพื่อความปลอดภัยในการเข้าถึงฐานข้อมูลส่วนกลาง ควรมีการเปลี่ยนรหัสผ่านสำหรับการส่งข้อมูล IS Online และ API Secret Key ทุก 3-6 เดือน
3.4 ควรยกเลิกการใช้งาน username ที่มีการย้ายงาน หรือ ย้ายสถานที่ทำงาน หรือ ลาออก
```

# 4.Lastupdate

```
ดูใน CHANGELOG.md
```

# 5.credit

```
- อ.สถิตย์ เรียนพิศ https://github.com/siteslave
```
