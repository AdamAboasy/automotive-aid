# Automotive Aid

## نظام إدارة توكيل سيارات متكامل

**Automotive Aid** هو نظام شامل لإدارة ورش توكيل السيارات، يشمل:
- استقبال العملاء
- إدارة الورشة
- الموارد البشرية
- تتبع حالة السيارات
- تقارير وإحصائيات

## التقنيات المستخدمة
- **Frontend/Backend**: TanStack Start (Full-stack TypeScript)
- **Database & Auth**: Supabase
- **UI**: Tailwind CSS + shadcn/ui
- **Language**: Arabic + English

## البدء السريع

1. Clone the repo
```bash
git clone https://github.com/AdamAboasy/automotive-aid.git
cd automotive-aid
```

2. Install dependencies
```bash
bun install
```

3. Set up environment variables (copy .env.example)

4. Run development server
```bash
bun run dev
```

## الهيكل

- `/app` - Routes and pages
- `/components` - Reusable UI components
- `/lib` - Utilities and Supabase client
- `/supabase` - Database schema and migrations

## License
MIT