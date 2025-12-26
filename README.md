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

## 1.2 Hospital-OS สร้าง VIEW สำหรับดึงข้อมูล

สำหรับ Hospital-OS ต้องสร้าง views ใน schema `his_connect` ก่อน

### ตารางสรุป Views

| View Name                                 | Function(s)                                    | File                                       |
| ----------------------------------------- | ---------------------------------------------- | ------------------------------------------ |
| `his_connect.view_ward`                   | getWard()                                      | his_hospitalos.ts                          |
| `his_connect.view_bed`                    | getBedNo(), countBedNo()                       | his_hospitalos.ts                          |
| `his_connect.view_ipd_concurrent`         | concurrentIPDByWard(), concurrentIPDByClinic() | his_hospitalos.ts                          |
| `his_connect.view_opd_visit_summary`      | sumOpdVisitByClinic()                          | his_hospitalos.ts                          |
| `his_connect.view_visit_opd`              | getVisitForMophAlert()                         | his_hospitalos.ts                          |
| `his_connect.view_department`             | getDepartment()                                | his_hospitalos.ts                          |
| `his_connect.view_dr`                     | getDr()                                        | his_hospitalos.ts                          |
| `his_connect.view_refer_out`              | getReferOut()                                  | his_hospitalos.ts                          |
| `his_connect.view_person`                 | getPerson()                                    | his_hospitalos.ts, his_hospitalos.model.ts |
| `his_connect.view_address`                | getAddress()                                   | his_hospitalos.ts                          |
| `his_connect.view_service`                | getService()                                   | his_hospitalos.ts                          |
| `his_connect.view_diagnosis_opd`          | getDiagnosisOpd()                              | his_hospitalos.ts, his_hospitalos.model.ts |
| `his_connect.view_diagnosis_opd_accident` | getDiagnosisOpdAccident()                      | his_hospitalos.ts                          |
| `his_connect.view_diagnosis_opd_vwxy`     | getDiagnosisOpdVWXY()                          | his_hospitalos.ts, his_hospitalos.model.ts |
| `his_connect.view_diagnosis_sepsis_opd`   | getDiagnosisSepsisOpd()                        | his_hospitalos.ts                          |
| `his_connect.view_diagnosis_sepsis_ipd`   | getDiagnosisSepsisIpd()                        | his_hospitalos.ts                          |
| `his_connect.view_lab_request`            | getLabRequest()                                | his_hospitalos.ts                          |
| `his_connect.view_lab_result`             | getLabResult(), getInvestigation()             | his_hospitalos.ts                          |
| `his_connect.view_drug_opd`               | getDrugOpd()                                   | his_hospitalos.ts                          |
| `his_connect.view_admission`              | getAdmission()                                 | his_hospitalos.ts                          |
| `his_connect.view_diagnosis_ipd`          | getDiagnosisIpd()                              | his_hospitalos.ts                          |
| `his_connect.view_diagnosis_ipd_accident` | getDiagnosisIpdAccident()                      | his_hospitalos.ts                          |
| `his_connect.view_procedure_ipd`          | getProcedureIpd()                              | his_hospitalos.ts                          |
| `his_connect.view_charge_ipd`             | getChargeIpd()                                 | his_hospitalos.ts                          |
| `his_connect.view_drug_ipd`               | getDrugIpd()                                   | his_hospitalos.ts                          |
| `his_connect.view_accident`               | getAccident()                                  | his_hospitalos.ts                          |
| `his_connect.view_drug_allergy`           | getDrugAllergy()                               | his_hospitalos.ts                          |
| `his_connect.view_appointment`            | getAppointment()                               | his_hospitalos.ts                          |
| `his_connect.view_refer_history`          | getReferHistory()                              | his_hospitalos.ts                          |
| `his_connect.view_clinical_refer`         | getClinicalRefer()                             | his_hospitalos.ts                          |
| `his_connect.view_investigation_refer`    | getInvestigationRefer()                        | his_hospitalos.ts                          |
| `his_connect.view_care_refer`             | getCareRefer()                                 | his_hospitalos.ts                          |
| `his_connect.view_refer_result`           | getReferResult()                               | his_hospitalos.ts                          |
| `his_connect.view_provider`               | getProvider(), getProviderDr()                 | his_hospitalos.ts                          |
| `his_connect.view_refer_out_summary`      | sumReferOut()                                  | his_hospitalos.ts                          |
| `his_connect.view_refer_in_summary`       | sumReferIn()                                   | his_hospitalos.ts                          |
| `his_connect.view_opd_service`            | getOpdService()                                | his_hospitalos.model.ts                    |
| `his_connect.view_opd_service_by_vn`      | getOpdServiceByVN()                            | his_hospitalos.ts, his_hospitalos.model.ts |

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
