# 팀 투두리스트

재택 팀원들이 오늘 할일을 공유하고 업무 시작을 선언하는 협업 투두리스트 앱

## 주요 기능

- 🔐 회원가입 및 로그인
- 👥 팀 생성 및 초대 코드로 참여
- ✅ 오늘 할일 관리
- 🚀 "오늘 시작" 버튼으로 슬랙 알림
- 📊 팀 대시보드로 팀원 현황 확인
- 🔄 매일 오전 9시 미완료 항목 자동 이월

## 기술 스택

- Next.js 14
- TypeScript
- Tailwind CSS + shadcn/ui
- Prisma + PostgreSQL (Supabase)
- NextAuth.js
- Slack Webhook

## 환경 변수

```env
DATABASE_URL="your-supabase-connection-string"
NEXTAUTH_URL="your-app-url"
NEXTAUTH_SECRET="your-secret-key"
CRON_SECRET="your-cron-secret"
```

## 배포

1. Supabase에서 데이터베이스 생성
2. `supabase-schema.sql` 실행
3. Vercel에 배포
4. 환경 변수 설정
