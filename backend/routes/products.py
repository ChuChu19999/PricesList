from decimal import Decimal
from typing import Optional
from fastapi import APIRouter, Depends, File, Form, Query, Response, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from schemas.product import (
    ProductCreate,
    ProductIncludeInSumUpdate,
    ProductResponse,
    ProductsListResponse,
    ProductUpdate,
)
from services.products import (
    create_product,
    delete_product,
    get_product_image_row,
    list_products,
    set_product_include_in_sum,
    to_product_response,
    update_product,
)
from utils.image_upload import read_image_upload

router = APIRouter()


@router.get(
    "/",
    response_model=ProductsListResponse,
    summary="Список товаров",
    description=(
        "Таблица товаров с сортировкой (name, price, id), поиском, "
        "фильтром по разделу и итоговой суммой цен."
    ),
)
async def get_products(
    sort_by: Optional[str] = Query(
        "name", alias="sortBy", description="Поле сортировки: name, price, id"
    ),
    sort_order: Optional[str] = Query(
        "asc", alias="sortOrder", description="Порядок: asc или desc"
    ),
    search: Optional[str] = Query(
        None, min_length=1, description="Поиск по наименованию"
    ),
    section_id: Optional[int] = Query(
        None, alias="sectionId", description="Фильтр по id раздела"
    ),
    unsectioned_only: bool = Query(
        False,
        alias="unsectionedOnly",
        description="Только товары без раздела",
    ),
    db: AsyncSession = Depends(get_db, scope="function"),
):
    """Список товаров для таблицы на фронтенде."""
    items, total, total_sum = await list_products(
        db,
        sort_by=sort_by,
        sort_order=sort_order,
        search=search,
        section_id=section_id,
        unsectioned_only=unsectioned_only,
    )
    return ProductsListResponse(
        items=[to_product_response(product) for product in items],
        total=total,
        total_sum=total_sum,
    )


@router.get(
    "/{product_id}/image",
    summary="Изображение товара",
    responses={
        200: {"content": {"image/*": {}}},
        404: {"description": "Изображение не найдено"},
    },
)
async def get_product_image(
    product_id: int,
    db: AsyncSession = Depends(get_db, scope="function"),
):
    """Отдача бинарного изображения из БД."""
    image = await get_product_image_row(db, product_id)
    return Response(
        content=image.content,
        media_type=image.content_type,
        headers={"Cache-Control": "public, max-age=3600"},
    )


@router.post(
    "/",
    response_model=ProductResponse,
    status_code=201,
    summary="Добавить товар",
)
async def post_product(
    name: str = Form(..., min_length=1, max_length=20),
    price: Decimal = Form(..., ge=0),
    product_url: str = Form(..., alias="productUrl"),
    section_id: int = Form(..., alias="sectionId"),
    include_in_sum: bool = Form(True, alias="includeInSum"),
    image: Optional[UploadFile] = File(
        None, description="Файл изображения (необязательно)"
    ),
    db: AsyncSession = Depends(get_db, scope="function"),
):
    """Создание товара; изображение в multipart необязательно."""
    image_content = None
    content_type = None
    if image is not None and image.filename:
        image_content, content_type = await read_image_upload(image)

    payload = ProductCreate.model_validate(
        {
            "name": name,
            "price": price,
            "productUrl": product_url,
            "sectionId": section_id,
            "includeInSum": include_in_sum,
        }
    )
    product = await create_product(
        db,
        payload,
        image_content=image_content,
        content_type=content_type,
    )
    return to_product_response(product)


@router.patch(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Изменить товар",
)
async def patch_product(
    product_id: int,
    name: str = Form(..., min_length=1, max_length=20),
    price: Decimal = Form(..., ge=0),
    product_url: str = Form(..., alias="productUrl"),
    section_id: int = Form(..., alias="sectionId"),
    include_in_sum: bool = Form(..., alias="includeInSum"),
    image: Optional[UploadFile] = File(None, description="Новое изображение"),
    db: AsyncSession = Depends(get_db, scope="function"),
):
    """Обновление записи; файл изображения необязателен."""
    image_content = None
    content_type = None
    if image is not None and image.filename:
        image_content, content_type = await read_image_upload(image)

    payload = ProductUpdate.model_validate(
        {
            "name": name,
            "price": price,
            "productUrl": product_url,
            "sectionId": section_id,
            "includeInSum": include_in_sum,
        }
    )
    product = await update_product(
        db,
        product_id,
        payload,
        image_content=image_content,
        content_type=content_type,
    )
    return to_product_response(product)


@router.patch(
    "/{product_id}/include-in-sum",
    response_model=ProductResponse,
    summary="Учёт товара в сумме",
    description="Включить или исключить товар из итоговой суммы раздела.",
)
async def patch_product_include_in_sum(
    product_id: int,
    payload: ProductIncludeInSumUpdate,
    db: AsyncSession = Depends(get_db, scope="function"),
):
    product = await set_product_include_in_sum(db, product_id, payload.include_in_sum)
    return to_product_response(product)


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Удалить товар",
    description="Физическое удаление товара и изображения из базы данных.",
)
async def remove_product(
    product_id: int,
    db: AsyncSession = Depends(get_db, scope="function"),
):
    """Безвозвратное удаление товара."""
    await delete_product(db, product_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
