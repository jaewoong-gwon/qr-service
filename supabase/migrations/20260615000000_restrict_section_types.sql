-- 1. 제거 대상 타입 섹션의 아이템 먼저 삭제 (color_meaning, symbol_meaning 등)
DELETE FROM product_section_items
WHERE section_id IN (
  SELECT id FROM product_sections
  WHERE section_type NOT IN ('meaning', 'closing')
);

-- 2. 제거 대상 타입을 meaning으로 변환
UPDATE product_sections
SET section_type = 'meaning'
WHERE section_type NOT IN ('meaning', 'closing');

-- 3. 이후 허용되지 않는 section_type 입력 방지
ALTER TABLE product_sections
  ADD CONSTRAINT product_sections_section_type_check
  CHECK (section_type IN ('meaning', 'closing'));

-- 4. Google Drive URL 컬럼 제거
ALTER TABLE qr_codes
  DROP COLUMN IF EXISTS drive_folder_url;
