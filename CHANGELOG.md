# 3.3.5
## Feature
  - เปลี่ยนคำสั่งการส่งส่วนกลางจาก http ไปใช้ axios เพื่อให้ง่ายต่อการเชื่อมโยง
  - เปลี่ยน url ที่รับข้อมูลจาก http://203.157.103.33:8080/nrefer เป็น https://nrefer.moph.go.th/apis/nrefer เพื่อเพิ่มความปลอดภัย
  - ยกเลิกตัวแปรที่ไม่จำเป็นใน file config

# 3.3.4
## Feature
  - เพิ่มการ Connect Oracle, MSSql

# 3.3.3
## Feature
  - แก้ไข charSet เป็น charset
  - set charset เฉพาะ MySQL

# 3.3.2 - 2023.02.02-01
## Feature
  - เพิ่มการ Login ด้วย Keycode จาก Server กระทรวง

# 3.3.1 - 2023.01.31-01
## Feature
  - เพิ่ม HIS iHospital

# 3.3.1 - 2023.01.30-01
## Feature
  - remove alert-node เนื่องจาก windows มักมีปัญหา

# 3.3.1 - 2023.01.24-01
## Feature
  - แก้ไข Bug การแจ้งเตือน Unauthorize

# 3.3.0 - 2023.01.20-01
## Feature
  - ปรับให้รองรับการรับ Request จากระบบ PHER+

# 3.2.2 2022-08-06
## Feature
  - ISOnline เพิ่ม save-lib-hosp สำหรับบันทึกข้อมูล Lib เฉพาะสถานพยาบาล
  - JHCIS: Get DrugAllergy จากตาราง personalergic
  - เพิ่มการ select ข้อมูล IPD กรณีรับ Refer จากวันที่จำหน่าย
  - เปลี่ยนการ select admission จาก p.person_id เป็น i.hn ใน HOSxP
  - admission เพิ่ม local ward name ทั้ง WARDADMITNAME และ WARDDISCHNAME
  - เปลี่ยนการ select รหัสสิทธิ์ จาก ipd.pttype_std1 เป็น ipd.pttype_std2 ใน iHospital

# 3.2.1 2022-07-31
## Feature
  - Get Drug allergy
  - แก้ไขการ select ข้อมูล Refer result (Refer In)

# 3.2.0 2022-06-25
## Feature
  - update package
  - แก้ไขการ select ผล Lab

# 3.1.8 - 2020.12.05-01
## Feature
  - เพิ่มการลบข้อมูล IS

# 3.1.7 - 2020.11.12-01
## Feature
  - nRefer: แก้ไข bug PMK เพิ่มเงื่อนไข REFERTYPE=2
  - ISOnline: add test ISDB
  - ISOnline: แก้ไขการ select ฐาน HOSxP โดยไม่แปลง Code

# 3.1.6 - 2020.10.15-01

## Bug:
  >> none

## Feature
  - show environtment

# 3.1.3 - 2020.09.23-01

## Bug:
  >> none

## Feature
    - แก้ไขให้อ่านข้อมูล IS Online ที่หน่วยงานจากการใช้ตัวแปร db เป็น global.dbISOnline

# 3.1.3 - 2020.09.21-01

## Bug:
  >> none

## Feature
    - เพิ่มการส่งข้อมูลเข้าสู่ระบบ CUP Data center
