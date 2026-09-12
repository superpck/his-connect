# HIS Models Comparison Matrix

เปรียบเทียบระหว่าง `models/his/` และ `models/isonline/`

## สรุปผลการเปรียบเทียบ

| ไฟล์ | his_merged/ (จาก his/) | isonline/ | สรุป | การดำเนินการ |
|------|------------------------|-----------|------|--------------|
| his.ts | 46 methods | 19 methods | his_merged มากกว่า 2.4x | ✅ ใช้ his_merged เดิม |
| his_emrsoft.ts | มี getDepartment, getWard, getDr, getReferOut, getPerson (complex) | เบสิก 19 methods | his_merged ครอบคลุมกว่ามาก | ✅ ใช้ his_merged เดิม |
| his_haos.ts | 267 methods | 23 methods | his_merged มากกว่า 11x | ✅ ใช้ his_merged เดิม |
| his_hi.ts | 54 methods | 19 methods | his_merged มากกว่า 2.8x | ✅ ใช้ his_merged เดิม |
| his_himpro.ts | 46 methods | 19 methods | his_merged มากกว่า 2.4x | ✅ ใช้ his_merged เดิม |
| his_hospitalos.ts | 88 methods | 23 methods | his_merged มากกว่า 3.8x | ✅ ใช้ his_merged เดิม |
| his_hosxppcu.ts | 264 methods | 24 methods | his_merged มากกว่า 11x | ✅ ใช้ his_merged เดิม |
| his_hosxpv3.ts | 245 methods | 24 methods | his_merged มากกว่า 10x | ✅ ใช้ his_merged เดิม |
| his_hosxpv4.ts | 209 methods | 24 methods | his_merged มากกว่า 8.7x | ✅ ใช้ his_merged เดิม |
| his_jhcis.ts | 47 methods | 21 methods | his_merged มากกว่า 2.2x | ✅ ใช้ his_merged เดิม |
| his_kpstat.ts | 27 methods | 16 methods | his_merged มากกว่า 1.7x | ✅ ใช้ his_merged เดิม |
| his_md.ts | 28 methods | 16 methods | his_merged มากกว่า 1.75x | ✅ ใช้ his_merged เดิม |
| his_medical2020.ts | 46 methods | 19 methods | his_merged มากกว่า 2.4x | ✅ ใช้ his_merged เดิม |
| his_mkhospital.ts | 36 methods | 25 methods | his_merged มากกว่า 1.4x | ✅ ใช้ his_merged เดิม |
| his_pmk.ts | 39 methods | 20 methods | his_merged มากกว่า 1.95x | ✅ ใช้ his_merged เดิม |
| **his_ssb.ts** | 9 methods (HisSsbHModel) | 20 methods (HisSsbModel) | **แตกต่างกัน - ใช้คนละ class!** | ⚠️ **Copy his_ssb.model.ts → his_ssb_model.ts** |
| his_ssb_srih.ts | 3 methods (HisSsbSriHModel) | - | สำหรับ routes/his | ✅ ใช้ his_ssb_srih.ts เดิม |

## ไฟล์ที่มีแค่ใน isonline/ (ไม่ซ้ำกับ his/)

| ไฟล์ | Class | สรุป | การดำเนินการ |
|------|-------|------|--------------|
| his_ezhosp___x.model.ts | HisEzhospModel | ถูก comment ไว้ใน routes | ❌ ไม่ copy (ไม่ใช้งาน) |
| his_infod.model.ts | HisInfodModel | routes/his ใช้ his_homc แทน | ⚠️ พิจารณา (คงมีใน his_merged แล้ว) |
| his_jhos.model.ts | HisJhosModel | ใช้งานโดย routes/isonline | ✅ **ต้อง copy** |
| his_spdc.model.ts | HisSpdcModel | ใช้งานโดย routes/isonline | ✅ **ต้อง copy** |

## ไฟล์ที่มีแค่ใน his/ (ไม่อยู่ใน isonline/)

เหล่านี้อยู่ใน his_merged แล้ว (copy มาจาก his/):
- his_epis.ts
- his_homc.ts
- his_hospitalos.v4.ts
- his_ihospital.ts
- his_jhcis_ubon.ts
- his_mbase.ts
- his_mitnet.ts
- his_mypcu.ts
- his_nemo.ts
- his_ssb_srih.ts
- his_thiades.ts
- his_vpm.ts
- pcc-model.ts
- refer.ts
- thairefer.ts

## สรุปการดำเนินการ

### ✅ ไฟล์ที่ใช้ his_merged เดิม (15 ไฟล์)
ไม่ต้องแก้ไขอะไร - his_merged/ มี methods มากกว่าและครอบคลุมกว่า

### ⚠️ ไฟล์ที่ต้อง copy/merge (3 ไฟล์)

1. **his_ssb.model.ts** → **his_ssb_model.ts**
   - routes/isonline ใช้ HisSsbModel (จาก his_ssb.model.ts)
   - routes/his ใช้ HisSsbSriHModel (จาก his_ssb_srih.ts)
   - **Action:** Copy his_ssb.model.ts → his_merged/his_ssb_model.ts (คงชื่อ class)

2. **his_jhos.model.ts** → **his_jhos.ts**
   - routes/isonline case 'jhos' ใช้ HisJhosModel
   - **Action:** Copy และเปลี่ยนชื่อ his_jhos.model.ts → his_merged/his_jhos.ts

3. **his_spdc.model.ts** → **his_spdc.ts**
   - routes/isonline case 'spdc' ใช้ HisSpdcModel
   - **Action:** Copy และเปลี่ยนชื่อ his_spdc.model.ts → his_merged/his_spdc.ts

### ❌ ไฟล์ที่ไม่ copy (2 ไฟล์)

1. **his_ezhosp___x.model.ts** - ถูก comment ไว้ในทุก routes, ไม่ใช้งาน
2. **his_infod.model.ts** - มี his_homc.ts ใน his_merged แล้ว (routes/his ใช้ homc แทน infod)

## หมายเหตุพิเศษ

### his_ssb confusion
- `his_ssb.ts` (HisSsbHModel) - ward/bed management (9 methods)
- `his_ssb_srih.ts` (HisSsbSriHModel) - admission/ward (3 methods) - ใช้โดย routes/his
- `his_ssb.model.ts` (HisSsbModel) - person/opd/diagnosis (20 methods) - ใช้โดย routes/isonline
- **แก้ไข:** copy his_ssb.model.ts → his_ssb_model.ts เพื่อไม่ให้ชื่อซ้ำกับ his_ssb.ts

### infod vs homc
- routes/isonline ใช้ `HisInfodModel`
- routes/his ใช้ `HisHomCHModel` (his_homc.ts) สำหรับทั้ง case 'infod' และ 'homc'
- his_merged มี his_homc.ts อยู่แล้ว แต่ไม่มี his_infod.ts
- **ต้องตรวจสอบ:** ถ้า HisInfodModel ใน isonline แตกต่างจาก HisHomCHModel ใน his/ ควร copy มาด้วย

## วันที่สร้าง
2026-08-30

## อ้างอิง
- Source: models/his/ (28+ files)
- Source: models/isonline/ (20 HIS model files)
- Destination: models/his_merged/ (merged version)
