-- product_tags: 동일 제품 내 같은 label 중복 방지
-- 적용 전 기존 중복 데이터를 수동으로 제거해야 합니다.
ALTER TABLE product_tags
  ADD CONSTRAINT uq_product_tags_product_label UNIQUE (product_id, label);
