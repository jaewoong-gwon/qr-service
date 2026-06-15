# Admin Tab Layout Redesign — Implementation Spec

## Goal

새 QR 생성 페이지와 수정 페이지를 동일한 탭 기반 레이아웃으로 통합하고, 미리보기 패널을 내부 스크롤 가능하게 변경한다.

## Architecture

두 페이지(`/admin/qr/new`, `/admin/qr/[id]/edit`)가 동일한 탭 구조를 공유한다.

```
Nav (상단 고정)
  ← 목록 | 페이지 제목 | 탭 인디케이터 (1~4) | 액션 버튼
Main (flex row, 스크롤 없음)
  Left: 현재 탭 콘텐츠 (flex-1)
  Right: 폰 프레임 미리보기 (고정 폭, 내부 스크롤)
```

**탭 순서 (양쪽 페이지 동일)**

| 탭 | 섹션 | 컴포넌트 |
|---|---|---|
| 1 | 기본 정보 | 제품명·한 줄 카피·요약·아이디어스 링크 입력 |
| 2 | 구매 안내 | `<NoticePanel>` |
| 3 | 태그 | `<TagsPanel>` |
| 4 | 섹션 | `<SectionsPanel>` |

---

## 페이지별 상세 설계

### 새 QR 생성 (`/admin/qr/new`)

**네비게이션**
- 좌: `← 목록`
- 중앙: 탭 인디케이터 (활성 탭 gold 배경, 비활성 테두리만)
- 우: `QR 생성` 버튼
  - **비활성(disabled)**: `제품명` 또는 `아이디어스 링크` 중 하나라도 비어있을 때
  - **활성(enabled)**: 둘 다 입력된 경우

**탭 이동**
- 탭 인디케이터 클릭으로 자유 이동 (순서 제약 없음)
- 탭 1~4 어디에도 저장 버튼 없음
- 기존 `이전 ←` / `다음 →` 버튼 제거

**데이터 흐름**
- 탭 이동 시 데이터는 로컬 state에 누적 (API 호출 없음)
- `QR 생성` 클릭 → `POST /api/qr` (제품명·링크·구매 안내·태그·섹션 한 번에)
- 성공 → 저장 완료 모달

**저장 완료 모달**
```
생성되었습니다 ✓
QR 코드가 생성되었습니다

[ 홈으로 ]   [ 수정 계속하기 → ]
```
- `홈으로`: `/admin/dashboard`로 이동
- `수정 계속하기`: 생성된 QR의 `/admin/qr/[id]/edit`으로 이동

**제거 대상**
- `Step2Tags.tsx`, `Step3Sections.tsx`, `Step4Notice.tsx`, `Step5Confirm.tsx` 파일 삭제
- `Step1Basic.tsx`는 탭 1 콘텐츠로 재활용 (인터페이스 유지)

---

### 수정 페이지 (`/admin/qr/[id]/edit`)

**네비게이션**
- 좌: `← 목록`
- 중앙: 탭 인디케이터
- 우: `페이지 보기 →` (기존 유지)
- 기존 전역 `저장` 버튼 제거

**탭 이동**
- 탭 인디케이터 클릭으로 자유 이동

**탭별 저장 동작**

| 탭 | 저장 버튼 | API 동작 |
|---|---|---|
| 1. 기본 정보 | `저장` | `PATCH /api/qr/[id]` (name·subtitle·summary·idus_url) |
| 2. 구매 안내 | `저장` | NoticePanel이 이미 즉시 저장, 버튼은 모달 트리거만 |
| 3. 태그 | `저장` | TagsPanel이 이미 즉시 저장, 버튼은 모달 트리거만 |
| 4. 섹션 | `저장` | SectionsPanel이 이미 즉시 저장, 버튼은 모달 트리거만 |

각 탭 하단 우측에 `저장` 버튼 위치.

**저장 완료 모달**
```
저장되었습니다 ✓
변경사항이 저장되었습니다

[ 홈으로 ]   [ 계속 수정하기 ]
```
- `홈으로`: `/admin/dashboard`로 이동
- `계속 수정하기`: 모달 닫기 (현재 탭 유지)

---

## 미리보기 패널 (공통)

**변경 전**
```tsx
// 고정 높이 + overflow-hidden → 콘텐츠 잘림
<div style={{ width: OUTER_W, height: OUTER_H }} className="overflow-hidden ...">
  <div style={{ width: INNER_W, height: INNER_H, transform: `scale(${PREVIEW_SCALE})` ... }}>
```

**변경 후**
```tsx
// 고정 높이 유지 + overflow-y: auto → 내부 스크롤
const OUTER_H = Math.round(INNER_H * PREVIEW_SCALE)  // 738px (변경 없음)

<div
  style={{ width: OUTER_W, height: OUTER_H, overflowY: 'auto', overflowX: 'hidden' }}
  className="rounded-[36px] border-4 border-brown-dark/30 shadow-2xl bg-cream-bg"
>
  <div
    style={{
      width: INNER_W,
      transform: `scale(${PREVIEW_SCALE})`,
      transformOrigin: 'top left',
      pointerEvents: 'none',
    }}
  >
    <ProductLandingPage product={previewProduct} />
  </div>
</div>
```

- 외부 컨테이너: 고정 폭/높이 유지, `overflow-y: auto`
- 내부 div: 고정 `height: INNER_H` 제거, 콘텐츠 높이대로 확장
- `position: absolute` 제거 → 일반 흐름으로 변경 (스크롤 높이 계산을 위해)

---

## 파일 구조 변경

**삭제**
- `app/admin/qr/new/steps/Step2Tags.tsx`
- `app/admin/qr/new/steps/Step3Sections.tsx`
- `app/admin/qr/new/steps/Step4Notice.tsx`
- `app/admin/qr/new/steps/Step5Confirm.tsx`

**수정**
- `app/admin/qr/new/page.tsx` — 위저드 → 탭 레이아웃으로 전면 재작성
- `app/admin/qr/new/steps/Step1Basic.tsx` — BasicData 인터페이스 유지, 탭 콘텐츠로 재활용
- `app/admin/qr/[id]/edit/EditClient.tsx` — 전체 → 탭 레이아웃으로 전면 재작성

**모달 컴포넌트**
- `components/admin/SaveCompleteModal.tsx` 신규 생성
  - Props: `open: boolean`, `title: string`, `message: string`, `primaryLabel: string`, `onPrimary: () => void`, `onSecondary: () => void`, `secondaryLabel: string`
  - 양쪽 페이지에서 재사용

---

## E2E 테스트 변경

`e2e/qr.spec.ts`에서:
- "QR 생성" 버튼 접근: 탭 이동 없이 네비게이션에서 바로 클릭
- `page.getByLabel('Google Drive 폴더 URL')` 참조 제거 (이미 제거됨)
- 생성 후 모달에서 "홈으로" 클릭 → dashboard URL 확인

---

## 미결 사항

없음. 모든 설계 결정 확정.
