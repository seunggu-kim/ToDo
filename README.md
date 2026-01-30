# 팀 투두리스트

재택 팀원들이 오늘 할일을 공유하고 업무 시작을 선언하는 협업 투두리스트 앱

## 주요 기능

### 핵심 기능
- 🔐 회원가입 및 로그인
- 👥 팀 생성 및 초대 코드로 참여
- 📅 **주간 뷰** - 한 주의 할일을 한눈에 보고 관리
- ✅ 빠른 할일 입력 (Enter로 연속 입력)
- 🚀 "오늘 시작" 버튼으로 슬랙 알림
- 🔄 매일 오전 9시 미완료 항목 자동 이월 (안내 배너 제공)

### 생산성 도구
- 📋 **할일 템플릿** - 자주 사용하는 할일을 저장하고 재사용
- 🔍 **전체 검색** - 과거 90일간의 할일 검색
- 📱 **모바일 최적화** - PWA 지원, 플로팅 입력창
- 📊 **팀 대시보드** - 팀원 현황 실시간 확인

### 자기 성찰 & 동기부여
- 💡 **개인 성찰 카드** - 나의 이번 주 완료율, 팀 평균과 비교
- 🔥 **연속 달성 스트릭** - 매일 할일 완료시 연속일 표시
- 🎉 **완료 애니메이션** - 할일 완료시 confetti 효과
- 🏆 **주간 MVP** - 이번 주 가장 열심히 한 팀원 선정
- 🔥 **이월 할일 하이라이트** - 반복적으로 미루는 할일 강조

## 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Prisma, PostgreSQL (Supabase)
- **Auth**: NextAuth.js v5
- **Integrations**: Slack Webhook
- **Libraries**: Recharts (통계 차트), Canvas Confetti (애니메이션)
- **PWA**: Manifest, Service Worker 지원

## 환경 변수

```env
DATABASE_URL="your-supabase-connection-string"
NEXTAUTH_URL="your-app-url"
NEXTAUTH_SECRET="your-secret-key"
CRON_SECRET="your-cron-secret"
```

## 설치 및 배포

### 1. 데이터베이스 설정
```bash
# Supabase에서 PostgreSQL 데이터베이스 생성 후
# supabase-schema.sql 파일의 SQL을 Supabase SQL Editor에서 실행
```

### 2. 환경 변수 설정
`.env` 파일을 생성하고 다음 변수들을 설정:
```env
DATABASE_URL="your-supabase-connection-string"
NEXTAUTH_URL="your-app-url"
NEXTAUTH_SECRET="your-secret-key"
CRON_SECRET="your-cron-secret"
```

### 3. 의존성 설치 및 실행
```bash
npm install
npm run dev
```

### 4. Vercel 배포
```bash
# Vercel에 배포
vercel

# 환경 변수는 Vercel 대시보드에서 설정
```

### 5. Cron Job 설정
Vercel에서 자동 이월을 위한 Cron Job이 설정됩니다 (`vercel.json` 참고)

## 새로운 기능 사용법

### 주간 뷰
- "할 일" 탭에서 상단에 주간 달력이 표시됩니다
- 각 날짜를 클릭하여 해당 날짜의 할일을 확인/추가할 수 있습니다
- 날짜별 완료율과 할일 개수가 한눈에 보입니다

### 할일 템플릿
1. 설정 페이지에서 자주 사용하는 할일을 템플릿으로 저장
2. 할일 입력창에서 "템플릿에서 선택" 버튼 클릭
3. 저장된 템플릿을 선택하여 빠르게 입력

### 검색
- "검색" 탭에서 과거 할일을 키워드로 검색
- 최근 90일간의 데이터를 날짜별로 그룹화하여 표시

### 모바일 사용
- 모바일에서 우측 하단 + 버튼으로 빠른 입력
- 햄버거 메뉴로 전체 네비게이션 접근
- PWA로 설치하여 앱처럼 사용 가능
