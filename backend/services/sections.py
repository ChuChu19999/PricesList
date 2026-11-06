from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from core.exceptions import ConflictError, NotFoundError
from models.product import Product
from models.section import Section
from schemas.section import SectionCreate, SectionResponse, SectionUpdate


def to_section_response(section: Section, products_count: int = 0) -> SectionResponse:
    """Собрать ответ раздела со счётчиком товаров."""
    return SectionResponse(
        id=section.id,
        name=section.name,
        products_count=products_count,
    )


async def list_sections(db: AsyncSession) -> list[SectionResponse]:
    """Список разделов с количеством товаров, по имени."""
    count_subq = (
        select(Product.section_id, func.count(Product.id).label("products_count"))
        .where(Product.section_id.is_not(None))
        .group_by(Product.section_id)
        .subquery()
    )
    query = (
        select(Section, func.coalesce(count_subq.c.products_count, 0))
        .outerjoin(count_subq, count_subq.c.section_id == Section.id)
        .order_by(Section.name.asc())
    )
    result = await db.execute(query)
    return [
        to_section_response(section, int(products_count))
        for section, products_count in result.all()
    ]


async def get_section_by_id(db: AsyncSession, section_id: int) -> Section:
    """Раздел по id или 404."""
    result = await db.execute(select(Section).where(Section.id == section_id))
    section = result.scalar_one_or_none()
    if section is None:
        raise NotFoundError("Раздел не найден")
    return section


async def require_section_by_id(db: AsyncSession, section_id: int) -> Section:
    """Проверить, что раздел существует."""
    return await get_section_by_id(db, section_id)


async def _products_count(db: AsyncSession, section_id: int) -> int:
    """Количество товаров в разделе."""
    result = await db.execute(
        select(func.count(Product.id)).where(Product.section_id == section_id)
    )
    return int(result.scalar_one())


async def create_section(db: AsyncSession, payload: SectionCreate) -> SectionResponse:
    """Создать раздел с уникальным именем."""
    name = payload.name.strip()
    section = Section(name=name)
    db.add(section)
    try:
        await db.flush()
    except IntegrityError as exc:
        raise ConflictError("Раздел с таким названием уже есть") from exc
    return to_section_response(section, 0)


async def update_section(
    db: AsyncSession, section_id: int, payload: SectionUpdate
) -> SectionResponse:
    """Переименовать раздел."""
    section = await get_section_by_id(db, section_id)
    section.name = payload.name.strip()
    try:
        await db.flush()
    except IntegrityError as exc:
        raise ConflictError("Раздел с таким названием уже есть") from exc
    return to_section_response(section, await _products_count(db, section.id))


async def delete_section(db: AsyncSession, section_id: int) -> None:
    """Удалить пустой раздел; при наличии товаров — конфликт."""
    section = await get_section_by_id(db, section_id)
    if await _products_count(db, section.id) > 0:
        raise ConflictError(
            "Нельзя удалить раздел, в котором есть товары. Сначала перенесите или удалите товары."
        )
    await db.delete(section)
    await db.flush()
