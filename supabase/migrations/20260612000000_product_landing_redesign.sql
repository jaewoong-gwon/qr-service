-- 구매 전 확인사항 공통 그룹 (레진 8종 등 제품군별 공유)
CREATE TABLE IF NOT EXISTS notice_groups (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL
);

-- 그룹별 확인사항 항목
CREATE TABLE IF NOT EXISTS notice_group_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_group_id  uuid NOT NULL REFERENCES notice_groups(id) ON DELETE CASCADE,
  content          text NOT NULL,
  sort_order       int  NOT NULL DEFAULT 0
);

-- 제품별 키워드 태그 (pill 형태)
CREATE TABLE IF NOT EXISTS product_tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label      text NOT NULL,
  sort_order int  NOT NULL DEFAULT 0
);

-- 제품 설명 섹션 (meaning, description, color_meaning, closing 등)
CREATE TABLE IF NOT EXISTS product_sections (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  section_type text NOT NULL,
  title        text,
  body         text,
  sort_order   int  NOT NULL DEFAULT 0
);

-- 섹션 내 개별 아이템 (색상/상징 의미 그리드용)
CREATE TABLE IF NOT EXISTS product_section_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id  uuid NOT NULL REFERENCES product_sections(id) ON DELETE CASCADE,
  title       text,
  description text,
  sort_order  int  NOT NULL DEFAULT 0
);

-- products 테이블에 새 컬럼 추가
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS subtitle        text,
  ADD COLUMN IF NOT EXISTS summary         text,
  ADD COLUMN IF NOT EXISTS notice_group_id uuid REFERENCES notice_groups(id),
  ADD COLUMN IF NOT EXISTS is_active       boolean NOT NULL DEFAULT true;

-- 데이터 보존: 기존 description 값을 subtitle로 복사
UPDATE products SET subtitle = description WHERE subtitle IS NULL AND description IS NOT NULL;

-- 기존 컬럼(description, body, quote, keywords, purchase_notes)은 데이터 이전 완료 전까지 DROP하지 않는다.
-- RLS가 활성화된 경우 새 테이블에도 동일한 정책 적용 필요.
