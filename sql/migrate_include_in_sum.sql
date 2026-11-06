-- Миграция: учёт товара в итоговой сумме
-- Выполните в PostgreSQL (замените имя схемы на POSTGRES_DB_SCHEMA из backend/.env)

CREATE SCHEMA IF NOT EXISTS products_list;

SET search_path TO products_list;

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS include_in_sum BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN products.include_in_sum IS 'Учитывать цену товара в итоговой сумме';
