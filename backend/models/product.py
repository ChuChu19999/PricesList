from decimal import Decimal
from typing import TYPE_CHECKING, Optional
from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    ForeignKey,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from core.config import get_database_schema
from core.database import Base

if TYPE_CHECKING:
    from models.product_image import ProductImage
    from models.section import Section

_schema = get_database_schema()


class Product(Base):
    """Модель товара в таблице цен (соответствует sql/init.sql)."""

    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint("price >= 0", name="products_price_nonneg"),
        CheckConstraint(
            "product_url ~* '^https://'", name="products_product_url_https"
        ),
        {"schema": _schema},
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, index=True)
    product_url: Mapped[str] = mapped_column(Text, nullable=False)
    section_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey(f"{_schema}.sections.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )
    include_in_sum: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True, server_default="true"
    )

    section: Mapped[Optional["Section"]] = relationship(
        back_populates="products",
        lazy="selectin",
    )
    image: Mapped[Optional["ProductImage"]] = relationship(
        back_populates="product",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin",
    )
