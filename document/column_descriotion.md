# Column Description

คู่มือนี้สรุปความสัมพันธ์ระหว่างคอลัมน์ต้นทางในฐานข้อมูล/นิพจน์ที่ใช้ในแต่ละฟังก์ชัน กับคอลัมน์ที่ถูกส่งออกให้ผู้ใช้งาน พร้อมคำอธิบายสั้น ๆ เพื่อช่วยตรวจสอบความถูกต้องของข้อมูลที่แลกเปลี่ยนกับระบบภายนอก

> หมายเหตุ
> - หากฟังก์ชันดึงข้อมูลผ่านวิวหรือตารางที่มีการเลือกทุกคอลัมน์ (`select *`) จะระบุเป็นข้อความไว้แทนตารางรายละเอียด
> - นิพจน์ที่เป็นค่าคงที่หรือคำนวณจะอธิบายสั้น ๆ ในคอลัมน์ “หมายเหตุ”


## getWard
| column | type | describe |
| --- | --- | --- |
| hospcode | string | รหสัสถานพยาบาล |
| wardcode | string | local code |
| wardname | string | local name |
| std_code | string | รหัสตามมาตรฐาน กบรส. |
| bed_normal | number | จำนวนเตียงสามัญ |
| bed_special | number | จำนวนเตียงพิเศษ |
| bed_icu | number | จำนวนเตียง ICU |
| bed_semi | number | จำนวนเตียง Semi ICU |
| bed_stroke | number | จำนวนเตียง Stroke |
| bed_burn | number | จำนวนเตียง Semi Burn |
| bed_minithanyaruk | number | จำนวนเตียงมินิธนารักษ์ |
| bed_extra | number | จำนวนเตียงเสริม |
| lr | number | จำนวนเตียงรอคลอด |
| clip | number | จำนวน Clip เด็ก |
| homeward | number | จำนวนเตียง homeward |
| isactive | 0, 1 | 1=ใช้งาน |

## getBedNo
| column | type | describe |
| --- | --- | --- |
| bedno | string | หมายเลขเตียง |
| bedtype | string | รหัสประเภทเตียง |
| bedtype_name | string | ชื่อเตียง |
| roomno | string | เลขห้อง |
| wardcode | string | รหัสวอร์ด |
| wardname | string | ชื่อวอร์ด |
| std_code | string | รหัสตามมาตรฐาน กบรส. |
| bed_type | string | จัดกลุ่มเตียง (N/S/ICU/LR/HW) กรณีไม่สามารถระบุ std_code |
| isactive | 0, 1 | 1=ใช้งาน |

## concurrentIPDByWard
คอลัมน์:
| column | type | describe |
| --- | --- | --- |
| hospcode | string | รหสัสถานพยาบาล |
| date | datetime | เวลาที่ประมวลผล |
| wardcode | string | local code |
| wardname | string | local name |
| std_code | string | รหัสตามมาตรฐาน กบรส. |
| cases | number | คงค้างพยาบาลทั้งหมด (รวม discharge ในเวลา) |
| new_case | number | รับใหม่ในเวลา |
| discharge | number | จำหน่ายในเวลา |
| death | number | เสียชีวิตในเวลา |
| icu | number | จำนวน case icu |
| semi | number | จำนวน case semi-icu |
| homeward | number | จำนวน case homeward |
| clip | number | จำนวนเด็กแรกเกิด |

ตัวอย่าง filter
| ข้อมูลวันที่ 1 ตุลาคม 2568 เวลา 12:00
| dateStart = '2025-10-01 12:00:00'
| dateEnd = '2025-10-01 12:59:59'
| WHERE dateAdmit <= dateStart AND (dateDisc IS NULL OR dateDisc >= dateEnd)

## concurrentIPDByClinic
คอลัมน์:
| column | type | describe |
| --- | --- | --- |
| hospcode | string | รหสัสถานพยาบาล |
| date | datetime | เวลาที่ประมวลผล |
| cliniccode | string | code ตาม HDC |
| clinicname | string | name ตาม HDC |
| cases | number | คงค้างพยาบาลทั้งหมด (รวม discharge) |
| new_case | number | รับใหม่ในเวลา |
| discharge | number | จำหน่ายในเวลา |
| death | number | เสียชีวิตในเวลา |
| icu | number | จำนวน case icu |
| semi | number | จำนวน case semi-icu |
| homeward | number | จำนวน case homeward |
| clip | number | จำนวนเด็กแรกเกิด |

## sumOpdVisitByClinic
คอลัมน์:
| column | type | describe |
| --- | --- | --- |
| hospcode | string | รหสัสถานพยาบาล |
| date | datetime | เวลาที่ประมวลผล |
| cliniccode | string | code ตาม HDC |
| clinicname | string | name ตาม HDC |
| cases | number | OPD visit (ไม่รวมไม่รอตรวจ ไม่มาตามนัด) |
| admit | number | จำนวนสั่ง Admission |




## testConnect
| Source / Expression | Output Column | หมายเหตุ |
| --- | --- | --- |
| `opdconfig.hospitalname` / `opdconfig.hospitalcode` | `hospname` | ชื่อหรือรพ.โค้ดจากตาราง `opdconfig`; คืนค่า `hospitalname` หากมี ไม่เช่นนั้นใช้ `hospitalcode` |
| `patient.hn` (ตรวจมีหรือไม่) | `connection` | คืน `true/false` จากผลการดึง HN ตัวอย่าง |
| `information_schema.SCHEMATA.DEFAULT_CHARACTER_SET_NAME` | `charset` | ค่า character set ของฐานข้อมูล (เฉพาะ MySQL) |

## getTableName
| Source / Expression | Output Column | หมายเหตุ |
| --- | --- | --- |
| `information_schema.tables.table_name` | `table_name` | ชื่อตารางในสกีมาที่กำหนด |

## getDepartment
| Source / Expression | Output Column | หมายเหตุ |
| --- | --- | --- |
| `clinic.clinic` | `department_code` | รหัสห้องตรวจ |
| `clinic.name` | `department_name` | ชื่อห้องตรวจ |
| ค่าคงที่ `'-'` | `moph_code` | ค่า placeholder สำหรับรหัสมาตรฐาน |
| `CASE WHEN LOCATE('ฉุกเฉิน', name) > 0 THEN 1 ELSE 0 END` | `emergency` | Flag ห้องฉุกเฉิน (1=ใช่, 0=ไม่ใช่) |

## getDr
| Source / Expression | Output Column | หมายเหตุ |
| --- | --- | --- |
| `doctor.code` | `dr_code` | รหัสแพทย์ |
| `doctor.licenseno` | `dr_license_code` | เลขใบประกอบวิชาชีพ |
| `doctor.name` | `dr_name` | ชื่อ-นามสกุลแพทย์ |
| `doctor.expire` | `expire_date` | วันหมดอายุใบประกอบ |

## getReferOut
| Source / Expression | Output Column | หมายเหตุ |
| --- | --- | --- |
| ค่าคงที่ `'${hisHospcode}'` | `hospcode` | รหัสหน่วยบริการต้นทาง |
| `CONCAT(r.refer_date, ' ', r.refer_time)` | `refer_date` | วันเวลาที่ออกใบ Refer |
| `r.refer_number` | `referid` | เลขที่ Refer |
| `r.refer_hospcode` | `hosp_destination` | รหัสหน่วยบริการปลายทาง |
| `r.hn` | `PID` | PID (ซ้ำกับ HN) |
| `r.hn` | `hn` | HN ผู้ป่วย |
| `pt.cid` | `CID` | เลขบัตรประชาชน |
| `r.vn` | `vn` | VN ผู้ป่วย (ไม่ตั้ง alias) |
| `r.vn` | `SEQ` | เลขลำดับ (seq) |
| `an_stat.an` | `AN` | AN ผู้ป่วยใน (ถ้ามี) |
| `pt.pname` | `prename` | คำนำหน้าชื่อ |
| `pt.fname` | `fname` | ชื่อ |
| `pt.lname` | `lname` | นามสกุล |
| `pt.birthday` | `dob` | วันเกิด |
| `pt.sex` | `sex` | เพศ |
| `r.referout_emergency_type_id` | `EMERGENCY` | ระดับฉุกเฉินตาม refer |
| `r.doctor` | `dr` | รหัสแพทย์ผู้ออกใบ refer |
| `doctor.licenseno` | `provider` | เลขใบประกอบของแพทย์ |
| `r.request_text` | `REQUEST` | ข้อความคำขอ refer |
| `r.pdx` | `dx` | รหัสวินิจฉัยหลัก |
| `refer_vital_sign.cc` | `cc` | อาการสำคัญ |
| `CASE WHEN r.pmh THEN r.pmh ELSE opdscreen.pmh END` | `PH` | ประวัติการเจ็บป่วยเดิม |
| `CASE WHEN r.hpi THEN r.hpi ELSE opdscreen.hpi END` | `PI` | ประวัติปัจจุบัน |
| `CASE WHEN refer_vital_sign.pe THEN refer_vital_sign.pe ELSE r.treatment_text END` | `PHYSICALEXAM` | ผลตรวจร่างกาย |
| `CASE WHEN refer_vital_sign.pre_diagnosis THEN refer_vital_sign.pre_diagnosis ELSE r.pre_diagnosis END` | `diaglast` | วินิจฉัยล่าสุด |
| `IF((SELECT COUNT(an) FROM an_stat WHERE an = r.vn) = 1, r.vn, NULL)` | `an` | VN ที่เป็น AN หากเป็นผู้ป่วยใน |
| `r.accept_point` | `clinic` | จุดรับเข้า/คลินิก |

## getPerson
| Source / Expression | Output Column | หมายเหตุ |
| --- | --- | --- |
| ค่าคงที่ `'${hisHospcode}'` | `HOSPCODE` | รหัสหน่วยบริการ |
| `h.house_id` | `HID` | เลขประจำบ้าน |
| `p.cid` | `CID` | เลขประจำตัวประชาชน |
| `p.pname` | `PRENAME` | คำนำหน้าชื่อ |
| `p.fname` | `NAME` | ชื่อ |
| `p.lname` | `LNAME` | นามสกุล |
| `p.hn` | `HN` | HN |
| `p.hn` | `PID` | PID (ตามมาตรฐาน HDC) |
| `p.sex` | `SEX` | เพศ |
| `p.birthday` | `BIRTH` | วันเกิด |
| `IF(p.marrystatus IN (1..6), p.marrystatus, '9')` | `MSTATUS` | สถานะสมรส |
| `IF(person.person_house_position_id = 1, '1', '2')` | `FSTATUS` | สถานะประจำบ้าน |
| `COALESCE(o.occupation, '000')` | `OCCUPATION_OLD` | อาชีพ (รหัสเดิม) |
| `COALESCE(o.nhso_code, '9999')` | `OCCUPATION_NEW` | อาชีพ (รหัส สปสช.) |
| `COALESCE(nt0.nhso_code, '099')` | `RACE` | เชื้อชาติ |
| `COALESCE(nt1.nhso_code, '099')` | `NATION` | สัญชาติ |
| `COALESCE(p.religion, '01')` | `RELIGION` | ศาสนา |
| `COALESCE(e.provis_code, '9')` | `EDUCATION` | ระดับการศึกษา |
| `p.father_cid` | `FATHER` | เลขบัตรประชาชนบิดา |
| `p.mother_cid` | `MOTHER` | เลขบัตรมารดา |
| `p.couple_cid` | `COUPLE` | เลขบัตรคู่สมรส |
| ซับคิวรี `person_village_duty` | `VSTATUS` | สถานะในชุมชน |
| `person.movein_date` | `MOVEIN` | วันที่ย้ายเข้า |
| `COALESCE(person.person_discharge_id, '9')` | `DISCHARGE` | สถานะจำหน่าย |
| `person.discharge_date` | `DDISCHARGE` | วันที่จำหน่าย |
| เงื่อนไข `@blood` | `ABOGROUP` | กลุ่มเลือด ABO (จากตัวแปรระบบ) |
| `p.bloodgroup_rh` | `RHGROUP` | Rh factor |
| `pl.nhso_code` | `LABOR` | สถานะอาชีพแรงงาน |
| `p.passport_no` | `PASSPORT` | เลขหนังสือเดินทาง |
| `p.type_area` | `TYPEAREA` | ประเภทพื้นที่อาศัย |
| `p.mobile_phone_number` | `MOBILE` | หมายเลขโทรศัพท์ |
| `p.deathday` | `dead` | วันที่เสียชีวิต |
| `CASE WHEN p.last_update IS NULL THEN p.last_update ELSE p.last_visit END` | `D_UPDATE` | วันที่ปรับปรุงล่าสุด |

## getAddress
| Source / Expression | Output Column | หมายเหตุ |
| --- | --- | --- |
| ค่าคงที่ `'${hisHospcode}'` | `hospcode` | รหัสหน่วยบริการ |
| `pt.cid` | `cid` | เลขประชาชน |
| `pt.hn` | `hn` | HN |
| `pt.hn` | `pid` | PID |
| `IF(p.house_regist_type_id IN (1,2), '1', '2')` | `addresstype` | ประเภทที่อยู่ตามทะเบียน |
| `COALESCE(h.census_id, '')` | `house_id` | รหัสทะเบียนบ้าน |
| `IF(p.house_regist_type_id IN (4),'9',h.house_type_id)` | `housetype` | ประเภทบ้าน |
| `h.house_condo_roomno` | `roomno` | ห้อง (คอนโด/อพาร์ตเมนต์) |
| `h.house_condo_name` | `condo` | ชื่ออาคาร |
| `IF(p.house_regist_type_id IN (4), pt.addrpart, h.address)` | `houseno` | บ้านเลขที่ |
| ค่าคงที่ `''` | `soisub` | ซอยย่อย (เว้นว่าง) |
| ค่าคงที่ `''` | `soimain` | ซอยหลัก (เว้นว่าง) |
| `IF(p.house_regist_type_id IN (4), pt.road, h.road)` | `road` | ถนน |
| `IF(p.house_regist_type_id IN (4), '', v.village_name)` | `villaname` | ชื่อหมู่บ้าน |
| `IF(p.house_regist_type_id IN (4), pt.moopart, v.village_moo)` | `village` | หมู่ที่ |
| `IF(p.house_regist_type_id IN (4), pt.tmbpart, t.tmbpart)` | `tambon` | รหัสตำบล |
| `IF(p.house_regist_type_id IN (4), pt.amppart, t.amppart)` | `ampur` | รหัสอำเภอ |
| `IF(p.house_regist_type_id IN (4), pt.chwpart, t.chwpart)` | `changwat` | รหัสจังหวัด |
| `p.last_update` | `D_Update` | วันที่ปรับปรุง |

## getService
| Source / Expression | Output Column | หมายเหตุ |
| --- | --- | --- |
| ค่าคงที่ `'${hisHospcode}'` | `HOSPCODE` | รหัสหน่วยบริการ |
| `pt.hn` | `PID` | PID |
| `o.hn` | `HN` | HN |
| `pt.cid` | `CID` | เลขประชาชน |
| `os.seq_id` | `seq_id` | เลขลำดับ (ไม่ตั้ง alias) |
| `os.vn` | `SEQ` | VN/SEQ |
| เงื่อนไข `IF` วันที่ | `DATE_SERV` | วันที่รับบริการ |
| เงื่อนไข `IF` เวลา | `TIME_SERV` | เวลาให้บริการ |
| `IF(v.village_moo <> '0','1','2')` | `LOCATION` | 1=ในเขต, 2=นอกเขต |
| เงื่อนไข visit type | `INTIME` | ประเภทผู้ป่วยขณะรับบริการ |
| `COALESCE(p2.pttype_std_code,'9100')` | `INSTYPE` | รหัสสิทธิการรักษา |
| `o.hospmain` | `MAIN` | รหัสหน่วยหลัก |
| เงื่อนไข subtype | `TYPEIN` | ประเภทการมารับบริการ |
| `COALESCE(o.rfrolct, i.rfrolct)` | `REFEROUTHOSP` | รหัสหน่วยส่งต่อออก |
| `COALESCE(o.rfrocs, i.rfrocs)` | `CAUSEOUT` | สาเหตุส่งต่อ |
| `s.waist` | `waist` | รอบเอว |
| `s.cc` | `cc` | อาการสำคัญ |
| `s.pe` | `pe` | ผลตรวจร่างกายย่อ |
| `s.pmh` | `ph` | ประวัติการเจ็บป่วยเดิม |
| `s.hpi` | `pi` | อาการปัจจุบัน |
| `CONCAT('CC:',s.cc,' HPI:',s.hpi,' PMH:',s.pmh)` | `nurse_note` | บันทึกพยาบาลรวม |
| `IF(o.pt_subtype IN ('0','1'), '1', '2')` | `SERVPLACE` | แสดงสถานที่ให้บริการ |
| เงื่อนไขอุณหภูมิ | `BTEMP` | อุณหภูมิ |
| `FORMAT(s.bps,0)` | `SBP` | ความดันช่วงบน |
| `FORMAT(s.bpd,0)` | `DBP` | ความดันช่วงล่าง |
| `FORMAT(s.pulse,0)` | `PR` | ชีพจร |
| `FORMAT(s.rr,0)` | `RR` | อัตราการหายใจ |
| `s.o2sat` | `o2sat` | ค่า O2 Sat |
| `s.bw` | `weight` | น้ำหนัก |
| `s.height` | `height` | ส่วนสูง |
| ค่าคงที่ `'er.gcs_e'` | (ไม่มี alias) | ค่าคงที่ตามโค้ดเดิม |
| ค่าคงที่ `'er.gcs_v'` | (ไม่มี alias) | ค่าคงที่ตามโค้ดเดิม |
| ค่าคงที่ `'er.gcs_m'` | (ไม่มี alias) | ค่าคงที่ตามโค้ดเดิม |
| `er.pupil_l` | `pupil_left` | ขนาดรูม่านตาซ้าย |
| `er.pupil_r` | `pupil_right` | ขนาดรูม่านตาขวา |
| เงื่อนไข ovstost | `TYPEOUT` | ประเภทจำหน่าย |
| `o.doctor` | `dr` | รหัสแพทย์ |
| `doctor.licenseno` | `provider` | เลขใบประกอบ |
| เงื่อนไขซ้ำ `COALESCE(o.rfrocs,i.rfrocs)` | `CAUSEOUT` | สาเหตุจำหน่าย (ข้อมูลซ้ำ) |
| เงื่อนไขรายได้ `vn.inc01 + vn.inc12` | `COST` | ต้นทุนรวม |
| `vn.item_money` | `PRICE` | ราคาเรียกเก็บ |
| `vn.paid_money` | `PAYPRICE` | มูลค่าที่ชำระ |
| `vn.rcpt_money` | `ACTUALPAY` | เงินที่รับจริง |
| เงื่อนไขวันที่เวลา | `D_UPDATE` | เวลาปรับปรุงข้อมูล |
| `vn.hospsub` | `hsub` | หน่วยบริการย่อย |

## getDiagnosisOpd
| Source / Expression | Output Column | หมายเหตุ |
| --- | --- | --- |
| ค่าคงที่ `'${hisHospcode}'` | `HOSPCODE` | รหัสหน่วยบริการ |
| `pt.cid` | `CID` | เลขประชาชน |
| `o.hn` | `PID` | PID |
| `o.hn` | (ไม่มี alias) | HN |
| `q.seq_id` | `seq_id` | หมายเลขลำดับ |
| `q.vn` | `SEQ` | VN |
| `q.vn` | `VN` | VN (ซ้ำ) |
| `o.vstdate` | `DATE_SERV` | วันที่รับบริการ |
| `COALESCE(odx.diagtype, '')` | `DIAGTYPE` | ประเภทการวินิจฉัย |
| `odx.icd10` | `DIAGCODE` | ICD10 |
| `COALESCE(s.provis_code, '')` | `CLINIC` | รหัสคลินิก |
| `d.code` | `PROVIDER` | รหัสแพทย์ |
| `q.update_datetime` | `D_UPDATE` | เวลาปรับปรุง |

## getDiagnosisOpdAccident
เลือกทุกคอลัมน์จาก `ovstdiag` (อ้างชื่อ `dx.*`) และเพิ่ม `icd.name AS diagname` สำหรับรายละเอียดรหัสโรคอุบัติเหตุ

## getDiagnosisOpdVWXY
| Source / Expression | Output Column | หมายเหตุ |
| --- | --- | --- |
| `dx.hn` | `hn` | HN |
| `dx.vn` | `visitno` | หมายเลขเยี่ยม |
| `dx.vstdate` | `date` | วันที่รับบริการ |
| `dx.icd10` | `diagcode` | ICD10 |
| `icd.name` | `diag_name` | ชื่อโรค |
| `dx.diagtype` | `diag_type` | ประเภทวินิจฉัย |
| `dx.doctor` | `dr` | รหัสแพทย์ |
| `dx.episode` | `episode` | ตอนการรักษา |
| ค่าคงที่ `'IT'` | `codeset` | ชุดรหัส |
| `dx.update_datetime` | `d_update` | เวลาปรับปรุง |

## getDiagnosisSepsisOpd
คอลัมน์เหมือนกับ `getDiagnosisOpdVWXY` (ต่างเงื่อนไขคัดเลือก)

## getDiagnosisSepsisIpd
| Source / Expression | Output Column | หมายเหตุ |
| --- | --- | --- |
| `ipt.hn` | `hn` | HN |
| `ipt.vn` | `visitno` | VN |
| `dx.an` | `an` | AN |
| `ipt.dchdate` | `date` | วันที่จำหน่าย |
| `dx.icd10` | `diagcode` | ICD10 |
| `icd.name` | `diag_name` | ชื่อโรค |
| `dx.diagtype` | `diag_type` | ประเภทวินิจฉัย |
| `dx.doctor` | `dr` | รหัสแพทย์ |
| `patient.pname` | `patient_prename` | คำนำหน้าผู้ป่วย |
| `patient.fname` | `patient_fname` | ชื่อ |
| `patient.lname` | `patient_lname` | นามสกุล |
| `ipt.ward` | `wardcode` | รหัสวอร์ด |
| `ward.name` | `wardname` | ชื่อวอร์ด |
| ค่าคงที่ `'IT'` | `codeset` | ชุดรหัส |
| `dx.entry_datetime` | `d_update` | เวลาบันทึก |

## getProcedureOpd
ผลลัพธ์รวม 3 ส่วน (union)
- ส่วนสุขภาพ (health_med_service)
- ER operation
- Dental (`dtmain`)

คอลัมน์รวมที่ส่งออก: `hospcode`, `pid`, `seq_id`, `seq`, `vn`, `date_serv`, `clinic`, `procedcode`, `serviceprice`, `provider`, `d_update`

## getChargeOpd
| Source / Expression | Output Column | หมายเหตุ |
| --- | --- | --- |
| `?` (พารามิเตอร์) | `hospcode` | รหัสหน่วยบริการ |
| `pt.hn` | `pid` | PID |
| `os.seq_id` | `seq_id` | เลขลำดับ |
| `os.vn` | `seq` | VN |
| `os.vn` | `vn` | VN (ไม่ตั้ง alias) |
| เงื่อนไขวันที่ | `date_serv` | วันที่คิดค่าใช้จ่าย |
| `COALESCE(sp.provis_code,'00100')` | `clinic` | รหัสคลินิก |
| `o.income` | `chargeitem` | หมวดรายได้ |
| เงื่อนไข charge list | `chargelist` | รหัสคำสั่งยา/หัตถการ |
| `o.qty` | `quantity` | จำนวน |
| `COALESCE(p2.pttype_std_code,'9100')` | `instype` | สิทธิ |
| `FORMAT(o.cost,2)` | `cost` | ต้นทุน |
| `FORMAT(o.sum_price,2)` | `price` | ราคาคิด |
| ค่าคงที่ `'0.00'` | `payprice` | มูลค่าที่ชำระ (ตั้ง 0) |
| เงื่อนไขเวลาปรับปรุง | `d_update` | เวลาบันทึกล่าสุด |

## getLabRequest
| Source / Expression | Output Column | หมายเหตุ |
| --- | --- | --- |
| ค่าคงที่ `'${hospCode}'` | `hospcode` | รหัสหน่วยบริการ |
| `vn` | `visitno` | VN |
| `lab.hn` | `hn` | HN |
| `lab.an` | `an` | AN |
| `lab.lab_no` | `request_id` | เลขที่ใบสั่ง Lab |
| `lab.lab_code` | `LOCALCODE` | รหัสรายการ Lab ในพื้นที่ |
| `lab.lab_name` | `INVESTNAME` | ชื่อรายการตรวจ |
| `lab.loinc` | `loinc` | รหัส LOINC |
| `lab.icdcm` | `icdcm` | รหัส ICDCM |
| `lab.standard` | `cgd` | รหัสมาตรฐานอื่น |
| `lab.cost` | `cost` | ต้นทุน |
| `lab.lab_price` | `price` | ราคา |
| `lab.date` | `DATETIME_REPORT` | วันที่รายงานผล |

## getLabResult / getInvestigation
| Source / Expression | Output Column | หมายเหตุ |
| --- | --- | --- |
| ค่าคงที่ `'${hisHospcode}'` | `HOSPCODE` | รหัสหน่วยบริการ |
| ค่าคงที่ `'LAB'` | `INVESTTYPE` | ประเภทรายการ (Lab) |
| `lab_head.vn` | `vn` | VN |
| `lab_head.vn` | `visitno` | VN |
| `lab_head.vn` | `SEQ` | VN |
| `lab_head.hn` | `PID` | PID |
| `patient.cid` | `CID` | เลขประชาชน |
| `lab_head.lab_order_number` | `request_id` | เลขที่ใบสั่ง |
| `lab_order.lab_items_code` | `LOCALCODE` | รหัสรายการในระบบ |
| `lab_items.tmlt_code` | `tmlt` | รหัส TMLT |
| `lab_head.form_name` | `lab_group` | กลุ่มแบบฟอร์ม |
| `lab_order.lab_items_name_ref` | `INVESTNAME` | ชื่อรายการ |
| `lab_order.lab_order_result` | `INVESTVALUE` | ผลตรวจ |
| `lab_items.icode` | `ICDCM` | รหัส ICD CM |
| `lab_items.lab_items_sub_group_code` | `GROUPCODE` | รหัสกลุ่มย่อย |
| `lab_items_sub_group.lab_items_sub_group_name` | `GROUPNAME` | ชื่อกลุ่มย่อย |
| เงื่อนไข unit | `UNIT` | หน่วยผลตรวจ (เพิ่ม normal range หากมี) |
| `CONCAT(lab_head.order_date, ' ', lab_head.order_time)` | `DATETIME_INVEST` | วันที่สั่งตรวจ |
| `CONCAT(lab_head.report_date, ' ', lab_head.report_time)` | `DATETIME_REPORT` | วันที่รายงาน |

## getDrugOpd
ส่งออกคอลัมน์: `HOSPCODE`, `PID`, `CID`, `seq_id`, `SEQ`, `vn`, `date_serv`, `clinic`, `DID`, `DID_TMT`, `dcode`, `dname`, `amount`, `unit`, `unit_packing`, `usage_code`, `drug_usage`, `caution`, `drugprice`, `drugcost`, `provider`, `d_update`

## getAdmission
คอลัมน์หลัก: `HOSPCODE`, `PID`, `seq_id`, `SEQ`, `AN`, `cid`, `SEX`, `datetime_admit`, `WARD_LOCAL`, `wardadmit`, `WARDADMITNAME`, `instype`, `typein`, `referinhosp`, `causein`, `ddmitweight`, `admitheight`, `datetime_disch`, `warddisch`, `WARDDISCHNAME`, `dischstatus`, `dischtype`, `referouthosp`, `causeout`, `cost`, `price`, `payprice`, `actualpay`, `dr`, `provider`, `d_update`, `drg`, `rw`, `adjrw`, `wtlos`, `error`, `warning`, `actlos`, `grouper_version`

## getAdmission_
คอลัมน์เหมือน `getAdmission` แต่ดึงผ่าน SQL ตรง (พร้อม `cid` เพิ่มเติม)

## getDiagnosisIpd
| Source / Expression | Output Column | หมายเหตุ |
| --- | --- | --- |
| `?` | `hospcode` | รหัสหน่วยบริการ |
| `pt.hn` | `pid` | PID |
| `ipt.an` | `an` | AN |
| เงื่อนไขวันที่ admit | `datetime_admit` | วันเวลารับไว้ |
| `CONCAT('0', RIGHT(spclty.provis_code,4))` | `warddiag` | รหัสวอร์ดสำหรับ DIAG |
| `iptdiag.diagtype` | `diagtype` | ประเภทวินิจฉัย |
| `iptdiag.icd10` | `diagcode` | ICD10 |
| `icd.name` | `diagname` | ชื่อโรค |
| `iptdiag.doctor` | `provider` | รหัสแพทย์ |
| เงื่อนไขวันที่แก้ไข | `d_update` | เวลาปรับปรุง |
| `pt.cid` | `CID` | เลขประชาชน |

## getDiagnosisIpdAccident
เลือก `dx.*` พร้อม `icd.name AS diagname`

## getProcedureIpd
ส่งออกคอลัมน์: `hospcode`, `pid`, `an`, `datetime_admit`, `wardstay`, `procedcode`, `timestart`, `timefinish`, `serviceprice`, `provider`, `d_update`

## getChargeIpd
ส่งออกคอลัมน์: `hospcode`, `pid`, `an`, `datetime_admit`, `wardstay`, `chargeitem`, `chargelist`, `quantity`, `instype`, `cost`, `price`, `payprice`, `d_update`

## getDrugIpd
ส่งออกคอลัมน์: `HOSPCODE`, `PID`, `AN`, `DATETIME_ADMIT`, `WARDSTAY`, `TYPEDRUG`, `DIDSTD`, `DNAME`, `DATESTART`, `DATEFINISH`, `AMOUNT`, `UNIT`, `UNIT_PACKING`, `DRUGPRICE`, `DRUGCOST`, `PROVIDER`, `D_UPDATE`, `CID`

## getAccident
คอลัมน์หลัก: `hospcode`, `hn`, `pid`, `cid`, `seq_id`, `seq`, `datetime_serv`, `datetime_ae`, `aetype`, `aeplace`, `typein_ae`, `traffic`, `vehicle`, `alcohol`, `nacrotic_drug`, `belt`, `helmet`, `airway`, `stopbleed`, `splint`, `fluid`, `urgency`, `coma_eye`, `coma_speak`, `coma_movement`, `d_update`

## getDrugAllergy
เลือกคอลัมน์: `HOSPCODE`, `PID`, `CID`, `DRUGALLERGY`, `DNAME`, `ALEVE`, `DETAIL`, `INFORMANT`, `DATERECORD`, `INFORMHOSP`, `TYPEDX`, `SYMPTOM`, `D_UPDATE`

## getAppointment
ส่งออก: ค่าคงที่ `hospcode` และทุกคอลัมน์ (`*`) จาก `view_opd_fu`

## getReferHistory
คอลัมน์หลัก: `HOSPCODE`, `REFERID`, `REFERID_PROVINCE`, `PID`, `cid`, `seq_id`, `SEQ`, `AN`, `REFERID_ORIGIN`, `HOSPCODE_ORIGIN`, `DATETIME_SERV`, `DATETIME_ADMIT`, `DATETIME_REFER`, `CLINIC_REFER`, `HOSP_DESTINATION`, `CHIEFCOMP`, `PHYSICALEXAM`, `DIAGFIRST`, `DIAGLAST`, `PSTATUS`, `dr`, `provider`, `PTYPE`, `EMERGENCY`, `PTYPEDIS`, `CAUSEOUT`, `REQUEST`, `PROVIDER`, `D_UPDATE`

## getClinicalRefer
ส่งออก: `hospcode` (ค่าคงที่) + ทุกคอลัมน์จาก `view_clinical_refer`

## getInvestigationRefer
ส่งออก: `hospcode` (ค่าคงที่) + ทุกคอลัมน์จาก `view_investigation_refer`

## getCareRefer
คอลัมน์: `hospcode`, `referid`, `referid_province`, `caretype` (ค่าว่าง), `d_update`

## getReferResult
คอลัมน์หลัก: `HOSPCODE`, `HOSP_SOURCE`, `CID_IN`, `PID_IN`, `SEQ_IN`, `REFERID`, `DATETIME_REFER`, `detail`, `reply_diagnostic`, `reply_recommend`, `REFERID_SOURCE`, `reply_date`, `AN_IN`, `REFERID_PROVINCE`, `DATETIME_IN`, `REFER_RESULT`, `D_UPDATE`

## getProvider
ส่งออกคอลัมน์: `hospcode`, `provider`, `registerno`, `council`, `cid`, `prename`, `name`, `lname`, `sex`, `birth`, `providertype`, `startdate`, `outdate`, `movefrom`, `moveto`, `d_update`

## getProviderDr
คอลัมน์เหมือนกับ `getProvider` แต่รองรับรายการรหัสแพทย์หลายตัว (whereIn)

## getData
ส่งออก: `hospcode` (ค่าคงที่) และทุกคอลัมน์จากตารางที่ระบุ (`select *`)

## sumReferOut
| Source / Expression | Output Column | หมายเหตุ |
| --- | --- | --- |
| `r.refer_date` | `refer_date` | วันที่ออกรายงาน |
| `COUNT(r.vn)` | `cases` | จำนวนผู้ป่วย refer out |

## sumReferIn
| Source / Expression | Output Column | หมายเหตุ |
| --- | --- | --- |
| `referin.refer_date` | `refer_date` | วันที่รับ refer in |
| `COUNT(referin.vn)` | `cases` | จำนวนผู้ป่วย refer in |

