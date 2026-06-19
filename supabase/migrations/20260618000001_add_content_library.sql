-- supabase/migrations/20260618000001_add_content_library.sql

CREATE TABLE IF NOT EXISTS content_library (
  id    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body  text NOT NULL
);

CREATE TABLE IF NOT EXISTS product_content_links (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES content_library(id) ON DELETE CASCADE,
  sort_order int  NOT NULL DEFAULT 0,
  CONSTRAINT uq_product_content UNIQUE (product_id, content_id)
);
