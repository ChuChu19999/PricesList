from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class ProductResponse(BaseModel):
    """Продукт в ответе API."""

    model_config = ConfigDict(populate_by_name=True)

    id: int
    name: str = Field(..., max_length=20)
    price: Decimal
    product_url: str = Field(..., serialization_alias="productUrl")
    section_id: Optional[int] = Field(None, serialization_alias="sectionId")
    section_name: Optional[str] = Field(None, serialization_alias="sectionName")
    include_in_sum: bool = Field(..., serialization_alias="includeInSum")
    has_image: bool = Field(..., serialization_alias="hasImage")
    image_url: Optional[str] = Field(None, serialization_alias="imageUrl")


class ProductsListResponse(BaseModel):
    """Список товаров с итогами для таблицы."""

    model_config = ConfigDict(populate_by_name=True)

    items: list[ProductResponse]
    total: int
    total_sum: Decimal = Field(..., serialization_alias="totalSum")


class ProductCreate(BaseModel):
    """Поля продукта без изображения (файл передаётся отдельно в multipart)."""

    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(..., min_length=1, max_length=20)
    price: Decimal = Field(..., ge=0)
    product_url: HttpUrl = Field(..., alias="productUrl")
    section_id: int = Field(..., alias="sectionId")
    include_in_sum: bool = Field(True, alias="includeInSum")


class ProductUpdate(BaseModel):
    """Обновление полей продукта (изображение опционально в multipart)."""

    model_config = ConfigDict(populate_by_name=True)

    name: str = Field(..., min_length=1, max_length=20)
    price: Decimal = Field(..., ge=0)
    product_url: HttpUrl = Field(..., alias="productUrl")
    section_id: int = Field(..., alias="sectionId")
    include_in_sum: bool = Field(..., alias="includeInSum")


class ProductIncludeInSumUpdate(BaseModel):
    """Быстрое переключение учёта в сумме."""

    model_config = ConfigDict(populate_by_name=True)

    include_in_sum: bool = Field(..., alias="includeInSum")
