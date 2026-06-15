# Preview Focus Indicator — Design Spec

## Goal

미리보기 패널 클릭 시 "스크롤 포커스가 미리보기에 있음"을 사용자에게 시각적으로 알려준다.

## Context

수정 페이지(`/admin/qr/[id]/edit`)와 새 QR 생성 페이지(`/admin/qr/new`)에는 우측 고정 미리보기 패널이 있다. 미리보기 패널은 내부 스크롤(`overflow-y: auto`)을 가지며, 페이지 자체도 스크롤 가능하다. 사용자가 미리보기를 클릭한 뒤 스크롤하면 미리보기가 움직이지만, 포커스가 이동했다는 피드백이 없어 혼란스럽다.

## 범위

- **포함**: 클릭 시 시각적 피드백 (테두리 강조 + 뱃지)
- **제외**: 페이지 스크롤 막기, hover-only 활성화, 모달/별도 뷰어

## 상태

두 페이지 컴포넌트 모두에 동일하게 적용:

```ts
const [previewFocused, setPreviewFocused] = useState(false)
```

## 트리거

| 이벤트 | 결과 |
|---|---|
| 미리보기 div `onClick` | `previewFocused = true`, `e.stopPropagation()` |
| 페이지 outer wrapper `onClick` | `previewFocused = false` |

## 시각적 변화

### ① 테두리 색상

| 상태 | 클래스 |
|---|---|
| 기본 | `border-brown-dark/30` |
| 포커스 | `border-gold` |

`transition-colors`로 부드럽게 전환.

### ② 뱃지

미리보기 프레임 바로 위에 고정 위치. 레이아웃 shift 방지를 위해 항상 DOM에 존재하고 `opacity`만 전환:

```tsx
<div className="flex justify-center mb-2 h-6">
  <span
    className={`text-[10px] bg-gold text-cream px-3 py-1 rounded-full font-bold transition-opacity ${
      previewFocused ? 'opacity-100' : 'opacity-0'
    }`}
  >
    ↕ 스크롤
  </span>
</div>
```

## 완성 JSX 구조 (미리보기 영역)

```tsx
{/* outer wrapper에 onClick={() => setPreviewFocused(false)} 추가 */}
<div className="w-[400px] flex-shrink-0">
  <div className="sticky top-24">
    <p className="text-sm font-bold tracking-[2px] text-gold uppercase mb-3 text-center">
      실시간 미리보기
    </p>
    {/* 뱃지 — 항상 h-6 공간 예약 */}
    <div className="flex justify-center mb-2 h-6">
      <span
        className={`text-[10px] bg-gold text-cream px-3 py-1 rounded-full font-bold transition-opacity ${
          previewFocused ? 'opacity-100' : 'opacity-0'
        }`}
      >
        ↕ 스크롤
      </span>
    </div>
    <div className="mx-auto" style={{ width: `${OUTER_W}px` }}>
      <div
        className={`overflow-y-auto overflow-x-hidden rounded-[36px] border-4 shadow-2xl bg-cream-bg [&::-webkit-scrollbar]:hidden transition-colors ${
          previewFocused ? 'border-gold' : 'border-brown-dark/30'
        }`}
        style={{ width: `${OUTER_W}px`, height: `${OUTER_H}px`, scrollbarWidth: 'none' }}
        onClick={(e) => { e.stopPropagation(); setPreviewFocused(true) }}
      >
        <div style={{ width: `${INNER_W}px`, zoom: PREVIEW_SCALE, pointerEvents: 'none' }}>
          <ProductLandingPage product={previewProduct} />
        </div>
      </div>
    </div>
  </div>
</div>
```

## 변경 파일

| 파일 | 변경 내용 |
|---|---|
| `app/admin/qr/new/page.tsx` | `previewFocused` state, outer wrapper onClick, 미리보기 onClick+클래스 |
| `app/admin/qr/[id]/edit/EditClient.tsx` | 동일 |

새 컴포넌트 없음. 각 파일 변경량 최소 (state 1개 + onClick 2곳 + 조건부 className).
