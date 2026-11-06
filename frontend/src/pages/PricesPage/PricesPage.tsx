import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Input, Select, message } from 'antd';
import { Helmet } from 'react-helmet';
import { BiFolder, BiPlus } from 'react-icons/bi';
import { ResetFiltersButton } from '../../entities/ResetFiltersButton';
import { ProductFormModal, type ProductFormMode } from '../../features/ProductForm';
import { SectionsManageModal } from '../../features/SectionsManage';
import {
  useCreateProductMutation,
  useDeleteProductMutation,
  useProductsQuery,
  useSectionsQuery,
  useSetProductIncludeInSumMutation,
  useUpdateProductMutation,
} from '../../shared/api';
import { useUrlSync } from '../../shared/model/hooks/useUrlSync';
import { useProductsQueryStore } from '../../shared/model/stores';
import { ProductsTable } from '../../widgets/ProductsTable';
import type { Product, ProductPayload } from '../../shared/api';
import './PricesPage.css';

const PricesPage = () => {
  const { filters, sorting, setFilters, setSorting } = useProductsQueryStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [sectionsModalOpen, setSectionsModalOpen] = useState(false);
  const [formSession, setFormSession] = useState(0);
  const [modalMode, setModalMode] = useState<ProductFormMode>('create');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [includeInSumLoadingId, setIncludeInSumLoadingId] = useState<number | null>(null);

  const { data: sections = [], isLoading: sectionsLoading } = useSectionsQuery();
  const createMutation = useCreateProductMutation();
  const updateMutation = useUpdateProductMutation();
  const deleteMutation = useDeleteProductMutation();
  const includeInSumMutation = useSetProductIncludeInSumMutation();

  useUrlSync(
    { filterKeys: ['search', 'sectionId'] },
    {
      filters: filters as Record<string, unknown> | undefined,
      sorting: sorting ? { sort_by: sorting.sortBy, sort_order: sorting.sortOrder } : undefined,
    },
    {
      setFilters: value => {
        if (!value) {
          setFilters(undefined);
          return;
        }
        const raw = value as { search?: string; sectionId?: string };
        const sectionIdRaw = raw.sectionId;
        const sectionId =
          typeof sectionIdRaw === 'string' && sectionIdRaw !== ''
            ? Number(sectionIdRaw)
            : undefined;
        setFilters({
          search: typeof raw.search === 'string' ? raw.search : undefined,
          sectionId: Number.isFinite(sectionId) ? sectionId : undefined,
        });
      },
      setSorting: value => {
        if (!value?.sort_by) {
          setSorting(undefined);
          return;
        }
        setSorting({
          sortBy: value.sort_by as 'name' | 'price' | 'id',
          sortOrder: value.sort_order,
        });
      },
    }
  );

  useEffect(() => {
    if (sectionsLoading || sections.length === 0) return;

    const activeExists =
      filters?.sectionId != null && sections.some(section => section.id === filters.sectionId);
    if (activeExists) return;

    const preferred = sections.find(section => section.name === 'Naruto Kayou') ?? sections[0];
    setFilters({
      search: filters?.search,
      sectionId: preferred.id,
    });
  }, [sections, sectionsLoading, filters?.sectionId, filters?.search, setFilters]);

  const activeSectionId = filters?.sectionId;
  const activeSection = useMemo(
    () => sections.find(section => section.id === activeSectionId) ?? null,
    [sections, activeSectionId]
  );

  const { data, isLoading, isFetching, error } = useProductsQuery({
    filters: {
      search: filters?.search,
      sectionId: activeSectionId,
    },
    sorting,
  });

  const sectionOptions = useMemo(
    () =>
      sections.map(section => ({
        value: section.id,
        label: `${section.name} (${section.productsCount})`,
      })),
    [sections]
  );

  const handleSectionChange = useCallback(
    (sectionId: number) => {
      setFilters({
        search: filters?.search,
        sectionId,
      });
    },
    [filters?.search, setFilters]
  );

  const handleReset = useCallback(() => {
    if (activeSectionId == null) {
      setFilters(undefined);
    } else {
      setFilters({ sectionId: activeSectionId });
    }
    setSorting(undefined);
  }, [activeSectionId, setFilters, setSorting]);

  const openCreateModal = useCallback(() => {
    if (activeSectionId == null) {
      message.warning('Сначала создайте и выберите раздел');
      setSectionsModalOpen(true);
      return;
    }
    setModalMode('create');
    setEditingProduct(null);
    setFormSession(session => session + 1);
    setModalOpen(true);
  }, [activeSectionId]);

  const openEditModal = useCallback((product: Product) => {
    setModalMode('edit');
    setEditingProduct(product);
    setFormSession(session => session + 1);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingProduct(null);
  }, []);

  const handleFormSubmit = useCallback(
    (payload: ProductPayload) => {
      if (modalMode === 'create') {
        createMutation.mutate(payload, {
          onSuccess: () => closeModal(),
        });
        return;
      }
      if (!editingProduct) return;
      updateMutation.mutate(
        { id: editingProduct.id, payload },
        {
          onSuccess: () => closeModal(),
        }
      );
    },
    [modalMode, editingProduct, createMutation, updateMutation, closeModal]
  );

  const handleDelete = useCallback(
    (product: Product) => {
      setDeletingId(product.id);
      deleteMutation.mutate(product.id, {
        onSuccess: () => {
          if (editingProduct?.id === product.id) {
            closeModal();
          }
        },
        onSettled: () => setDeletingId(null),
      });
    },
    [deleteMutation, editingProduct, closeModal]
  );

  const handleIncludeInSumChange = useCallback(
    (product: Product, includeInSum: boolean) => {
      setIncludeInSumLoadingId(product.id);
      includeInSumMutation.mutate(
        { id: product.id, includeInSum },
        {
          onSettled: () => setIncludeInSumLoadingId(null),
        }
      );
    },
    [includeInSumMutation]
  );

  const formLoading = createMutation.isPending || updateMutation.isPending;
  const hasSections = sections.length > 0;

  return (
    <div className="prices-page">
      <Helmet>
        <title>{activeSection ? `${activeSection.name} — товары` : 'Товары и цены'}</title>
      </Helmet>

      <header className="prices-page__header">
        <h1 className="prices-page__title">Товары и цены</h1>
        <p className="prices-page__subtitle">
          Выберите раздел и работайте с его товарами. Новый раздел создаётся кнопкой «Разделы».
        </p>
      </header>

      <main className="prices-page__main">
        <section className="prices-page__panel">
          <div className="prices-page__panel-head">
            <h2 className="prices-page__panel-title">
              {activeSection ? activeSection.name : 'Раздел не выбран'}
            </h2>
            <Button
              icon={<BiFolder size={18} />}
              className="prices-page__sections-btn"
              onClick={() => setSectionsModalOpen(true)}
            >
              Разделы
            </Button>
          </div>

          {!sectionsLoading && !hasSections ? (
            <div className="prices-page__empty-section">
              <p>Сначала создайте раздел — затем в нём можно добавлять и редактировать товары.</p>
              <Button
                type="primary"
                className="prices-page__add"
                onClick={() => setSectionsModalOpen(true)}
              >
                Создать раздел
              </Button>
            </div>
          ) : (
            <>
              <div className="prices-page__toolbar">
                <div className="prices-page__section-wrap">
                  <label className="prices-page__label" htmlFor="active-section">
                    Текущий раздел
                  </label>
                  <Select
                    id="active-section"
                    className="prices-page__section-select"
                    value={activeSectionId}
                    options={sectionOptions}
                    onChange={handleSectionChange}
                    loading={sectionsLoading}
                    placeholder="Выберите раздел"
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="prices-page__search-wrap">
                  <label className="prices-page__label" htmlFor="product-search">
                    Поиск
                  </label>
                  <Input.Search
                    id="product-search"
                    allowClear
                    placeholder="Поиск по наименованию"
                    className="prices-page__search"
                    defaultValue={filters?.search}
                    disabled={activeSectionId == null}
                    onSearch={value =>
                      setFilters({
                        search: value.trim() || undefined,
                        sectionId: activeSectionId,
                      })
                    }
                  />
                </div>
                <div className="prices-page__toolbar-actions">
                  <Button
                    type="primary"
                    icon={<BiPlus size={18} />}
                    className="prices-page__add"
                    onClick={openCreateModal}
                    disabled={activeSectionId == null}
                  >
                    Добавить
                  </Button>
                  <ResetFiltersButton onReset={handleReset} className="prices-page__reset" />
                </div>
              </div>

              {error ? (
                <p className="prices-page__error">
                  Не удалось загрузить товары. Проверьте API и базу данных.
                </p>
              ) : activeSectionId == null ? (
                <p className="prices-page__empty-hint">Выберите раздел, чтобы увидеть товары.</p>
              ) : (
                <ProductsTable
                  items={data?.items ?? []}
                  total={data?.total ?? 0}
                  totalSum={data?.totalSum ?? '0'}
                  loading={isLoading || isFetching}
                  sortBy={sorting?.sortBy}
                  sortOrder={sorting?.sortOrder}
                  deleteLoadingId={deletingId}
                  includeInSumLoadingId={includeInSumLoadingId}
                  onSortChange={(sortBy, sortOrder) =>
                    setSorting({ sortBy: sortBy as 'name' | 'price' | 'id', sortOrder })
                  }
                  onEdit={openEditModal}
                  onDelete={handleDelete}
                  onIncludeInSumChange={handleIncludeInSumChange}
                />
              )}
            </>
          )}
        </section>
      </main>

      {activeSectionId != null && (
        <ProductFormModal
          open={modalOpen}
          formSession={formSession}
          mode={modalMode}
          product={editingProduct}
          sectionId={activeSectionId}
          loading={formLoading}
          onCancel={closeModal}
          onSubmit={handleFormSubmit}
        />
      )}

      <SectionsManageModal open={sectionsModalOpen} onCancel={() => setSectionsModalOpen(false)} />
    </div>
  );
};

export default PricesPage;
