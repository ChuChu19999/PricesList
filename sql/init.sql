-- Схема БД: разделы, товары, цены, изображения
-- Выполните в PostgreSQL (замените имя схемы на POSTGRES_DB_SCHEMA из backend/.env)
-- Подходит для новой базы и для обновления со старой версии

CREATE SCHEMA IF NOT EXISTS products_list;

SET search_path TO products_list;

CREATE TABLE IF NOT EXISTS sections (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    CONSTRAINT sections_name_key UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(20) NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    product_url TEXT NOT NULL,
    section_id BIGINT REFERENCES sections (id) ON DELETE RESTRICT,
    include_in_sum BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT products_product_url_https CHECK (product_url ~* '^https://')
);

CREATE TABLE IF NOT EXISTS product_images (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL UNIQUE REFERENCES products (id) ON DELETE CASCADE,
    content BYTEA NOT NULL,
    content_type VARCHAR(127) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products (name);
CREATE INDEX IF NOT EXISTS idx_products_price ON products (price);
CREATE INDEX IF NOT EXISTS idx_products_section_id ON products (section_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images (product_id);

COMMENT ON TABLE sections IS 'Разделы каталога товаров';
COMMENT ON TABLE products IS 'Товары с ценами и ссылками';
COMMENT ON TABLE product_images IS 'Бинарные изображения товаров (BYTEA)';
COMMENT ON COLUMN sections.name IS 'Название раздела (до 50 символов, уникально)';
COMMENT ON COLUMN products.name IS 'Наименование (до 20 символов)';
COMMENT ON COLUMN products.price IS 'Цена';
COMMENT ON COLUMN products.product_url IS 'Ссылка на товар (только https)';
COMMENT ON COLUMN products.section_id IS 'Раздел товара (NULL — ещё не отнесён)';
COMMENT ON COLUMN products.include_in_sum IS 'Учитывать цену товара в итоговой сумме';
COMMENT ON COLUMN product_images.content IS 'Содержимое файла изображения';
COMMENT ON COLUMN product_images.content_type IS 'MIME-тип (image/jpeg, image/png и т.д.)';

-- Миграция со старой схемы: URL картинки в products.image_url
ALTER TABLE products DROP COLUMN IF EXISTS image_url;

-- Миграция: таблица разделов и FK у существующих баз
CREATE TABLE IF NOT EXISTS sections (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    CONSTRAINT sections_name_key UNIQUE (name)
);

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS section_id BIGINT;

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS include_in_sum BOOLEAN NOT NULL DEFAULT TRUE;

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
