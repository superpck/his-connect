## HIS Hosxpv4 (ISONLINE) Query Map

| Function | Primary Source | Joins / Additional Sources | Filters / Parameters | Selected Fields / Expressions | Notes |
| --- | --- | --- | --- | --- | --- |
| `getTableName` | `information_schema.tables` | – | `table_catalog = HIS_DB_NAME` | `table_name` | Lists available tables for configured catalog. |
| `testConnect` | `global.dbHIS('opdconfig')`, `patient` | – | `LIMIT 1` on patient probe | Returns `hospname`, boolean `connection`, optional MySQL charset from `information_schema.SCHEMATA` | Charset lookup runs only when client contains `mysql`. |
| `getPerson` | `patient` | `nationality as nt1`, `occupation` | `where` or `whereIn` on dynamic `columnName`; `LIMIT 500` | Patient demographics plus `CONCAT(chwpart,amppart,tmbpart)` as `addcode` | Adjusts filter based on string vs array search text. |
| `getOpdService` | `opdscreen` | `ovst`, `patient`, `er_regist`, `er_nursing_detail`, `er_emergency_type`, `accident_transport_type`, `clinic` | Optional `hn`, `date`, dynamic column filter; `LIMIT 500` | Vital signs, accident details, clinic info, ER risk flags | Uses multiple left joins to stitch ER data; no grouping. |
| `getOpdServiceByVN` | `opdscreen` | `ovst`, `patient`, `er_regist`, `er_nursing_detail`, `ovstdiag`, `ipt`, `referin`, `clinic` | `where` or `whereIn` on `opdscreen.vn`; `LIMIT 500` | Detailed OPD visit snapshot, ER metrics, ward/refer info, `IF` expressions for primary/secondary ICD10 | Duplicates some ER fields; includes raw `if` expressions (MySQL syntax). |
| `getDiagnosisOpd` | `ovstdiag` | – | `vn = visitno` | `hn`, `vn`, `icd10`, `diagtype`, `update_datetime`, `concat(vstdate,' ',vsttime)` | Straightforward OPD diagnosis fetch. |
| `getDiagnosisOpdVWXY` | Raw SQL (`ovstdiag`) | `LEFT JOIN icd10_sss` | `vstdate = ?`, ICD10 leading character filters, `LIMIT 500` | Selects trauma-related diagnoses with joined description | Uses raw string query with positional binding for `date`. |
| `getProcedureOpd` | `procedure_opd` | – | `where(columnName = searchNo)` | `*` | Direct table proxy. |
| `getChargeOpd` | `charge_opd` | – | Same as above | `*` | Direct table proxy. |
| `getDrugOpd` | `drug_opd` | – | Same | `*` | Direct table proxy. |
| `getAdmission` | `admission` | – | Same | `*` | Direct table proxy. |
| `getDiagnosisIpd` | `diagnosis_ipd` | – | Same | `*` | Direct table proxy. |
| `getProcedureIpd` | `procedure_ipd` | – | Same | `*` | Direct table proxy. |
| `getChargeIpd` | `charge_ipd` | – | Same | `*` | Direct table proxy. |
| `getDrugIpd` | `drug_ipd` | – | Same | `*` | Direct table proxy. |
| `getAccident` | `er_regist` | `ovst`, `patient`, `er_nursing_detail`, `opdscreen` | `er_regist.vn = visitno` | ER visit identifiers, GCS scores, accident metadata, patient vitals | Uses chained `leftJoin` callbacks. |
| `getAppointment` | `appointment` | – | `where(columnName = searchNo)` | `*` | Direct table proxy. |
| `getData` | Dynamic `tableName` | – | `where(columnName = searchNo)`, `LIMIT 5000` | `*` | Generic passthrough helper. |

> **Legend**
> - “Direct table proxy” indicates the function simply forwards filters to a single table without additional transformation beyond the `WHERE` clause.
> - `IF` expressions in selections follow MySQL syntax present in the source; cross-database portability may require adjustment. 
