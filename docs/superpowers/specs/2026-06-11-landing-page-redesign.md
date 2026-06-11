# 랜딩 페이지 리디자인 스펙

**Date:** 2026-06-11
**Branch:** `refactor/remove-product-sections` 이후 새 브랜치
**Scope:** 전체 디자인 재정의 — 폰트 교체 + 색상 토큰 갱신 + 랜딩 페이지 레이아웃 재구성

---

## Goal

오프라인 매장 QR 스캔 고객이 보는 랜딩 페이지(`/r/[slug]`)를 에디토리얼 스타일로 재구성한다.
폰트와 색상 토큰은 전역 변경이므로 어드민 페이지에도 자동 적용된다.

---

## 확정 사항 요약

| 항목 | 현재 | 변경 후 |
|------|------|---------|
| 폰트 | Gowun Dodum | Pretendard |
| 배경 | `#EEEAE0` cream-bg | `#F4F2EF` warm stone |
| 포인트 색상 | `#C9A84C` gold | `#C07A50` terracotta |
| 텍스트 | `#3D2B1F` brown-dark | `#1C1917` near-black |
| 랜딩 CTA | 하단 fixed 버튼 | 인라인 버튼 (고정 해제) |
| 구매 확인사항 | 자유 텍스트 단락 | 체크리스트 (줄바꿈 분리) |

---

## 1. 색상 토큰 (`app/globals.css`)

토큰 이름은 유지, 값만 교체한다. 기존 Tailwind 클래스(`bg-gold`, `text-gold` 등)를 그대로 사용하면서 색상만 바뀐다.

```css
@theme inline {
  --color-cream:      #F4F2EF;   /* 카드 배경 */
  --color-cream-bg:   #EEECE8;   /* 페이지 배경 */
  --color-gold:       #C07A50;   /* 포인트 (테라코타) */
  --color-brown-dark: #1C1917;   /* 주 텍스트 */
  --color-brown-mid:  #6B5C4E;   /* 보조 텍스트 */
  --color-brown-light:#9A8270;   /* 약한 텍스트 */
  --color-brown-muted:#B09880;   /* 최약 텍스트 */
}
```

---

## 2. 폰트 (`app/layout.tsx`)

Gowun Dodum → Pretendard로 교체.

```ts
import { Pretendard } from 'next/font/google'   // ← 실제로는 localFont 또는 CDN 방식
```

> **주의:** Pretendard는 Google Fonts에 없다. 아래 두 방법 중 하나를 선택한다.
>
> **방법 A — CDN (권장, 간단):** `app/layout.tsx`에서 Next.js 폰트 대신 `<link>` 태그를 직접 삽입한다.
> ```tsx
> // app/layout.tsx
> import './globals.css'
> export default function RootLayout({ children }) {
>   return (
>     <html lang="ko">
>       <head>
>         <link rel="preconnect" href="https://cdn.jsdelivr.net" />
>         <link
>           href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard-dynamic-subset.css"
>           rel="stylesheet"
>         />
>       </head>
>       <body>{children}</body>
>     </html>
>   )
> }
> ```
>
> **방법 B — next/font/local:** Pretendard 폰트 파일을 `public/fonts/`에 두고 `localFont()`로 등록.

`app/globals.css`의 `body` 폰트 선언:
```css
body {
  font-family: 'Pretendard', -apple-system, sans-serif;
  background-color: var(--color-cream-bg);
  color: var(--color-brown-dark);
}
```

`--font-serif` CSS 변수는 더 이상 사용하지 않으므로 제거한다.

---

## 3. 랜딩 페이지 레이아웃 (`components/ProductLandingPage.tsx`)

### 구조

```
┌──────────────────────────────┐
│  작품 이야기  │  [제품명]     │  ← 챕터 헤더
├──────────────────────────────┤
│  제품명 (h1, 26px bold)      │
│  짧은 한 줄 소개              │  ← description 필드
│                              │
│  [아이디어스에서 구매하기 →]  │  ← 인라인 CTA 버튼
│                              │
│  ── 구매 전 확인사항 ──       │
│  ☑ 항목 1                    │  ← purchase_notes
│  ☑ 항목 2                    │    줄바꿈(\n) 분리 렌더링
│  ☑ 항목 3                    │
│                              │
│  아이디어스에서 자세히 보기   │  ← 보조 텍스트 링크
└──────────────────────────────┘
```

### idus_url 없는 경우

- CTA 버튼과 보조 링크 모두 미표시
- "구매 링크 준비 중입니다" 안내 텍스트 표시

### purchase_notes 없는 경우

- 구매 전 확인사항 섹션 전체 숨김

### 체크리스트 렌더링

```tsx
const checkItems = product.purchase_notes
  ?.split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0) ?? []
```

각 항목을 `<li>` 또는 `<div>`로 렌더링. 체크마크(`✓`)는 CSS로 표시.

---

## 4. 데이터 변경

**없음.** DB 스키마, API 라우트 변경 없음.

- `description` → 한 줄 소개로 활용 (기존 필드 재활용)
- `purchase_notes` → 줄바꿈 분리로 체크리스트 렌더링
- `idus_url` → 버튼 + 보조 링크 두 곳에 동일하게 사용

---

## 5. 영향 범위

| 파일 | 변경 내용 |
|------|-----------|
| `app/globals.css` | 색상 토큰 7개 값 교체, font-family 선언 수정 |
| `app/layout.tsx` | Gowun_Dodum → Pretendard (CDN link 방식) |
| `components/ProductLandingPage.tsx` | 전체 재작성 |
| `__tests__/components/ProductLandingPage.test.tsx` | 새 레이아웃에 맞게 테스트 업데이트 |

어드민 페이지(`dashboard`, `login`, `new`)는 직접 수정하지 않는다.
색상 토큰과 폰트가 전역 변경되므로 자동 적용된다.

---

## 6. 테스트 기준

- ProductLandingPage 단위 테스트 (vitest):
  - `description`이 h1 아래 표시됨
  - `idus_url` 있을 때 인라인 버튼 표시됨 (fixed bottom 아님)
  - `purchase_notes` 줄바꿈 분리 → 각 줄이 별도 항목으로 렌더링됨
  - `idus_url` 없을 때 버튼 없음 + "구매 링크 준비 중" 표시
  - `purchase_notes` 없을 때 확인사항 섹션 없음
  - `product` null일 때 기본 문구 표시

---

## Out of Scope

- 어드민 레이아웃 재구성 (폰트·색상 자동 적용으로 충분)
- Pretendard 로컬 폰트 파일 번들링 (CDN 방식으로 처리)
- 다크 모드
- 애니메이션 전환 효과
