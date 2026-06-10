# Database Schema

Supabase (PostgreSQL) 기반. 모든 테이블은 `public` 스키마.

---

## qr_codes

QR 코드 엔티티. 슬러그로 제품 페이지와 연결된다.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | 고유 ID |
| `slug` | `text` | UNIQUE, NOT NULL | 8자리 hex (Drive 폴더 ID SHA-256 앞 8자) |
| `drive_folder_url` | `text` | NOT NULL | Google Drive 폴더 URL |
| `created_at` | `timestamptz` | default `now()` | 생성 시각 |

---

## products

QR 코드에 연결된 제품 정보.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | 고유 ID |
| `qr_code_id` | `uuid` | FK → `qr_codes.id`, NOT NULL | 연결된 QR 코드 |
| `name` | `text` | NOT NULL | 제품명 |
| `description` | `text` | nullable | 설명 |
| `price` | `text` | nullable | 가격 (자유 형식, 예: "12,000원") |
| `materials` | `text` | nullable | 소재 |
| `dimensions` | `text` | nullable | 크기 |

---

## product_sections

제품 상세 페이지의 콘텐츠 섹션. `display_order` 기준 정렬.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | 고유 ID |
| `product_id` | `uuid` | FK → `products.id`, NOT NULL | 연결된 제품 |
| `section_type` | `text` | NOT NULL | `hero` \| `text_block` \| `feature_cards` \| `specs` \| `recommend_list` \| `quote` \| `photo_section` |
| `display_order` | `integer` | NOT NULL, default `0` | 노출 순서 (0부터 시작) |
| `content` | `jsonb` | NOT NULL | 섹션 타입별 콘텐츠 (아래 참고) |
| `created_at` | `timestamptz` | default `now()` | 생성 시각 |

### content 스키마 (section_type별)

```jsonc
// hero
{ "title": "string", "subtitle": "string", "body": "string?", "image_drive_id": "string?" }

// text_block
{ "heading": "string", "subheading": "string?", "body": "string", "icon_drive_id": "string?" }

// feature_cards
{ "heading": "string", "cards": [{ "icon_drive_id": "string", "title": "string", "description": "string" }] }

// specs
{ "heading": "string", "items": [{ "image_drive_id": "string", "label": "string" }], "note": "string?" }

// recommend_list
{ "heading": "string", "items": ["string"] }

// quote
{ "text": "string", "attribution": "string?" }

// photo_section
{ "image_drive_id": "string", "heading": "string?", "body": "string?" }
```

---

## admins

어드민 계정. 단일 계정 운영 기준.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | 고유 ID |
| `admin_id` | `text` | UNIQUE, NOT NULL | 로그인 ID |
| `password_hash` | `text` | NOT NULL | bcrypt 해시 |
| `created_at` | `timestamptz` | default `now()` | 생성 시각 |

---

## Relationships

```
qr_codes (1) ──── (1) products
products (1) ──── (N) product_sections
```
