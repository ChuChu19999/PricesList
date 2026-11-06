import { useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Popconfirm, Spin, Switch } from 'antd';
import { BiDownArrow, BiEdit, BiTrash, BiUpArrow } from 'react-icons/bi';
import { getProductImageSrc } from '../../../shared/api/products';
import type { Product } from '../../../shared/api/products';
import './ProductsTable.css';

const columnHelper = createColumnHelper<Product>();

interface ProductsTableProps {
  items: Product[];
  total: number;
  totalSum: string;
  loading: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  deleteLoadingId?: number | null;
  includeInSumLoadingId?: number | null;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onIncludeInSumChange: (product: Product, includeInSum: boolean) => void;
}

const formatPrice = (value: string) => {
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2,
  }).format(num);
};

const sortableColumns: Record<string, string> = {
  name: 'name',
  price: 'price',
};

export const ProductsTable = ({
  items,
  total,
  totalSum,
  loading,
  sortBy,
  sortOrder,
  deleteLoadingId,
  includeInSumLoadingId,
  onSortChange,
  onEdit,
  onDelete,
  onIncludeInSumChange,
}: ProductsTableProps) => {
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'image',
        header: 'Изображение',
        cell: info => {
          const src = getProductImageSrc(info.row.original);
          if (!src) {
            return <span className="products-table__no-image">—</span>;
          }
          return (
            <img
              src={src}
              alt={info.row.original.name}
              className="products-table__image"
              loading="lazy"
            />
          );
        },
      }),
      columnHelper.accessor('name', {
        header: 'Наименование',
        cell: info => <span className="products-table__name-badge">{info.getValue()}</span>,
      }),
      columnHelper.accessor('price', {
        header: 'Цена',
        cell: info => (
          <a
            href={info.row.original.productUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="products-table__price-link"
            title="Открыть страницу товара"
          >
            {formatPrice(info.getValue())}
          </a>
        ),
      }),
      columnHelper.accessor('includeInSum', {
        header: 'В сумме',
        cell: info => {
          const product = info.row.original;
          return (
            <Switch
              size="small"
              checked={product.includeInSum}
              loading={includeInSumLoadingId === product.id}
              onChange={checked => onIncludeInSumChange(product, checked)}
              title={product.includeInSum ? 'Учитывается в сумме' : 'Не учитывается в сумме'}
            />
          );
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Действия',
        cell: info => {
          const product = info.row.original;
          const isDeleting = deleteLoadingId === product.id;
          return (
            <div className="products-table__actions">
              <button
                type="button"
                className="products-table__action-btn"
                title="Редактировать"
                onClick={() => onEdit(product)}
              >
                <BiEdit size={18} />
              </button>
              <Popconfirm
                title="Удалить товар?"
                description="Запись будет удалена из базы без возможности восстановления."
                okText="Удалить"
                cancelText="Отмена"
                okButtonProps={{ danger: true, loading: isDeleting }}
                onConfirm={() => onDelete(product)}
              >
                <button
                  type="button"
                  className="products-table__action-btn products-table__action-btn--danger"
                  title="Удалить"
                  disabled={isDeleting}
                >
                  <BiTrash size={18} />
                </button>
              </Popconfirm>
            </div>
          );
        },
      }),
    ],
    [deleteLoadingId, includeInSumLoadingId, onEdit, onDelete, onIncludeInSumChange]
  );

  // eslint-disable-next-line react-hooks/incompatible-library -- useReactTable
  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const toggleSort = (columnId: string) => {
    if (!sortableColumns[columnId]) return;
    if (sortBy !== columnId) {
      onSortChange(columnId, 'asc');
      return;
    }
    onSortChange(columnId, sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const renderSortIcon = (columnId: string) => {
    if (sortBy !== columnId) return null;
    return sortOrder === 'asc' ? <BiUpArrow size={14} /> : <BiDownArrow size={14} />;
  };

  return (
    <div className="products-table">
      <Spin spinning={loading}>
        <div className="products-table__scroll">
          <table className="products-table__native">
            <thead>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => {
                    const columnId = header.column.id;
                    const isSortable = Boolean(sortableColumns[columnId]);
                    return (
                      <th key={header.id}>
                        {isSortable ? (
                          <button
                            type="button"
                            className="products-table__sort-btn"
                            onClick={() => toggleSort(columnId)}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {renderSortIcon(columnId)}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map(row => (
                <tr key={row.id}>
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="products-table__empty">
                    Нет товаров в таблице
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Spin>
      {!loading && (
        <p className="products-table__footer">
          <span>Всего: {total}</span>
          <span className="products-table__footer-sep" aria-hidden>
            ·
          </span>
          <span>Сумма учтённых: {formatPrice(totalSum)}</span>
        </p>
      )}
    </div>
  );
};
