# MCQ Platform — Progress

Oxirgi yangilanish: 2026-09-19 — **Loyihaning birinchi bosqichi to'liq tayyor va sinovdan o'tgan.**

## Qaror qilingan narsalar (TZ dagi noaniqliklar bo'yicha, foydalanuvchi bilan kelishilgan)
- **Login**: telefon + parol (PIN emas). Parollar bazada faqat bcrypt hash holida.
- **Admin**: `.env` dagi `ADMIN_PHONE` / `ADMIN_PASSWORD` orqali server ishga tushganda avtomatik seed qilinadi (parol hash qilib saqlanadi). Admin `/api/auth/admin/login` orqali alohida login qiladi.
- **Admin user boshqaruvi**: admin userni deactivate/activate qila oladi va parolini o'zgartira oladi.
- **Fakultet cheklovi**: `Category.visible_to_all_faculties` flag. `true` — barcha fakultetlarga; `false` — faqat tanlangan fakultetlarga (`faculty_ids`).

## ✅ BACKEND — to'liq, Docker'da sinovdan o'tgan
Barcha TZ'dagi modul: auth, admin user boshqaruvi, faculty/group CRUD, category/subcategory CRUD (activate/deactivate, soft/hard delete, fakultet cheklovi, muddatli test), question CRUD + CSV/Excel import, test mexanizmi (random pool, shuffle, server-side per-question timer, resume, back-navigation, natija), analitika (7 ta endpoint), Celery (2 ta scheduled task).

**Qo'shimcha model** (TZ'da yo'q edi, lekin to'g'ri ishlashi uchun zarur bo'ldi): `TestSessionQuestion` — har bir test sessiyasi ichida savol tartibi va aralashtirilgan javob variantlari tartibini saqlaydi, shu orqali resume va yakuniy baholash foydalanuvchi ko'rgan aynan shu tartibga mos keladi.

### Docker'da tasdiqlangan (docker-compose.dev.yml: db, redis, backend, celery-worker, celery-beat, frontend — barchasi ishga tushdi):
- Migration avtomatik ishladi, admin `.env`'dan seed bo'ldi
- Celery beat ikkala scheduled task'ni belgilangan vaqtda ishga tushirdi va worker xatosiz bajardi
- **2 ta Node.js end-to-end test skripti** (35+ assertion) haqiqiy HTTP so'rovlar bilan quyidagilarni tasdiqladi:
  - Admin/user auth, CRUD zanjiri (fakultet→guruh→bo'lim→sub-bo'lim→savol)
  - Dublikat telefon raqam rad etilishi
  - Random pool tanlash (4 tadan 3 ta) + shuffle
  - **Real vaqtda server-side timeout**: 5 soniyalik savol kutilib, avtomatik "vaqt tugadi" holatiga o'tishi
  - Orqaga qaytib javobni o'zgartirish (allow_back_navigation)
  - Natija/tarix hisoblash, admin statistika
  - Userni deactivate qilganda login bloklanishi, admin parol almashtirganda yangi parol ishlashi
  - Fakultetga cheklangan bo'lim faqat tegishli fakultet userlariga ko'rinishi
  - CSV import (savol+4javob+1to'g'ri javob)
  - Bitta sub-bo'limni 2 marta boshlash eski sessiyani qaytarishi, cancel qilgach yangisi ochilishi
  - Barcha 7 ta analitika endpointi

## ✅ FRONTEND — kod yozilgan va Docker'da sinovdan o'tgan
Vite + React + TS + Tailwind. User oqimi (login/register/bosh sahifa/test jarayoni — timer+progress+orqaga qaytish UI/natija/tarix, dark-light mode) va admin panel (fakultet/guruh, bo'lim/sub-bo'lim, savol+CSV import, userlar, recharts bilan analitika grafiklari) — barchasi yozildi.

**Docker'da tasdiqlandi:**
- `npm install` + Vite dev server muvaffaqiyatli ishga tushdi (http://localhost:5173)
- **Production build (`tsc -b && vite build`) xatosiz o'tdi** — TypeScript tiplari to'g'ri, 911 modul muvaffaqiyatli kompilyatsiya qilindi
- Backend bilan CORS orqali bog'lanish sozlangan va ishlaydi (`/api/faculties` kabi so'rovlar frontend orqali ham tekshirildi)

**Eslatma:** Chrome brauzer kengaytmasi bu sessiyada ulanmagani sababli, UI'ni bevosita brauzerda bosib-ko'rish (klik, forma to'ldirish) amalga oshirilmadi — faqat backend logikasi (E2E) va frontend build/tip xavfsizligi tasdiqlandi. Vizual UI review hali qilinmagan.

## 🎨 UI dizayni — Apple uslubiga o'tkazildi
- Shrift: SF Pro / -apple-system stack (`tailwind.config.js`)
- Asosiy rang: Apple System Blue (#0071e3), qorong'i rejimda haqiqiy qora fon (`#000`) va `#1c1c1e` sirt rangi (light: `#f5f5f7`)
- Kartalar: qattiq border o'rniga yumshoq shadow + nozik ring (`shadow-apple`, `ring-black/[0.04]`)
- Tugmalar: asosiy CTA tugmalar pill-shaped (`rounded-full`), inputlar `rounded-xl`
- Navbar: shaffof + blur (`backdrop-blur`, `bg-white/80` / `bg-black/80`)
- Barcha 18 ta frontend fayl bo'ylab izchil qo'llanildi, production build (`tsc -b && vite build`) xatosiz o'tdi

## ⏭ Keyingi qadamlar (foydalanuvchi xohishiga ko'ra)
1. **Loyihani ishga tushirish**: `docker compose -f docker-compose.dev.yml up --build` (dev) yoki `docker compose up --build` (production, nginx bilan)
2. Brauzerda haqiqiy foydalanuvchi bo'lib sinab ko'rish (Chrome kengaytmasi ulangandan keyin men ham buni bajarib bera olaman)
3. **Production'ga chiqarishdan oldin albatta**: `.env` dagi `SECRET_KEY`, `POSTGRES_PASSWORD`, `ADMIN_PASSWORD` ni haqiqiy qiymatlarga almashtirish
4. Ixtiyoriy (TZ'ning 11-bo'limidagi tavsiyalar, hali qilinmagan): savolga rasm biriktirish, leaderboard, natijalarni Excel'ga export qilish, muddat yaqinlashganda bildirishnoma, PWA

## Loyiha tuzilishi
```
backend/   — FastAPI + SQLAlchemy + Alembic + Celery
frontend/  — React + Vite + TypeScript + Tailwind
docker-compose.yml       — production (nginx + gunicorn/uvicorn)
docker-compose.dev.yml   — development (hot-reload)
.env.example             — barcha kerakli environment o'zgaruvchilar
```
