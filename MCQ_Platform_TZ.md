# Multiple Choice Test Platformasi — Texnik Topshiriq (TZ)

## Texnologiyalar

| Qatlam | Texnologiya |
|--------|-------------|
| Backend | FastAPI (Python) |
| Database | PostgreSQL 15+ |
| Frontend | React yoki Vue (eng minimal va samarali — tanlash developerga) |
| Containerization | Docker Compose |
| Cache / Session | Redis |
| Background Tasks | Celery + Redis (broker) |

---

## 1. FOYDALANUVCHI ROLLARI

### A) Oddiy User

- **Ro'yxatdan o'tish:** ism, familiya, telefon raqam, fakultet (dropdown), guruh (dropdown — fakultetga bog'liq)
- Agar shu telefon raqam bilan allaqachon ro'yxatdan o'tgan bo'lsa — xatolik: **"Bu foydalanuvchi allaqachon ro'yxatdan o'tgan"**
- **Login:** telefon raqam orqali (parol yo'q, yoki oddiy PIN — developer tanlaydi)
- **Bosh sahifa:** barcha faol test yo'nalishlari (bo'limlar) ko'rinadi
- User istalgan bo'limni ochadi, ichidagi mavjud sub-bo'limlarni ko'radi
- Sub-bo'limni tanlasa — test boshlanadi

### B) Admin

- Alohida admin login (oddiy user admin panelga kira olmaydi)
- Admin imkoniyatlari:
  - Fakultet qo'shish / tahrirlash / o'chirish
  - Guruh qo'shish (fakultetga biriktirish) / tahrirlash / o'chirish
  - Bo'lim (yo'nalish) yaratish (masalan: "Matematika")
  - Sub-bo'lim yaratish (masalan: "Oddiy arifmetika", "Kasr sonlar", "Oliy matematika")
  - Har bir sub-bo'limga test savollari qo'shish:
    - Savol matni
    - 4 ta javob varianti (A, B, C, D)
    - To'g'ri javob belgisi
    - Qiyinlik darajasi (oson / o'rta / qiyin)
  - Savollarni CSV/Excel orqali import qilish
  - Userlar ro'yxatini ko'rish va ularning natijalarini ko'rish

---

## 2. BO'LIM VA TEST BOSHQARUVI (Admin)

- Bo'lim va sub-bo'limni **faollashtirish / deactivate** qilish (tez yoqish/o'chirish toggle)
- **Muddatli test:** boshlanish va tugash sanasi/vaqti belgilash — faqat shu oraliqda test ko'rinadi va ishlay oladi
- Bo'lim yoki sub-bo'limni "o'chirish":
  - **Soft delete** — arxivga tushadi, ma'lumotlar saqlanadi, lekin userga ko'rinmaydi
  - **Hard delete** — butunlay o'chiriladi, qaytib tushmaydi, LEKIN analitika/statistikada saqlanib qoladi
- Alohida savolni ham:
  - **Deactivate** qilish (vaqtincha o'chirish)
  - **Hard delete** (qaytib tushmaydigan qilib o'chirish — analitikada qoladi)

---

## 3. TEST MEXANIZMI

### Test boshlashdan oldin user ko'radi:

- Sub-bo'lim nomi
- Jami savollar soni (masalan: "Jami 100 ta savol")
- Har bir testga ajratilgan vaqt (masalan: "Har bir savolga 2 daqiqa 30 soniya")
- Testda nechta savol tushishi (masalan: 20 ta)

### "Boshlash" tugmasini bosganda:

- Umumiy pool dan (masalan 100 tadan) **random** N ta tanlanadi
- Savollar tartibi **aralashtiriladi** (shuffle)
- Har bir savolning javob variantlari ham **aralashtiriladi**
- Har safar yangi test boshlasa — **har xil savollar** tushadi

### Timer:

- Har bir savol uchun alohida **countdown timer** (admin belgilagan vaqt, soniyagacha aniqlik)
- Vaqt tugasa — avtomatik keyingi savolga o'tadi (javob **"berilmagan"** hisoblanadi)
- **Progress bar:** "Savol 5 / 20"

### Qo'shimcha sozlamalar:

- **Orqaga qaytish:** admin sozlaydi (bu sub-bo'limda orqaga qaytish mumkinmi yoki yo'q)
- **Sahifani yopish/refresh:**
  - Test sessiyasi serverda saqlanadi
  - Qayta kirsa — davom ettirish yoki bekor qilish so'raladi
  - Agar vaqt o'tib ketgan bo'lsa — test tugatilgan hisoblanadi

---

## 4. NATIJALAR (User tomoni)

### Test tugagandan keyin natija sahifasi:

- To'g'ri javoblar soni / umumiy savollar soni
- Foiz ko'rsatkich
- Har bir savol uchun: user javabi va to'g'ri javob (to'g'ri/noto'g'ri rang bilan)
- Agar javob berilmagan bo'lsa — "Vaqt tugadi" belgisi

### User tarix sahifasi:

- Qaysi testlarni qachon ishlagani
- Har birining natijasi
- Takroran ishlash imkoniyati

---

## 5. ANALITIKA (Admin paneli)

- Qaysi yo'nalish (bo'lim) **eng ko'p tanlanmoqda** (grafik/diagramma)
- Qaysi sub-bo'limga **to'g'ri javob ko'p** berilmoqda (ya'ni oson bo'lib qolgan)
- Qaysi savol eng ko'p **to'g'ri javob** olmoqda (oson savol — tavsiya: deactivate yoki hard delete)
- Qaysi savol eng ko'p **noto'g'ri javob** olmoqda (qiyin savol)
- **Fakultet** bo'yicha o'rtacha natija
- **Guruh** bo'yicha o'rtacha natija
- Kunlik / haftalik / oylik **faollik grafigi**
- **Eng faol userlar** ro'yxati

---

## 6. DIZAYN VA UI/UX

- **Dark mode / Light mode** (toggle, user tanlovi saqlanadi)
- **Responsive:** telefon (mobile-first) va PC (desktop) ekranlarga to'liq moslashgan
- Zamonaviy, toza dizayn (Tailwind CSS yoki shunga o'xshash)
- Test jarayonida **minimal distratsiya** — faqat savol, variantlar, timer va progress

---

## 7. DATABASE MODELLARI

```
Faculty
├── id (PK)
├── name (unique)
├── is_active (default: true)
└── created_at

Group
├── id (PK)
├── name
├── faculty_id (FK → Faculty)
├── is_active (default: true)
└── created_at

User
├── id (PK)
├── first_name
├── last_name
├── phone (unique)
├── faculty_id (FK → Faculty)
├── group_id (FK → Group)
├── is_admin (default: false)
└── created_at

Category (bo'lim)
├── id (PK)
├── name
├── is_active (default: true)
├── is_archived (default: false)
├── is_deleted (default: false)
└── created_at

SubCategory (sub-bo'lim)
├── id (PK)
├── name
├── category_id (FK → Category)
├── is_active (default: true)
├── is_archived (default: false)
├── is_deleted (default: false)
├── total_questions_per_test (int, masalan: 20)
├── time_per_question_seconds (int, masalan: 150)
├── allow_back_navigation (bool, default: false)
├── available_from (datetime, nullable)
├── available_until (datetime, nullable)
└── created_at

Question
├── id (PK)
├── subcategory_id (FK → SubCategory)
├── text
├── difficulty (enum: easy / medium / hard)
├── is_active (default: true)
├── is_deleted (default: false)
└── created_at

Answer
├── id (PK)
├── question_id (FK → Question)
├── text
└── is_correct (bool)

TestSession
├── id (PK)
├── user_id (FK → User)
├── subcategory_id (FK → SubCategory)
├── started_at
├── finished_at (nullable)
└── status (enum: in_progress / completed / timed_out / cancelled)

TestAnswer
├── id (PK)
├── session_id (FK → TestSession)
├── question_id (FK → Question)
├── selected_answer_id (FK → Answer, nullable)
├── is_timed_out (bool, default: false)
└── answered_at (nullable)
```

---

## 8. API ENDPOINTLAR

### Auth
| Method | Endpoint | Tavsif |
|--------|----------|--------|
| POST | `/api/auth/register` | Ro'yxatdan o'tish |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Joriy user ma'lumotlari |

### Faculty & Group
| Method | Endpoint | Tavsif |
|--------|----------|--------|
| GET | `/api/faculties` | Fakultetlar ro'yxati |
| POST | `/api/admin/faculties` | Fakultet qo'shish |
| PUT | `/api/admin/faculties/{id}` | Fakultet tahrirlash |
| DELETE | `/api/admin/faculties/{id}` | Fakultet o'chirish |
| GET | `/api/faculties/{id}/groups` | Guruhlar ro'yxati |
| POST | `/api/admin/groups` | Guruh qo'shish |
| PUT | `/api/admin/groups/{id}` | Guruh tahrirlash |
| DELETE | `/api/admin/groups/{id}` | Guruh o'chirish |

### Categories (Bo'limlar)
| Method | Endpoint | Tavsif |
|--------|----------|--------|
| GET | `/api/categories` | Faol bo'limlar (user) |
| POST | `/api/admin/categories` | Bo'lim yaratish |
| PUT | `/api/admin/categories/{id}` | Tahrirlash |
| PATCH | `/api/admin/categories/{id}/toggle` | Faollashtirish/deactivate |
| DELETE | `/api/admin/categories/{id}` | Soft/Hard delete |

### SubCategories (Sub-bo'limlar)
| Method | Endpoint | Tavsif |
|--------|----------|--------|
| GET | `/api/categories/{id}/subcategories` | Sub-bo'limlar (user) |
| POST | `/api/admin/subcategories` | Sub-bo'lim yaratish |
| PUT | `/api/admin/subcategories/{id}` | Tahrirlash |
| PATCH | `/api/admin/subcategories/{id}/toggle` | Faollashtirish/deactivate |
| DELETE | `/api/admin/subcategories/{id}` | Soft/Hard delete |

### Questions (Savollar)
| Method | Endpoint | Tavsif |
|--------|----------|--------|
| GET | `/api/admin/subcategories/{id}/questions` | Savollar ro'yxati |
| POST | `/api/admin/questions` | Savol qo'shish |
| PUT | `/api/admin/questions/{id}` | Savol tahrirlash |
| PATCH | `/api/admin/questions/{id}/toggle` | Deactivate/activate |
| DELETE | `/api/admin/questions/{id}` | Hard delete |
| POST | `/api/admin/questions/import` | CSV/Excel import |

### Test
| Method | Endpoint | Tavsif |
|--------|----------|--------|
| POST | `/api/test/start` | Test boshlash |
| POST | `/api/test/answer` | Javob yuborish |
| POST | `/api/test/finish` | Testni tugatish |
| GET | `/api/test/session/{id}/result` | Natija ko'rish |
| GET | `/api/test/history` | User test tarixi |
| GET | `/api/test/session/{id}/resume` | Davom ettirish |

### Analytics (Admin)
| Method | Endpoint | Tavsif |
|--------|----------|--------|
| GET | `/api/admin/analytics/popular-categories` | Ko'p tanlangan bo'limlar |
| GET | `/api/admin/analytics/easy-questions` | Oson savollar |
| GET | `/api/admin/analytics/hard-questions` | Qiyin savollar |
| GET | `/api/admin/analytics/faculty-stats` | Fakultet bo'yicha statistika |
| GET | `/api/admin/analytics/group-stats` | Guruh bo'yicha statistika |
| GET | `/api/admin/analytics/activity` | Faollik grafigi |
| GET | `/api/admin/analytics/top-users` | Eng faol userlar |

### Users (Admin)
| Method | Endpoint | Tavsif |
|--------|----------|--------|
| GET | `/api/admin/users` | Userlar ro'yxati |
| GET | `/api/admin/users/{id}/stats` | User statistikasi |

---

## 9. DOCKER COMPOSE SERVISLARI

```yaml
services:
  backend:     # FastAPI + Uvicorn
  frontend:    # Node + static serve (nginx)
  db:          # PostgreSQL 15+
  redis:       # Cache, session, Celery broker
  celery-worker:  # Background tasks
  celery-beat:    # Scheduled tasks (test muddatini tekshirish)
```

**Talablar:**
- `docker-compose up` qilganda database migration avtomatik ishlashi kerak
- `.env` faylda barcha konfiguratsiyalar
- Production va development uchun alohida compose fayllar (`docker-compose.yml` va `docker-compose.dev.yml`)

---

## 10. XAVFSIZLIK

- Admin va oddiy user endpointlari alohida himoyalangan (role-based access)
- Rate limiting — bitta telefon raqamdan ko'p marta ro'yxatdan o'tishga urinishni cheklash
- Test sessiyasi server-side da saqlanadi (client-side manipulyatsiya bo'lmasligi uchun)
- CORS sozlamalari to'g'ri qilingan
- Input validation (telefon raqam formati, majburiy maydonlar)

---

## 11. QO'SHIMCHA TAVSIYALAR

- [ ] Savolga rasm biriktirish imkoniyati (masalan: geometrik shakl yoki grafik)
- [ ] Leaderboard — eng yaxshi natija ko'rsatgan userlar reytingi
- [ ] Export: admin test natijalarini CSV/Excel ga yuklab olishi
- [ ] Notification: test muddati yaqinlashganda user ga ogohlantirish
- [ ] PWA (Progressive Web App) — telefonda app sifatida o'rnatish
