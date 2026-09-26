# HIS Connection API สำหรับ nRefer, ISOnline, และ PHER Plus

## การติดตั้ง

- คู่มือการติดตั้งด้วย NodeJS [เอกสารขั้นตอนการติดตั้ง API](https://connect.moph.go.th/pher-plus/#/main/api-installation)
- Link สำหรับการติดตั้งด้วย Docker [HIS Connect Docker](https://hub.docker.com/r/superpck/his-connect)

# ข้อควรระวัง

```
3.1 user/password ที่เข้าถึงฐานข้อมูล ควรให้สิทธิ์ select อย่างเดียว
3.2 ควรติดตั้ง API บน IP ภายในเครือข่ายเท่านั้น (Private IP)
3.3 ไม่ควรติดตั้ง API บนเครื่องที่มีผู้ใช้งานเข้าถึงได้ง่าย เพื่อป้องกันอ่าน file config
3.4 เพื่อความปลอดภัยในการเข้าถึงฐานข้อมูลส่วนกลาง ควรมีการเปลี่ยนรหัสสำหรับการส่งข้อมูลส่วนกลาง (API Secret Key) ทุก 3-6 เดือน
3.5 ควรยกเลิกการใช้งาน username ที่มีการย้ายหน่วยงาน หรือ ที่ไม่ใช้งานแล้ว
```

# ความปลอดภัย (Security)

```
4.1 รายละเอียดช่องโหว่ที่ตรวจพบและแก้ไขแล้ว ดูใน security_audit.md
4.2 การตั้งค่าฐานข้อมูล (HIS_DB_* / IS_DB_*) ต้องระบุ host, user, database ให้ครบ
    มิฉะนั้นระบบจะแจ้ง error ทันทีตอน start แทนที่จะรอ error ตอน query
4.3 ควรรัน `npm run test:security` หลังแก้ไขโค้ดที่เกี่ยวกับ query ฐานข้อมูล หรือ authentication
```

# Lastupdate

```
ดูใน CHANGELOG.md
```

# credit

```
- อ.สถิตย์ เรียนพิศ https://github.com/siteslave
```
