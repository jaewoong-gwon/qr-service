# QR Code Service — Design Spec

**Date:** 2026-05-11  
**Status:** Approved

---

## Overview

관리자가 Google Drive 제품 설명서 이미지 공유 링크를 입력하면 QR 코드를 생성해주는 웹 서비스. 고객은 제품에 부착된 QR 코드를 스캔하여 해당 설명서 이미지에 접근한다.

**핵심 불변 조건:** 동일한 Drive URL 입력 시 항상 동일한 QR 코드가 생성된다.

---

## Stack

| 항목 | 선택 |
|------|------|
| 프레임워크 | Next.js (App Router) |
| 데이터베이스 | Supabase (PostgreSQL) |
| 배포 | Vercel |
| QR 생성 | react-qr-code (클라이언트 사이드, SVG) |
| 인증 | 환경변수 비밀번호 + 서명된 JWT 쿠키 |

---

## Architecture

```
[관리자]
  └─ /admin/login → 비밀번호 입력
  └─ /admin/dashboard (보호됨) → QR 목록 열람
  └─ /admin/qr/new (보호됨)
       └─ 제품명 + Drive URL 입력
            └─ slug = SHA-256(drive_url).hex[:8]
            └─ POST /api/qr → DB upsert → slug 반환
            └─ QR 이미지 클라이언트 렌더링 (저장 X)
            └─ PNG 다운로드

[고객]
  └─ QR 스캔 → /r/{slug}
       └─ DB에서 slug 조회 → 302 redirect → Google Drive URL
       └─ 미존재 → 404 안내 페이지
```

---

## Data Model

테이블: `qr_codes` (단일 테이블)

```sql
id           uuid         PRIMARY KEY  DEFAULT gen_random_uuid()
slug         varchar(8)   UNIQUE NOT NULL   -- SHA-256(drive_url).hex[:8]
drive_url    text         NOT NULL
product_name varchar(255) NOT NULL
created_at   timestamptz  NOT NULL DEFAULT now()
```

- QR 이미지 바이너리 저장 없음
- 관리자 테이블 없음 (인증은 환경변수로만 처리)
- `slug`는 `drive_url`로부터 결정론적으로 계산되므로 동일 URL 재입력 시 기존 레코드를 반환

---

## Authentication & Session

- 관리자 1명 고정, 사용자 테이블 없음
- `POST /api/auth/login`: `ADMIN_PASSWORD` 환경변수와 비교 → 일치 시 서명된 JWT를 HTTP-only 쿠키로 발급 (24시간)
- `POST /api/auth/logout`: 쿠키 삭제
- `middleware.ts`: `/admin/*` 경로 요청마다 JWT 쿠키 검증, 실패 시 `/admin/login`으로 리다이렉트
- 추후 NextAuth 전환 시 `middleware.ts`의 쿠키 검증 로직만 교체

---

## Pages & API Routes

### 페이지

| 경로 | 설명 | 접근 |
|------|------|------|
| `/` | `/admin/dashboard`로 리다이렉트 | 공개 |
| `/admin/login` | 비밀번호 입력 폼 | 공개 |
| `/admin/dashboard` | 생성된 QR 목록 | 보호됨 |
| `/admin/qr/new` | 새 QR 코드 생성 폼 | 보호됨 |
| `/r/[slug]` | Drive URL로 302 리다이렉트 | 공개 |

### API

| 메서드 | 경로 | 설명 | 접근 |
|--------|------|------|------|
| `POST` | `/api/auth/login` | JWT 쿠키 발급 | 공개 |
| `POST` | `/api/auth/logout` | 쿠키 삭제 | 보호됨 |
| `POST` | `/api/qr` | QR 레코드 생성 (upsert) | 보호됨 |
| `GET`  | `/api/qr` | QR 목록 조회 | 보호됨 |

---

## QR Generation & Download

- QR에 인코딩되는 값: `https://{NEXT_PUBLIC_BASE_URL}/r/{slug}`
- 클라이언트 사이드 렌더링: `react-qr-code` (SVG 기반)
- PNG 다운로드: SVG → Canvas 변환 → `toDataURL('image/png')` → `<a download>` 트리거
- 파일명: `{product_name}-qr.png`
- 목록의 모든 레코드에서 slug로 QR 재렌더링 가능

---

## Admin Dashboard UI

### `/admin/dashboard` — QR 목록

```
┌─────────────────────────────────────────┐
│  QR Code Manager         [+ 새 QR 생성] │
│                                 [logout]│
├─────────────────────────────────────────┤
│  제품명      slug     생성일   QR  다운  │
│  제품A      a1b2c3d4  2026-..  □   ↓   │
│  제품B      e5f6g7h8  2026-..  □   ↓   │
└─────────────────────────────────────────┘
```

### `/admin/qr/new` — QR 생성

```
┌─────────────────────────────────────────┐
│  ← 목록으로                     [logout]│
├─────────────────────────────────────────┤
│  제품명: [____________]                  │
│  Drive URL: [______________________]    │
│  [QR 생성]                              │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │ 생성된 QR 미리보기               │   │
│  │ [PNG 다운로드]                   │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## Error Handling

- Drive URL 입력 시 Google Drive 공유 링크 형식 검증 (클라이언트 + 서버)  
  허용 패턴: `https://drive.google.com/` 으로 시작하는 URL만 허용
- `/r/[slug]` 미존재 → 404 안내 페이지 ("유효하지 않은 QR 코드입니다")
- 로그인 실패 → 에러 메시지 표시 ("비밀번호가 올바르지 않습니다")

---

## Environment Variables

```
ADMIN_PASSWORD=             # 관리자 로그인 비밀번호
JWT_SECRET=                 # JWT 서명 키 (32자 이상 랜덤)
NEXT_PUBLIC_BASE_URL=       # 서비스 도메인 (예: https://qr.example.com)
SUPABASE_URL=               # Supabase 프로젝트 URL
SUPABASE_ANON_KEY=          # Supabase anon key (공개)
SUPABASE_SERVICE_ROLE_KEY=  # Supabase service role key (서버 전용)
```

---

## Out of Scope (MVP)

- QR 코드 수정/삭제
- 접근 통계 (스캔 횟수 등)
- 복수 관리자 계정
- QR 이미지 서버 저장
- Google Drive API 연동 (링크 유효성 외부 검증)
