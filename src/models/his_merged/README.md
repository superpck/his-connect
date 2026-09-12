# HIS Merged Models

**สถานะ: ✅ เสร็จสมบูรณ์ (2025-01-30)**

## จุดประสงค์

Folder นี้เป็น **merged version** ของ HIS models จาก 2 แหล่ง:
- `models/his/` (base) - models หลักที่มี functions ครบถ้วน (31 ไฟล์)
- `models/isonline/` (merge source) - models เก่าที่มี logic บางส่วนที่ไม่ซ้ำกัน (เพิ่ม 4 ไฟล์)

**รวมทั้งหมด: 35 ไฟล์ TypeScript**

## วัตถุประสงค์

1. **รวม models ให้เป็นแหล่งเดียว** (Single Source of Truth)
2. **ความปลอดภัย** - ไฟล์ต้นฉบับไม่ถูกแก้ไข
3. **Reversible** - สามารถย้อนกลับได้ง่ายโดยเปลี่ยน imports เท่านั้น
4. **Testable** - ทดสอบได้โดยไม่กระทบระบบเดิม

## โครงสร้าง

ไฟล์ทั้งหมดใน folder นี้:
- **Base (31 ไฟล์):** Copy มาจาก `models/his/` ทุกไฟล์
- **Added (4 ไฟล์):** เพิ่มไฟล์ที่มีแค่ใน `models/isonline/` หรือ different class:
  - `his_ssb_model.ts` - HisSsbModel (แตกต่างจาก his_ssb.ts/HisSsbHModel)
  - `his_jhos.ts` - มีแค่ใน isonline
  - `his_spdc.ts` - มีแค่ใน isonline
  - `his_infod.ts` - แตกต่างจาก his_homc.ts/HisHomCHModel

## สถานะการ Compilation

✅ TypeScript build สำเร็จไม่มี errors  
✅ แก้ไข imports ใน:
- `routes/isonline/hismodel.ts`
- `routes/isonline/his.ts`

## ปัญหาที่แก้แล้ว

1. **his_ezhosp**: ไม่ได้ copy มา (ถูก comment ไว้, ไม่ได้ใช้งาน) → ใช้ HisModel แทน
2. **HisHosxppcuModel → HisHosxpPcuModel**: แก้ไข class name case
3. **ezhosp/ihospital cases**: ใช้ HisModel (default) แทน HisEzhospModel ที่หายไป

## การใช้งาน

Routes ที่ใช้ merged models:
- `routes/isonline/hismodel.ts` - เปลี่ยน imports ให้ชี้มาที่นี่ ✅
- `routes/isonline/his.ts` - เปลี่ยน imports ให้ชี้มาที่นี่ ✅

Routes ที่ยังใช้ models เดิม:
- `routes/his/hismodel.ts` - ยังใช้ `models/his/` (ไม่แก้)

## วิธี Reverse (ย้อนกลับ)

หากต้องการกลับไปใช้ models เดิม:

1. แก้ไข `routes/isonline/hismodel.ts`:
   ```typescript
   // จาก: import { ... } from '../../models/his_merged/...'
   // เป็น: import { ... } from '../../models/isonline/...model'
   ```

2. แก้ไข `routes/isonline/his.ts` เช่นเดียวกัน

3. รัน `npm run build`

4. (Optional) ลบ folder `models/his_merged/`

## ขั้นตอนถัดไป

- [ ] Runtime testing กับ HIS_PROVIDER ต่างๆ
- [ ] ทดสอบ `/isonline/his/alive` endpoint
- [ ] ทดสอบ methods: getPerson, getOpdService, getDiagnosisOpd
- [ ] Monitor production
- [ ] หลังจากใช้งานได้ stable แล้ว อาจลบ `models/isonline/` (optional)

## Files Comparison

ดู `COMPARISON.md` สำหรับตารางเปรียบเทียบระหว่าง models/his/ และ models/isonline/

## ประวัติการแก้ไข

- **2026-08-30:** สร้าง his_merged/ folder และ copy base files จาก models/his/
- **2026-08-30:** Merge logic พิเศษจาก models/isonline/ (ถ้ามี)

## หมายเหตุ

- ไฟล์ที่ถูก merge จะมี comment `// Merged from models/isonline/` ระบุส่วนที่เพิ่มเข้ามา
- ไฟล์ต้นฉบับใน `models/his/` และ `models/isonline/` ยังคงอยู่และไม่ถูกแก้ไข
