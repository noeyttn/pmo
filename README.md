# PMO Project Tracking

Web App ติดตามงานทีม แทนไฟล์ Excel ที่ส่งต่อกันทาง LINE — ข้อมูลอยู่ที่เดียว ทุกคน Login ด้วยบัญชีตัวเอง และทุกการแก้ไขถูกบันทึกย้อนหลังได้

**Stack:** SvelteKit 3 (SSR) · Tailwind 4 · shadcn-svelte · Drizzle ORM · SQLite (libSQL) → Cloudflare D1 · Cloudflare Pages

## เริ่มใช้งานบนเครื่อง

```bash
npm install
npm run db:setup      # สร้างตาราง + นำเข้าข้อมูลจาก data/project_tracking_sample.xlsx
npm run dev           # http://localhost:5173
```

นำเข้าจากไฟล์อื่น: `npm run db:seed -- path/to/file.xlsx` (ล้างข้อมูลเดิมก่อนนำเข้า)

### บัญชีทดสอบ (จากข้อมูลตัวอย่าง)

- ทุกคนใน sheet "ทีมงาน" ได้บัญชี — Login ด้วยอีเมลในไฟล์ เช่น `vipa@example.com`
- รหัสผ่านเริ่มต้น = ค่า `SEED_PASSWORD` (ดู `.env.example`) — เปลี่ยนได้ที่เมนู "เปลี่ยนรหัสผ่าน"
- คนที่ตำแหน่งมีคำว่า "หัวหน้า" (วิภา) ได้สิทธิ์ **Admin** ที่เหลือเป็น **พนักงาน**

> ⚠️ รหัสผ่านเริ่มต้นเป็นค่าทดสอบที่เปิดเผยใน repo นี้ — ก่อนใช้งานกับข้อมูลจริง ให้ตั้ง `SEED_PASSWORD` ใหม่ใน `.env` และให้ทุกคนเปลี่ยนรหัสผ่านหลัง Login ครั้งแรก

## สิทธิ์การใช้งาน

| | Admin (หัวหน้า) | พนักงาน |
|---|---|---|
| Dashboard / Report | ✅ | ✅ |
| Kanban — ย้ายสถานะ | ทุกงาน | เฉพาะงานตัวเอง |
| แก้ไขงาน | ทุกฟิลด์ | สถานะ, % คืบหน้า, ชม.จริง, หมายเหตุ |
| สร้าง/ลบงาน, จัดการโปรเจกต์ | ✅ | — |
| จัดการพนักงาน (เพิ่ม/แก้/ปิดใช้งาน/รีเซ็ตรหัส) | ✅ | — |
| ดูประวัติ / ย้อนกลับการแก้ไขงาน | ดู + ย้อนกลับ | ดู |

สิทธิ์ตรวจที่ฝั่ง Server (`src/lib/server/tasks.ts`) ไม่ใช่แค่ซ่อนปุ่ม

## โครงสร้างโปรเจกต์

```
scripts/seed.ts                นำเข้า Excel → DB
drizzle.config.ts              config drizzle-kit
wrangler.toml                  Cloudflare Pages + (ภายหลัง) D1 binding
src/
  hooks.server.ts              เปิด DB + ตรวจ session ทุก request, บังคับ Login
  lib/
    tasks.ts                   label สถานะ/ความสำคัญ, กติกา "เกินกำหนด/ใกล้ครบกำหนด" (ใช้ทั้ง client/server)
    filter.ts                  ตัวกรองงานจาก query string
    components/                TaskTable, TaskFields, ActivityList, ... + ui/ (shadcn-svelte)
    server/
      db/schema.ts             ตาราง users, sessions, projects, tasks, activity_log
      db/index.ts              เลือก D1 (ถ้ามี binding) หรือ SQLite ในเครื่อง
      auth.ts, password.ts     session cookie + PBKDF2 (Web Crypto — รันบน Workers ได้)
      tasks.ts                 อัปเดตงาน + ตรวจสิทธิ์ + บันทึก log + ย้อนกลับ
      activity.ts              บันทึก/อ่าน Activity Log
  routes/
    +page                      Dashboard (รายคน, รายโปรเจกต์, งานเลยกำหนด, ใกล้ครบกำหนด)
    board/                     Kanban (ลากวาง, มือถือใช้ dropdown)
    tasks/, tasks/new, tasks/[id]   รายการงาน / สร้าง / รายละเอียด+ประวัติ
    projects/, projects/[id]   โปรเจกต์
    employees/, employees/[id] จัดการพนักงาน (Admin)
    activity/                  Activity Log ทั้งระบบ
    login/, logout/, account/  เข้า/ออกระบบ, เปลี่ยนรหัสผ่าน
```

## Activity Log

ทุกการสร้าง/แก้ไข/ลบ งาน โปรเจกต์ และพนักงาน ถูกเก็บใน `activity_log` พร้อม `{ field: [ค่าเดิม, ค่าใหม่] }`
Admin กด "ย้อนกลับการแก้ไขนี้" ได้ — ระบบจะเขียนค่าเดิมกลับและบันทึกเป็นรายการใหม่ (ไม่ลบประวัติ)
การ "ลดพนักงาน" แนะนำให้ปิดการใช้งานแทนลบ เพื่อให้ประวัติยังอ้างอิงได้

## การแปลงข้อมูลจาก Excel

| Excel | ในระบบ |
|---|---|
| ยังไม่เริ่ม | To do |
| กำลังดำเนินการ | Doing |
| รอตรวจ | Doing + ป้าย `[รอตรวจ]` ในหมายเหตุ |
| ระงับ | To do + ป้าย `[ระงับ]` ในหมายเหตุ |
| เสร็จแล้ว | Done |
| สูง / กลาง / ต่ำ | high / medium / low |
| % ความคืบหน้า (0–1) | 0–100 |
| วันคงเหลือ, สถานะเวลา (สูตร) | คำนวณสดตอนแสดงผล |
| sheet "ภาพรวม" (สูตรทั้งหมด) | ไม่นำเข้า — Dashboard คำนวณใหม่ |

## Deploy: Cloudflare Pages + D1

- ฐานข้อมูล D1 ชื่อ `pm-app` สร้างแล้ว และผูกไว้ใน `wrangler.toml` (binding `DB`) — โปรดักชันใช้ D1 อัตโนมัติ ส่วน `npm run dev` ใช้ `local.db`
- ตั้งค่า Pages (เชื่อม GitHub repo นี้):
  - Framework preset: **SvelteKit** (หรือ None)
  - Build command: `npm run build`
  - Build output directory: `.svelte-kit/cloudflare`
  - Node: ใช้เวอร์ชันจากไฟล์ `.node-version` (SvelteKit 3 ต้องการ ≥ 22.17)
- แก้ schema: `npm run db:generate` → `npx wrangler d1 migrations apply pm-app --remote`
- นำข้อมูลจาก DB ในเครื่องขึ้น D1: `npx tsx scripts/dump-sql.ts > seed.sql` → `npx wrangler d1 execute pm-app --remote --file=seed.sql`

โค้ด query ไม่ต้องแก้ — `getDb()` ใช้ D1 อัตโนมัติเมื่อมี binding `DB`
