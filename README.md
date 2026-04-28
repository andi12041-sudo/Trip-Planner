# ✈ 여행 플래너

URL 하나로 친구·가족과 함께 편집하는 여행 일정 관리 앱.  
로그인 없이 고유 URL만으로 누구나 접근·편집 가능.

---

## 기술 스택

| 레이어 | 기술 |
|---|---|
| 프론트엔드 | React 18 + Vite + TypeScript (포트 3000) |
| 백엔드 | Express + TypeScript (포트 5000) |
| 데이터베이스 | Firebase Firestore (Admin SDK) |
| 배포 | Vercel (프론트) + Render (백엔드) |

---

## 빠른 시작

### 1. 의존성 설치

```bash
# 백엔드
cd backend
npm install

# 프론트엔드
cd ../frontend
npm install
```

### 2. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com)에서 프로젝트 생성
2. **Firestore Database** 활성화 (프로덕션 모드 권장)
3. **프로젝트 설정 → 서비스 계정 → Firebase Admin SDK → 새 비공개 키 생성** 클릭
4. 다운로드된 JSON 파일에서 값을 복사해 `backend/.env`에 입력

### 3. 환경변수 설정

```bash
# backend/.env (backend/.env.example 참고)
cp backend/.env.example backend/.env
# 편집기로 열어 Firebase 값 입력

# frontend/.env
cp frontend/.env.example frontend/.env
# VITE_API_URL=http://localhost:5000
```

### 4. 개발 서버 실행

터미널 두 개를 열어 각각 실행:

```bash
# 터미널 1 — 백엔드
cd backend
npm run dev

# 터미널 2 — 프론트엔드
cd frontend
npm run dev
```

브라우저에서 `http://localhost:3000` 접속.

---

## 필요한 Firestore 인덱스

현재 구현에서는 서버 사이드에서 정렬을 처리하므로 **복합 인덱스가 필요하지 않습니다**.  
만약 Firestore 쿼리를 직접 `orderBy`로 확장할 경우 아래 인덱스를 생성하세요.

| 컬렉션 | 필드 1 | 필드 2 | 정렬 |
|---|---|---|---|
| `plans/{planId}/schedules` | `date` (ASC) | `startTime` (ASC) | 복합 인덱스 |

Firebase Console → Firestore → 인덱스 → 복합 인덱스 추가에서 생성.

---

## 프로젝트 구조

```
trip-planner/
├── backend/
│   ├── src/
│   │   ├── config/firebase.ts   # Firestore Admin SDK 초기화
│   │   ├── routes/plans.ts      # 플랜 CRUD API
│   │   ├── routes/schedules.ts  # 스케줄 CRUD API
│   │   ├── server.ts            # Express 서버 진입점
│   │   └── types.ts             # 공통 타입
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ScheduleGridView.tsx  # 그리드(엑셀) 뷰
    │   │   ├── ScheduleListView.tsx  # 리스트 뷰
    │   │   ├── ScheduleModal.tsx     # 일정 추가/수정/상세 모달
    │   │   └── ThemeToggle.tsx       # 다크모드 토글
    │   ├── pages/
    │   │   ├── HomePage.tsx          # 메인 페이지 (플랜 생성)
    │   │   └── PlanPage.tsx          # 플랜 상세 페이지
    │   ├── services/api.ts           # 백엔드 API 호출
    │   ├── types/index.ts            # TypeScript 인터페이스
    │   ├── utils/dateUtils.ts        # UTC 변환 없는 날짜 유틸
    │   ├── App.tsx
    │   └── main.tsx
    ├── .env.example
    ├── package.json
    └── vite.config.ts
```

---

## 배포 가이드

### 백엔드 → Render

1. GitHub에 코드 push
2. [Render](https://render.com) → New Web Service → GitHub 저장소 연결
3. 설정:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Environment Variables에 `.env` 내용 전부 입력
   - `FRONTEND_URL` = 배포된 Vercel URL (예: `https://your-app.vercel.app`)

### 프론트엔드 → Vercel

1. [Vercel](https://vercel.com) → New Project → GitHub 저장소 연결
2. 설정:
   - **Root Directory**: `frontend`
   - **Framework**: Vite
3. Environment Variables:
   - `VITE_API_URL` = Render 배포 URL (예: `https://your-api.onrender.com`)
4. Deploy

---

## 주요 설계 원칙

- **날짜는 `YYYY-MM-DD` 문자열**로만 처리 — `new Date(dateString)` UTC 파싱 버그 방지
- **이미지 업로드 없음** — Firebase Storage 과금 방지
- **로그인 없음** — URL이 곧 인증 키, 링크 공유만으로 협업 가능
