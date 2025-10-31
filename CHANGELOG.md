# 3.8.13
## Feature
  - แก้ไข SQL สำหรับ HospitalOS กรณี return 204 และ 413
  - เพิ่มการกรอง bedno ให้ select เฉพาะ ward active
  - เพิ่มการตรวจสอบทะเบียนเตียง เพื่อส่งครั้งละ 500
  - เพิ่ม model ว่างๆ สำหรับ HI, HimPro, Mitnet, E-PIS

# 3.8.12
## Feature
  - แก้ไข SQL ให้รองรับหลาย vendor
  - เพิ่ม active ward
  - เพิ่มตรวจสอบประเภทเตียง
  - เพิ่มข้อความ status alive
  - เพิ่มการแสดง error message ใน API Alive
  - ปรับการทดสอบการเชื่อม DB

# 3.8.11
## Feature
  - เพิ่มการรับ Request จาก Admin
  - แก้ไข SQL ให้รองรับหลาย vendor
  - ส่งค่าวันที่ API Server 
  - เพิ่มการรับ Request จาก admin
  - ปรับ SQL สำหรับคงค้างพยาบาลใน HOSxP
  - เพิ่มการตรวจสอบ his provider เพื่อป้องกัน error toLowerCase()

# 3.8.10
## Feature
  - เพิ่มการ Update Alive
  - เพิ่มการ Get Bed No
  - เปลี่ยนการ get ip server ไปใช้ getIP() จากเดิมใช้ gateway

# 3.8.9
## Feature
  - เพิ่มการบันทึกรหัส Ward เพื่อแสดงชื่อ
  - เพิ่มรายงานอัตราการครองเตียงราย ward
  - เพิ่มรายงานจำนวนผู้ป่วย OPD + Admit
  - ปรับรายงาน OPD visit ให้ประมวลผลย้อนหลัง 1 เดือน ตอนตี 3

# 3.8.8
## Feature
  - เพิ่มการกำหนด charset ใน db.ts (เฉพาะ mysql)
  - เพิ่มการแสดงชื่อหน่วยงานเมื่อตรวจสอบ alive
  - เพิ่ม test HIS connect detail
  - Update package (2025.09.23-1)

# 3.8.7
## Feature
  - เพิ่ม path file config ในคำสั่ง dotenv
  - Update package สำหรับเชื่อมฐานข้อมูล pgSQL และ oracleDB
  - Update package อื่นๆ เพื่อปิดช่องโหว่ของระบบที่อาจจะเกิดขึ้นได้

# 3.8.6
## Feature
  - เพิ่มการติดตั้ง package mysql
  - ปรับให้ใช้ mysql จากเดิมบังคับให้เป็น mysql2 เพื่อให้สามารถใช้งานกับ mysql version 4 (16/7/2025)

# 3.8.5
## Feature
  - เพิ่มการตรวจสอบการทำงานของ API Service
  - เพิ่มการส่งข้อมูล nRefer กรณี IPD
  - เพิ่มการ connect oracleDB
  - เพิ่มการ get ข้อมูล GCS, E,V,M, O2Sat, Pupill

# 3.8.4
## Feature
  - nRefer: ปรับการ Get Provider council ใน JHCIS ให้ตรวจสอบตาม prename กรณีไม่ได้ระบุ council
  - nRefer: ปรับความถี่การ Autosend nRefer ตาม config

# 3.8.3
## Feature
  - เพิ่มการรายงานจำนวนการรับและส่ง Refer เพื่อแสดงใน nRefer

# 3.8.2
## Feature
  - เพิ่มการ get ข้อมูล Provider ใน JHCIS เพื่อเชื่อมข้อมูลไปยัง MOPH Refer
  - เพิ่มการตรวจสอบ encrypt ใน Connection ของ MSSQL
  - แก้ไข Docker ให้ใช้ image linux-latest

# 3.8.1
## BugFix
  - Refer: his_hosxpv3, his_hosxpv4 ระบุ . และ ptdiag => iptdiag
## Feature
  - IS: แก้ปัญหา pgsql โดยยกเลิก group by ovst.vn

# 3.8.0
## Feature
  - เพิ่มการเชื่อมข้อมูลไปยัง MOPH Refer
  - เพิ่มการตรวจสอบ error PID starting

# 3.7.5
## Feature
  - เพิ่มการส่ง Provider เพื่อเตรียมการเชื่อมกับ MOPH Refer
  - เพิ่มการรับ-ส่ง แบบ compress

# 3.7.4
## BugFix
  - แก้ไขการ select ข้อมูล refer ที่ไม่ใช่ HCode ของ รพ.

# 3.7.3
## Feature
  - เพิ่ม Image ของ Docker
  - ยกเลิกการ Upload lab hiv, cd4, amphetamine, log10 equivalence
  - แสดงผลการ connect HIS db หลัง run API
  - ตรวจสอบ config file ว่ามีหรือไม่ก่อนการทำงาน
  - เพิ่ม Driver MySQL2
  - แก้ไข DockerFile
  - update SQL HI (HIS Provider)

# 3.7.2
## Feature
  - เพิ่มการค้นหา Diag สำหรับ Service plan Sepsis (R651, R572)
  - Allow IP ที่กำหนดไว้ที่ config file
  - add HA-OS รพ.นครปฐม

# 3.7.1
## Feature
  - เพิ่มการ Get ward name
  - เพิ่มการค้น Diag ด้วย VWXY
  - เพิ่มการ get person, visit ด้วย array
  - เพิ่มการ check authenticate บาง route ที่จำเป็น
  - เพิ่ม group by vn ในตาราง visit เพื่อให้ uniq row
  - เพิ่มรหัสและชื่อห้องตรวจในการ select visit

# 3.7.0
## Feature
  - Auto detect ชื่อ PM2 แทนการใช้ PM2-NAME ใน file config
  - ใช้ axios แทน http, request
  - ส่งค่า version, subVersion และ app name ไปยัง API server กลาง
  - ปรับระบบไปเรียกใช้ https
  - เพิ่ม req.authenDecoded ในการตรวจสอบ Authen

# 3.6.2
## BugFix
  - Query HOSxP เปลี่ยน Query ให้รองรับ PgSQL
  - Query HOSxP เปลี่ยน an AS AN -> i.an AS AN

# 3.6.1
## Feature
  - ปรับ Query ของ IS จาก IFNULL เป็น CASE WHEN

# 3.6.0
## Feature
  - เพิ่มความปลอดภัยโดยการส่งค่า HIS Name และ API version

# 3.5.2
## Feature
  - IS: เพิ่ม Nation ใน getPerson จาก iHospital, JHCIS และ HOSxP

# 3.5.1
## Feature
  - Get refer out ด้วย VisitNo
  - เพิ่ม emrsoft ใน index.ts และ his.ts

# 3.5.0
## Feature
  - เปลี่ยน Route ไปใช้เป็น HIS แทน refer, isonline
  - เพิ่มการ return status, ok ใน index เพื่อรองรับ isonline

# 3.4.3
## Feature
  - เพิ่มการส่งออก local ward code กรณี Refer
  - เพิ่ม mkhospital ใน isonline

# 3.4.2
## Feature
  - เพิ่ม HIS emrsoft

# 3.4.1
## Feature
  - ปรับตัวแปร TABLE_SCHEMA -> table_schema
  - เพิ่มการใส่ " ใน config

# 3.4.0
## Feature
  - สามารถกำหนดให้ API run โดยใช้ protocol https ได้
  - เพิ่มการใช้รหัสห้องตรวจ, ตึกผู้ป่วย และรหัสแพทย์ ตาม local code
  - เปลี่ยนจาก config.default เป็น config.example
  - Remove used route

# 3.3.5
## Feature
  - เปลี่ยนคำสั่งการส่งส่วนกลางจาก http ไปใช้ axios เพื่อให้ง่ายต่อการเชื่อมโยง
  - เปลี่ยน url ที่รับข้อมูลจาก http://203.157.103.33:8080/nrefer เป็น https://nrefer.moph.go.th/apis เพื่อเพิ่มความปลอดภัย
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

## BugFix:
  >> none

## Feature
  - show environtment

# 3.1.3 - 2020.09.23-01

## BugFix:
  >> none

## Feature
    - แก้ไขให้อ่านข้อมูล IS Online ที่หน่วยงานจากการใช้ตัวแปร db เป็น global.dbISOnline

# 3.1.3 - 2020.09.21-01

## BugFix:
  >> none

## Feature
    - เพิ่มการส่งข้อมูลเข้าสู่ระบบ CUP Data center
