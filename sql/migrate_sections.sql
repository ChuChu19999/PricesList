-- Миграция: разделы товаров для уже существующей базы
-- Выполните в PostgreSQL (замените имя схемы на POSTGRES_DB_SCHEMA из backend/.env)

CREATE SCHEMA IF NOT EXISTS products_list;

SET search_path TO products_list;

CREATE TABLE IF NOT EXISTS sections (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    CONSTRAINT sections_name_key UNIQUE (name)
);

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS section_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'products_section_id_fkey'
    ) THEN
        ALTER TABLE products
            ADD CONSTRAINT products_section_id_fkey
            FOREIGN KEY (section_id) REFERENCES sections (id) ON DELETE RESTRICT;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_section_id ON products (section_id);

COMMENT ON TABLE sections IS 'Разделы каталога товаров';
COMMENT ON COLUMN sections.name IS 'Название раздела (до 50 символов, уникально)';
COMMENT ON COLUMN products.section_id IS 'Раздел товара (NULL — ещё не отнесён)';
