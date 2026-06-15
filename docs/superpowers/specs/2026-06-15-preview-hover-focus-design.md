# Preview Hover Focus — Design Spec

## Goal

미리보기 포커스 UI(테두리 gold, "↕ 스크롤" 뱃지)를 클릭 기반에서 **호버 기반**으로 전환한다.

## 문제

현재 구현(클릭 활성화 + 바깥 클릭 비활성화)은 스크롤을 멈추고 마우스를 이동해도 포커스 UI가 계속 남아 부자연스럽다.

## 해결

미리보기 div에 마우스가 올라오면 활성화, 벗어나면 즉시 비활성화한다.

## 변경 대상

| 파일 | 변경 내용 |
|---|---|
| `app/admin/qr/new/page.tsx` | 트리거 교체 |
| `app/admin/qr/[id]/edit/EditClient.tsx` | 트리거 교체 |

## 제거

- 미리보기 div의 `onClick={(e) => { e.stopPropagation(); setPreviewFocused(true) }}`
- `<main>`의 `onClick={() => setPreviewFocused(false)}`

## 추가

미리보기 div에:
```tsx
onMouseEnter={() => setPreviewFocused(true)}
onMouseLeave={() => setPreviewFocused(false)}
```

## 유지

- `previewFocused` state
- 뱃지 opacity 조건부 렌더링
- 테두리 border 조건부 클래스
- `aria-hidden="true"` on badge span
