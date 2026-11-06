from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from core.database import get_db
from schemas.section import SectionCreate, SectionResponse, SectionUpdate
from services.sections import (
    create_section,
    delete_section,
    list_sections,
    update_section,
)

router = APIRouter()


@router.get(
    "/",
    response_model=list[SectionResponse],
    summary="Список разделов",
)
async def get_sections(db: AsyncSession = Depends(get_db, scope="function")):
    return await list_sections(db)


@router.post(
    "/",
    response_model=SectionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Создать раздел",
)
async def post_section(
    payload: SectionCreate,
    db: AsyncSession = Depends(get_db, scope="function"),
):
    return await create_section(db, payload)


@router.patch(
    "/{section_id}",
    response_model=SectionResponse,
    summary="Переименовать раздел",
)
async def patch_section(
    section_id: int,
    payload: SectionUpdate,
    db: AsyncSession = Depends(get_db, scope="function"),
):
    return await update_section(db, section_id, payload)


@router.delete(
    "/{section_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Удалить раздел",
    description="Удаление только пустого раздела. Если есть товары — 409.",
)
async def remove_section(
    section_id: int,
    db: AsyncSession = Depends(get_db, scope="function"),
):
    await delete_section(db, section_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
