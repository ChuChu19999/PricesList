from decimal import Decimal
from typing import Optional
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from core.exceptions import NotFoundError
from models.product import Product
from models.product_image import ProductImage
from schemas.product import ProductCreate, ProductResponse, ProductUpdate
from utils.filters import add_text_search_filter

ALLOWED_SORT_FIELDS = {
    "name": Product.name,
    "price": Product.price,
    "id": Product.id,
}

_PRODUCT_LOAD_OPTIONS = (selectinload(Product.image),)


def to_product_response(product: Product) -> ProductResponse:
    """Сериализация продукта с URL эндпоинта изображения."""
    has_image = product.image is not None
    return ProductResponse(
        id=product.id,
        name=product.name,
        price=product.price,
        product_url=product.product_url,
        has_image=has_image,
        image_url=f"/api/products/{product.id}/image" if has_image else None,
    )


def _build_product_filters(search: Optional[str]) -> list:
    """Условия выборки по наименованию."""
    conditions: list = []
    add_text_search_filter(conditions, search, Product.name)
    return conditions


async def list_products(
    db: AsyncSession,
    *,
    sort_by: Optional[str],
    sort_order: Optional[str],
    search: Optional[str],
) -> tuple[list[Product], int, Decimal]:
    """Полный список товаров с итогами, сортировкой и поиском по наименованию."""
    conditions = _build_product_filters(search)

    aggregate_query = select(
        func.count(Product.id),
        func.coalesce(func.sum(Product.price), 0),
    )
    if conditions:
        aggregate_query = aggregate_query.where(*conditions)

    aggregate_result = await db.execute(aggregate_query)
    total, total_sum = aggregate_result.one()
    total_sum = Decimal(str(total_sum))

    query: Select = select(Product).options(*_PRODUCT_LOAD_OPTIONS)
    if conditions:
        query = query.where(*conditions)

    sort_column = ALLOWED_SORT_FIELDS.get(sort_by or "name", Product.name)
    if sort_order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())

    result = await db.execute(query)
    items = list(result.scalars().unique().all())
    return items, int(total), total_sum


async def get_product_by_id(db: AsyncSession, product_id: int) -> Product:
    """Продукт по id или 404."""
    result = await db.execute(
        select(Product).where(Product.id == product_id).options(*_PRODUCT_LOAD_OPTIONS)
    )
    product = result.scalar_one_or_none()
    if product is None:
        raise NotFoundError("Товар не найден")
    return product


async def get_product_image_row(db: AsyncSession, product_id: int) -> ProductImage:
    """Строка изображения продукта или 404."""
    await get_product_by_id(db, product_id)
    result = await db.execute(
        select(ProductImage).where(ProductImage.product_id == product_id)
    )
    image = result.scalar_one_or_none()
    if image is None:
        raise NotFoundError("Изображение не найдено")
    return image


async def _set_product_image(
    db: AsyncSession,
    product_id: int,
    content: bytes,
    content_type: str,
) -> None:
    """Создаёт или заменяет бинарное изображение продукта без lazy-load."""
    result = await db.execute(
        select(ProductImage).where(ProductImage.product_id == product_id)
    )
    image = result.scalar_one_or_none()
    if image is not None:
        image.content = content
        image.content_type = content_type
        return
    db.add(
        ProductImage(
            product_id=product_id,
            content=content,
            content_type=content_type,
        )
    )


async def create_product(
    db: AsyncSession,
    payload: ProductCreate,
    *,
    image_content: bytes,
    content_type: str,
) -> Product:
    """Добавление товара в таблицу с изображением."""
    product = Product(
        name=payload.name,
        price=Decimal(payload.price),
        product_url=str(payload.product_url),
    )
    db.add(product)
    await db.flush()
    await _set_product_image(db, product.id, image_content, content_type)
    await db.flush()
    return await get_product_by_id(db, product.id)


async def update_product(
    db: AsyncSession,
    product_id: int,
    payload: ProductUpdate,
    *,
    image_content: Optional[bytes] = None,
    content_type: Optional[str] = None,
) -> Product:
    """Обновление продукта и при необходимости изображения."""
    product = await get_product_by_id(db, product_id)
    product.name = payload.name
    product.price = Decimal(payload.price)
    product.product_url = str(payload.product_url)
    if image_content is not None and content_type is not None:
        await _set_product_image(db, product_id, image_content, content_type)
    await db.flush()
    return await get_product_by_id(db, product_id)


async def delete_product(db: AsyncSession, product_id: int) -> None:
    """Физическое удаление продукта и связанного изображения."""
    product = await get_product_by_id(db, product_id)
    await db.delete(product)
    await db.flush()
