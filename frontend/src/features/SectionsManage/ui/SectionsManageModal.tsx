import { useState } from 'react';
import { Button, Input, Modal, Popconfirm, Spin } from 'antd';
import { BiPencil, BiPlus, BiTrash } from 'react-icons/bi';
import {
  useCreateSectionMutation,
  useDeleteSectionMutation,
  useSectionsQuery,
  useUpdateSectionMutation,
} from '../../../shared/api';
import type { Section } from '../../../shared/api';
import './SectionsManageModal.css';

interface SectionsManageModalProps {
  open: boolean;
  onCancel: () => void;
}

const SectionsManageModal = ({ open, onCancel }: SectionsManageModalProps) => {
  const { data: sections = [], isLoading } = useSectionsQuery();
  const createMutation = useCreateSectionMutation();
  const updateMutation = useUpdateSectionMutation();
  const deleteMutation = useDeleteSectionMutation();

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    createMutation.mutate(
      { name },
      {
        onSuccess: () => setNewName(''),
      }
    );
  };

  const startEdit = (section: Section) => {
    setEditingId(section.id);
    setEditingName(section.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const saveEdit = () => {
    if (editingId === null) return;
    const name = editingName.trim();
    if (!name) return;
    updateMutation.mutate(
      { id: editingId, payload: { name } },
      {
        onSuccess: () => cancelEdit(),
      }
    );
  };

  return (
    <Modal
      title="Разделы товаров"
      open={open}
      onCancel={onCancel}
      footer={null}
      centered
      destroyOnHidden
      className="sections-manage-modal"
      classNames={{ wrapper: 'sections-manage-modal-wrap' }}
      width={480}
    >
      <p className="sections-manage-modal__hint">
        Создайте раздел, затем выберите его на главном экране и работайте с товарами внутри него.
      </p>

      <div className="sections-manage-modal__create">
        <Input
          value={newName}
          maxLength={50}
          showCount
          placeholder="Название раздела, например Naruto Kayou"
          onChange={event => setNewName(event.target.value)}
          onPressEnter={handleCreate}
        />
        <Button
          type="primary"
          icon={<BiPlus size={16} />}
          loading={createMutation.isPending}
          disabled={!newName.trim()}
          onClick={handleCreate}
        >
          Создать
        </Button>
      </div>

      <Spin spinning={isLoading}>
        <ul className="sections-manage-modal__list">
          {sections.length === 0 && !isLoading ? (
            <li className="sections-manage-modal__empty">Пока нет разделов</li>
          ) : (
            sections.map(section => {
              const isEditing = editingId === section.id;
              return (
                <li key={section.id} className="sections-manage-modal__item">
                  {isEditing ? (
                    <div className="sections-manage-modal__edit-row">
                      <Input
                        value={editingName}
                        maxLength={50}
                        autoFocus
                        onChange={event => setEditingName(event.target.value)}
                        onPressEnter={saveEdit}
                      />
                      <Button
                        type="primary"
                        size="small"
                        loading={updateMutation.isPending}
                        disabled={!editingName.trim()}
                        onClick={saveEdit}
                      >
                        Сохранить
                      </Button>
                      <Button size="small" onClick={cancelEdit}>
                        Отмена
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="sections-manage-modal__item-main">
                        <span className="sections-manage-modal__item-name">{section.name}</span>
                        <span className="sections-manage-modal__item-count">
                          товаров: {section.productsCount}
                        </span>
                      </div>
                      <div className="sections-manage-modal__item-actions">
                        <button
                          type="button"
                          className="sections-manage-modal__action-btn"
                          title="Переименовать"
                          onClick={() => startEdit(section)}
                        >
                          <BiPencil size={16} />
                        </button>
                        <Popconfirm
                          title="Удалить раздел?"
                          description={
                            section.productsCount > 0
                              ? 'Сначала перенесите или удалите товары из раздела.'
                              : 'Раздел будет удалён без возможности восстановления.'
                          }
                          okText="Удалить"
                          cancelText="Отмена"
                          okButtonProps={{
                            danger: true,
                            disabled: section.productsCount > 0,
                            loading: deleteMutation.isPending,
                          }}
                          onConfirm={() => deleteMutation.mutate(section.id)}
                        >
                          <button
                            type="button"
                            className="sections-manage-modal__action-btn sections-manage-modal__action-btn--danger"
                            title="Удалить"
                            disabled={section.productsCount > 0}
                          >
                            <BiTrash size={16} />
                          </button>
                        </Popconfirm>
                      </div>
                    </>
                  )}
                </li>
              );
            })
          )}
        </ul>
      </Spin>
    </Modal>
  );
};

export default SectionsManageModal;
