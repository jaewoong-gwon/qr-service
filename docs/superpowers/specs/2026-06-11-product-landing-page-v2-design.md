# Product Landing Page v2 — Design Spec

**Date:** 2026-06-11
**Branch:** `feat/product-landing-page-v2`
**Scope:** 오프라인 매장 QR 코드용 제품 안내 페이지 재설계 (범위 최소화)

---

## Goal

오프라인 매장에서 QR 코드를 스캔한 고객에게 **10~20초 안에 핵심 정보를 전달하고 아이디어스 구매 페이지로 유도**한다.

아이디어스 판매 페이지에 이미 상세 정보(사진, 설명, 가격)가 있으므로 자체 페이지는 짧은 안내 + 구매처 연결에 집중한다.

---

## 사용 시나리오

1. 매장 고객이 진열된 제품 옆 QR 코드를 스마트폰으로 스캔
2. `/r/[slug]` 페이지 접속 (1~2초 이내 로드)
3. 제품명 + 작품 소개 (2-3줄) 확인
4. 구매 전 확인사항 확인 (핸드메이드 특성, 차이 가능성 등)
5. 하단 고정 버튼 "아이디어스에서 구매하기" 클릭 → 아이디어스 이동

---

## 레이아웃 (안 C — 고정 구매 버튼)

```
┌───────────────────────────┐  ← 스크롤 영역
│         작품 이야기         │  ← 브랜드 헤더 (고정 문구)
│                           │
│  제품명                    │  ← h1
│  ──────────               │  ← 골드 구분선
│                           │
│  작품 소개 2-3줄           │  ← description (없으면 영역 숨김)
│                           │
│  ┌─ 구매 전 확인사항 ────┐  │
│  │ 핸드메이드 특성       │  │  ← purchase_notes (없으면 영역 숨김)
│  │ 색상·크기 차이 가능   │  │
│  └───────────────────────┘  │
│                           │
│  아이디어스에서 판매 중     │  ← idus_url 있을 때만 표시 (소형 안내)
│                           │
└───────────────────────────┘
╔═══════════════════════════╗  ← 화면 하단 고정
║  아이디어스에서 구매하기 →  ║  ← idus_url 있을 때만
╚═══════════════════════════╝
```

`idus_url`이 없는 경우: 구매 버튼 미노출, "구매 링크 준비 중입니다" 안내 표시.

**채택 이유:**
오프라인 매장에서 핸드폰으로 스캔한 고객은 서서 보는 상황. 스크롤 위치와 관계없이 구매 버튼이 항상 보이는 구조가 전환에 가장 유리하다. 짧은 페이지이므로 sticky가 부담스럽지 않다.

---

## 섹션 순서 (모바일 기준)

| 순서 | 섹션 | 노출 내용 | 조건 |
|------|------|-----------|------|
| 1 | 브랜드 헤더 | "작품 이야기" 고정 텍스트 | 항상 |
| 2 | 제품명 | `products.name` | 항상 |
| 3 | 작품 소개 | `products.description` (2-3줄) | null이면 영역 숨김 |
| 4 | 구매 전 확인사항 | `products.purchase_notes` (자유 텍스트) | null이면 영역 숨김 |
| 5 | 보조 안내 | "아이디어스에서 판매 중입니다" 고정 문구 | `idus_url` 있을 때 |
| fixed | 구매 버튼 | "아이디어스에서 구매하기" → `idus_url` 링크 | `idus_url` 있을 때 |

---

## 데이터 필드

### `products` 테이블 — 변경 후

| 필드 | 타입 | 역할 |
|------|------|------|
| `id` | uuid | PK |
| `qr_code_id` | uuid | FK |
| `name` | text | 제품명 (필수) |
| `description` | text \| null | 작품 소개 |
| `idus_url` | text \| null | 아이디어스 구매 링크 |
| `purchase_notes` | text \| null | 구매 전 확인사항 |

### DB 마이그레이션

**제거 (DROP — 비가역적):** `price`, `materials`, `dimensions`

**추가 (ADD):** `idus_url`, `purchase_notes`

> ⚠️ `price`, `materials`, `dimensions` 컬럼 DROP은 되돌릴 수 없습니다. 기존 데이터가 있는 경우 삭제됩니다.

---

## 관리자 입력 필드

```
─── QR / Drive ─────────────────────────────
Google Drive 폴더 URL *   [ URL 입력 ]

─── 제품 정보 ──────────────────────────────
제품명 *                  [ 텍스트 입력 ]
작품 소개                  [ 텍스트에어리어, 최대 200자 ]
                          힌트: "어떤 작품인지 2-3줄로 소개해주세요"

─── 랜딩 페이지 ────────────────────────────
아이디어스 구매 링크        [ URL 입력 ]  (권장)
                          힌트: "https://www.idus.com/v2/product/..."
                          비워두면 구매 버튼이 노출되지 않습니다

구매 전 확인사항            [ 텍스트에어리어, 최대 400자 ]  (선택)
                          힌트: "핸드메이드 특성, 색상·크기 차이, 교환·환불 안내 등"
```

---

## 컴포넌트 구조

MVP 기준 단일 파일로 충분하다.

```
components/
  ProductLandingPage.tsx    ← 신규 생성
```

100줄 이하 예상. 모든 섹션이 동일한 `product` prop을 공유하므로 분리 불필요.

추후 분리 기준:
- `PurchaseNotes.tsx`: 어드민 미리보기에서 독립 사용 필요 시
- `IdusCtaButton.tsx`: 다른 페이지에서도 동일 버튼 재사용 필요 시

---

## 기존 코드 영향 범위

| 파일 | 변경 방향 | 범위 |
|------|-----------|------|
| `lib/types.ts` | `Product` 인터페이스: `price`, `materials`, `dimensions` 제거. `idus_url`, `purchase_notes` 추가 | 소 |
| `app/r/[slug]/page.tsx` | `ProductLandingPage` 단일 렌더링으로 교체. Drive 이미지/섹션 분기 제거 | 소 |
| `app/api/qr/route.ts` | POST: 3개 필드 제거, 2개 추가 | 소 |
| `app/api/qr/[id]/route.ts` | PATCH: 3개 필드 제거, 2개 추가 | 소 |
| `app/admin/qr/new/page.tsx` | 폼 단순화: price/materials/dimensions 제거, idus_url/purchase_notes 추가 | 소 |
| `ProductDetailView.tsx` | `/r/[slug]`에서 호출 제거. 파일 자체 유지 | 변경 없음 |
| `ProductPageView.tsx` | 동일 — 호출만 제거 | 변경 없음 |
| `e2e/qr.spec.ts` | 기존 테스트 일부 수정 (price/materials/dimensions 필드 제거) + 랜딩 페이지 테스트 추가 | 소 |

---

## 디자인 토큰 (기존 cream/gold 시스템 계승)

| 항목 | 값 |
|------|-----|
| 배경 | `bg-cream-bg` (아이보리) |
| 강조 | `text-gold`, `border-gold/30` |
| 구매 버튼 | 골드 배경 + cream 텍스트, full-width, rounded-xl |
| 확인사항 카드 | 연한 골드 테두리 카드 (`border-gold/20`) |

---

## Out of Scope

- 대표 이미지 (`hero_image_drive_id`) — 이번 버전에서 제외
- 이미지 업로드 기능
- `price`, `materials`, `dimensions` 표시
- 섹션 기반 편집 UI
- 아이디어스 링크 실시간 유효성 검증
- 다국어 지원
