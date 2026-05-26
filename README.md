# 🎙️ ArabVoice AI

منصة توليد الأصوات العربية بالذكاء الاصطناعي — مصرية وفصحى

## ✨ المميزات

- **العربية الفصحى** → Edge-TTS (سريع، مجاني، عالي الجودة)
- **اللهجة المصرية** → XTTS-v2 (ذكاء اصطناعي متقدم + fallback تلقائي)
- **استنساخ الصوت** → XTTS-v2 بصوتك الخاص (خطة Pro Clone)
- نظام credits + اشتراكات عبر واتساب
- لوحة تحكم Admin كاملة
- تكامل Supabase Auth + Storage

## 🚀 النشر على Railway

### المتطلبات
- Node.js 20+
- pnpm
- PostgreSQL database (Railway)
- Supabase project
- Hugging Face token (للصوت المصري)

### خطوات النشر

```bash
# 1. Clone المستودع
git clone https://github.com/Amr362/Arabic-Voice-AI
cd Arabic-Voice-AI

# 2. نسخ المتغيرات
cp .env.example .env
# عدّل .env بقيمك

# 3. تثبيت الاعتماديات
pnpm install

# 4. بناء المشروع
pnpm --filter @workspace/api-server build

# 5. تشغيل محلياً
pnpm --filter @workspace/api-server dev
```

### Railway Deploy

1. Push للـ GitHub
2. افتح [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. اختر المستودع
4. أضف متغيرات البيئة من `.env.example`
5. أضف PostgreSQL database من Railway

## 🔑 متغيرات البيئة المطلوبة

| Variable | الوصف |
|----------|-------|
| `DATABASE_URL` | Railway PostgreSQL URL |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (backend فقط) |
| `HF_TOKEN` | Hugging Face token (لـ XTTS المصري) |
| `EGYPTIAN_SPEAKER_URL` | رابط sample صوت مصري (اختياري) |

> ⚠️ **مهم**: `HF_TOKEN` يُستخدم على الـ backend فقط — لا يُرسل للـ frontend أبداً

## 🛠️ هيكل المشروع

```
Arabic-Voice-AI/
├── artifacts/
│   ├── api-server/          # Express.js backend
│   │   └── src/
│   │       ├── routes/tts.ts      # MSA + Egyptian + Clone endpoints
│   │       ├── lib/
│   │       │   ├── edge-tts.ts    # Railway Edge-TTS
│   │       │   ├── egyptian-tts.ts # XTTS-v2 Egyptian
│   │       │   └── tts-engine.ts  # Orchestrator
│   │       └── middlewares/auth.ts # Admin sync من Supabase
│   └── arabvoice/           # React frontend (Vite)
│       └── src/pages/
│           ├── dashboard/GeneratePage.tsx  # Dialect selector
│           └── dashboard/SubscriptionPage.tsx
├── lib/
│   ├── db/                  # Drizzle ORM schema
│   └── api-client-react/    # Generated API hooks
├── railway.json             # Railway config
├── nixpacks.toml            # Build config
└── .env.example
```

## 📞 واتساب

رقم التواصل: **+201271284263**
