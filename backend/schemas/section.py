from pydantic import BaseModel, ConfigDict, Field


class SectionResponse(BaseModel):
    """Раздел в ответе API."""

    model_config = ConfigDict(populate_by_name=True)

    id: int
    name: str = Field(..., max_length=50)
    products_count: int = Field(0, serialization_alias="productsCount")


class SectionCreate(BaseModel):
    """Создание раздела."""

    name: str = Field(..., min_length=1, max_length=50)


class SectionUpdate(BaseModel):
    """Переименование раздела."""

    name: str = Field(..., min_length=1, max_length=50)
