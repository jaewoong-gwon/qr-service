-- =====================================================
-- 전체 리셋 스크립트
-- 1단계: 기존 데이터 백업
-- 2단계: 테이블 전체 삭제
-- 3단계: 최신 스키마로 재생성
-- =====================================================

-- ─────────────────────────────────────────────────────
-- 1. 데이터 백업 (실행 전 이미 존재하는 테이블만 백업)
-- ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS _backup_admins               AS SELECT * FROM admins;
CREATE TABLE IF NOT EXISTS _backup_qr_codes             AS SELECT * FROM qr_codes;
CREATE TABLE IF NOT EXISTS _backup_products             AS SELECT * FROM products;
CREATE TABLE IF NOT EXISTS _backup_notice_groups        AS SELECT * FROM notice_groups;
CREATE TABLE IF NOT EXISTS _backup_notice_group_items   AS SELECT * FROM notice_group_items;
CREATE TABLE IF NOT EXISTS _backup_product_tags         AS SELECT * FROM product_tags;
CREATE TABLE IF NOT EXISTS _backup_product_sections     AS SELECT * FROM product_sections;

-- ─────────────────────────────────────────────────────
-- 2. 테이블 전체 삭제 (FK 의존 순서대로)
-- ─────────────────────────────────────────────────────
DROP TABLE IF EXISTS product_sections   CASCADE;
DROP TABLE IF EXISTS product_tags       CASCADE;
DROP TABLE IF EXISTS notice_group_items CASCADE;
DROP TABLE IF EXISTS products           CASCADE;
DROP TABLE IF EXISTS notice_groups      CASCADE;
DROP TABLE IF EXISTS qr_codes           CASCADE;
DROP TABLE IF EXISTS admins             CASCADE;

-- ─────────────────────────────────────────────────────
-- 3. 테이블 재생성
-- ─────────────────────────────────────────────────────

-- 관리자 계정
CREATE TABLE admins (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id      text        NOT NULL UNIQUE,
  password_hash text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- QR 코드
CREATE TABLE qr_codes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       text        NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 구매 전 확인사항 공통 그룹
CREATE TABLE notice_groups (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL
);

-- 제품 기본 정보
CREATE TABLE products (
  id               uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id       uuid    NOT NULL REFERENCES qr_codes(id) ON DELETE CASCADE,
  name             text    NOT NULL,
  subtitle         text,
  idus_url         text,
  is_active        boolean NOT NULL DEFAULT true,
  notice_group_id  uuid    REFERENCES notice_groups(id)
);

-- 그룹별 확인사항 항목
CREATE TABLE notice_group_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_group_id  uuid NOT NULL REFERENCES notice_groups(id) ON DELETE CASCADE,
  content          text NOT NULL,
  sort_order       int  NOT NULL DEFAULT 0
);

-- 제품별 키워드 태그 (동일 제품 내 중복 label 금지)
CREATE TABLE product_tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  label      text NOT NULL,
  sort_order int  NOT NULL DEFAULT 0,
  CONSTRAINT uq_product_tags_product_label UNIQUE (product_id, label)
);

-- 제품 설명 섹션 (meaning: 추가 설명 / closing: 마무리 문구)
CREATE TABLE product_sections (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  section_type text NOT NULL CHECK (section_type IN ('meaning', 'closing')),
  title        text,
  body         text,
  sort_order   int  NOT NULL DEFAULT 0
);
