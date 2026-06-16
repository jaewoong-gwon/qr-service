-- =====================================================
-- product_schema: 랜딩 페이지 지원 테이블 및 컬럼 정의
-- =====================================================

-- 구매 전 확인사항 공통 그룹
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

-- 제품별 키워드 태그 (동일 제품 내 중복 label 금지)
CREATE TABLE IF NOT EXISTS product_tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label      text NOT NULL,
  sort_order int  NOT NULL DEFAULT 0,
  CONSTRAINT uq_product_tags_product_label UNIQUE (product_id, label)
);

-- 제품 설명 섹션 (meaning: 추가 설명 / closing: 마무리 문구)
CREATE TABLE IF NOT EXISTS product_sections (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  section_type text NOT NULL CHECK (section_type IN ('meaning', 'closing')),
  title        text,
  body         text,
  sort_order   int  NOT NULL DEFAULT 0
);

-- products 테이블 컬럼 추가
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS subtitle        text,
  ADD COLUMN IF NOT EXISTS notice_group_id uuid REFERENCES notice_groups(id),
  ADD COLUMN IF NOT EXISTS is_active       boolean NOT NULL DEFAULT true;

-- qr_codes 테이블 정리
ALTER TABLE qr_codes
  DROP COLUMN IF EXISTS drive_folder_url;
