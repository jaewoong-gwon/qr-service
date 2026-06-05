# Product Detail Sections Page — Design Spec

**Date:** 2026-06-05
**Branch:** feat/ui-redesign-cream-gold
**Sub-project:** 1 of 2 (Renderer). Sub-project 2 (Admin Editor) is out of scope here.

---

## Goal

Replace the simple `ProductPageView` with a rich, section-based product detail page. Each product can have a custom set of ordered sections. Design is fixed; content is assembled from DB data. Accessed via QR code scan → `/r/[slug]`.

---

## Architecture

### Rendering Flow

```
GET /r/[slug]  (server component)
  1. Fetch qr_code by slug
  2. Fetch product by qr_code_id
  3. Fetch product_sections WHERE product_id = ? ORDER BY display_order ASC
  4. sections.length > 0 → ProductDetailView (new)
     sections.length === 0 → ProductPageView (existing fallback)
```

### Component Structure

```
components/product-detail/
  ProductDetailView.tsx          ← orchestrator: maps section_type → component
  sections/
    HeroSection.tsx
    TextBlockSection.tsx
    FeatureCardsSection.tsx
    SpecsSection.tsx
    RecommendListSection.tsx
    QuoteSection.tsx
    PhotoSection.tsx             ← 'use client' (lightbox)
```

---

## Database

### New Table: `product_sections`

```sql
CREATE TABLE product_sections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  section_type  text NOT NULL
                  CHECK (section_type IN (
                    'hero', 'text_block', 'feature_cards',
                    'specs', 'recommend_list', 'quote', 'photo_section'
                  )),
  display_order int NOT NULL,
  content       jsonb NOT NULL,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX ON product_sections (product_id, display_order);
```

### Content Schemas per Section Type

All `image_drive_id` values are Google Drive file IDs passed to the existing `driveThumbUrl(id)` function.

**`hero`**
```json
{ "title": "string", "subtitle": "string", "body": "optional", "image_drive_id": "optional" }
```

**`text_block`**
```json
{ "heading": "string", "subheading": "optional", "body": "string", "icon_drive_id": "optional" }
```

**`feature_cards`**
```json
{
  "heading": "string",
  "cards": [{ "icon_drive_id": "string", "title": "string", "description": "string" }]
}
```

**`specs`**
```json
{
  "heading": "string",
  "items": [{ "image_drive_id": "string", "label": "string" }],
  "note": "optional"
}
```

**`recommend_list`**
```json
{ "heading": "string", "items": ["string"] }
```

**`quote`**
```json
{ "text": "string", "attribution": "optional" }
```

**`photo_section`**
```json
{ "heading": "optional", "body": "optional", "image_drive_id": "string" }
```

---

## TypeScript Types (lib/types.ts 추가)

```ts
export type SectionType =
  | 'hero' | 'text_block' | 'feature_cards'
  | 'specs' | 'recommend_list' | 'quote' | 'photo_section'

export interface HeroContent {
  title: string; subtitle: string; body?: string; image_drive_id?: string
}
export interface TextBlockContent {
  heading: string; subheading?: string; body: string; icon_drive_id?: string
}
export interface FeatureCardsContent {
  heading: string
  cards: Array<{ icon_drive_id: string; title: string; description: string }>
}
export interface SpecsContent {
  heading: string
  items: Array<{ image_drive_id: string; label: string }>
  note?: string
}
export interface RecommendListContent { heading: string; items: string[] }
export interface QuoteContent { text: string; attribution?: string }
export interface PhotoSectionContent { heading?: string; body?: string; image_drive_id: string }

export type SectionContent =
  | HeroContent | TextBlockContent | FeatureCardsContent
  | SpecsContent | RecommendListContent | QuoteContent | PhotoSectionContent

export interface ProductSection {
  id: string
  product_id: string
  section_type: SectionType
  display_order: number
  content: SectionContent
}
```

---

## Visual Design

All sections: `max-w-[480px] mx-auto px-4`, section spacing `py-8`, divider `border-t border-gold/20`.

**`hero`**
- Title: `text-3xl font-bold text-brown-dark leading-tight`
- Subtitle: `text-[10px] tracking-[3px] text-gold uppercase`
- Body: `text-sm text-brown-mid leading-relaxed`
- Image: full-width, `rounded-xl border border-gold/20 mt-4`

**`text_block`**
- Center-aligned
- Icon (optional): 32px Drive thumbnail, centered
- Subheading: `text-[10px] tracking-[3px] text-gold uppercase`
- Heading: `text-2xl font-bold text-brown-dark`
- Gold divider: `w-8 h-px bg-gold mx-auto my-3`
- Body: `text-sm text-brown-mid leading-relaxed`

**`feature_cards`**
- Heading: `text-xl font-bold text-brown-dark text-center`
- Grid: `grid grid-cols-2 gap-3 mt-4`
- Card: `bg-cream border border-gold/30 rounded-xl p-4 flex flex-col items-center gap-2`
- Icon: 40px Drive thumbnail
- Card title: `text-sm font-bold text-brown-dark text-center`
- Card desc: `text-xs text-brown-light text-center`

**`specs`**
- Heading: `text-xl font-bold text-brown-dark text-center`
- Items: vertical stack, image `w-24 h-24 object-cover rounded-lg border border-gold/20`, label `text-sm font-bold text-brown-dark`
- Note box: `bg-gold/10 border border-gold/30 rounded-lg p-3 text-xs text-brown-mid mt-4`

**`recommend_list`**
- Heading: `text-xl font-bold text-brown-dark`
- Gold divider: `w-8 h-px bg-gold my-3`
- Items: `flex items-start gap-2`, bullet `text-gold` (›), text `text-sm text-brown-mid`

**`quote`**
- Background: `bg-cream border-t border-b border-gold/30 py-8`
- Decorators: `"` `"` in `text-4xl text-gold/40`
- Text: `text-base text-brown-mid text-center leading-relaxed`
- Attribution: `text-xs text-brown-light mt-2 text-center`

**`photo_section`**
- Heading (optional): `text-xl font-bold text-brown-dark`
- Body (optional): `text-sm text-brown-mid leading-relaxed mt-2`
- Image: full-width Drive thumbnail, `rounded-xl border border-gold/20 mt-4`
- Click → lightbox (same pattern as ProductPageView)

---

## Data Fetching (app/r/[slug]/page.tsx 수정)

```ts
const { data: sectionsData } = await supabase
  .from('product_sections')
  .select('*')
  .eq('product_id', product.id)
  .order('display_order', { ascending: true })

const sections = (sectionsData ?? []) as ProductSection[]

if (sections.length > 0) {
  return <ProductDetailView product={product} sections={sections} />
}
// fallback: Drive 이미지 fetch 후 기존 ProductPageView
const images = await getFolderImages(qrCode.drive_folder_url)
return <ProductPageView product={product} images={images} />
```

---

## Error Handling

- 알 수 없는 `section_type`: 해당 섹션 skip (렌더링 생략)
- `image_drive_id` 없는 이미지 섹션: dashed gold border placeholder div
- 빈 `cards` / `items` 배열: 섹션 생략

---

## Testing

`__tests__/components/product-detail/` 에 단위 테스트:

- `HeroSection.test.tsx` — title/subtitle 렌더, 이미지 없이도 렌더
- `TextBlockSection.test.tsx` — heading/body 렌더, icon 없이도 렌더
- `FeatureCardsSection.test.tsx` — 카드 목록 렌더
- `SpecsSection.test.tsx` — items + note 렌더
- `RecommendListSection.test.tsx` — 항목 렌더
- `QuoteSection.test.tsx` — text 렌더, attribution 선택적
- `PhotoSection.test.tsx` — heading/body 선택적 렌더
- `ProductDetailView.test.tsx` — section_type별 올바른 컴포넌트 매핑, unknown type skip

---

## Out of Scope (Sub-project 2)

- 어드민 섹션 에디터 UI
- 섹션 순서 변경 / 추가 / 삭제 인터페이스
- Drive 이미지 업로드