-- =====================================================
-- 증분 마이그레이션: closing_templates 기능 추가
-- 기존 데이터를 보존하면서 변경사항만 적용
-- =====================================================

-- 1. closing_templates 테이블 신규 생성
CREATE TABLE IF NOT EXISTS closing_templates (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  body text NOT NULL
);

-- 2. products 테이블에 closing_template_id 컬럼 추가
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS closing_template_id uuid REFERENCES closing_templates(id) ON DELETE SET NULL;

-- 3. product_sections CHECK 제약 업데이트
--    기존 section_type IN ('meaning', 'closing') → ('meaning') 으로 변경
--    실행 전 closing 타입 섹션이 없어야 함 (있으면 아래 DELETE를 먼저 실행)
-- DELETE FROM product_sections WHERE section_type = 'closing';

ALTER TABLE product_sections
  DROP CONSTRAINT IF EXISTS product_sections_section_type_check;

ALTER TABLE product_sections
  ADD CONSTRAINT product_sections_section_type_check
  CHECK (section_type IN ('meaning'));
