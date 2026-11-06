from typing import TYPE_CHECKING
from sqlalchemy import BigInteger, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.config import get_database_schema
from core.database import Base

if TYPE_CHECKING:
    from models.product import Product

_schema = get_database_schema()


class Section(Base):
    """Раздел каталога товаров."""

    __tablename__ = "sections"
    __table_args__ = (
        UniqueConstraint("name", name="sections_name_key"),
        {"schema": _schema},
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)

    products: Mapped[list["Product"]] = relationship(
        back_populates="section",
        lazy="noload",
    )
