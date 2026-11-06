import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Form, Input, InputNumber, Modal, Switch, Upload } from 'antd';
import { BiCheckCircle, BiImageAdd } from 'react-icons/bi';
import { getProductImageSrc } from '../../../shared/api/products';
import type { Product, ProductPayload } from '../../../shared/api/products';
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface';
import './ProductFormModal.css';

export type ProductFormMode = 'create' | 'edit';

interface ProductFormModalProps {
  open: boolean;
  formSession: number;
  mode: ProductFormMode;
  product?: Product | null;
  sectionId: number;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (payload: ProductPayload) => void;
}

interface ProductFormContentProps {
  mode: ProductFormMode;
  product?: Product | null;
  sectionId: number;
  onSubmit: (payload: ProductPayload) => void;
  onRegisterSubmit: (submit: () => Promise<void>) => void;
}

interface ProductFormValues {
  name: string;
  price: number;
  productUrl: string;
  includeInSum: boolean;
}

const httpsRule = {
  validator: (_: unknown, value: string) => {
    if (!value || value.trim().toLowerCase().startsWith('https://')) {
      return Promise.resolve();
    }
    return Promise.reject(new Error('Ссылка должна начинаться с https://'));
  },
};

const revokeBlobUrl = (url?: string) => {
  if (url?.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

const ProductFormContent = ({
  mode,
  product,
  sectionId,
  onSubmit,
  onRegisterSubmit,
}: ProductFormContentProps) => {
  const [form] = Form.useForm<ProductFormValues>();
  const [newImageFile, setNewImageFile] = useState<File | undefined>();
  const [previewUrl, setPreviewUrl] = useState<string | undefined>();

  useEffect(
    () => () => {
      revokeBlobUrl(previewUrl);
    },
    [previewUrl]
  );

  const clearImageState = useCallback(() => {
    setPreviewUrl(prev => {
      revokeBlobUrl(prev);
      return undefined;
    });
    setNewImageFile(undefined);
  }, []);

  const uploadFileList: UploadFile[] = useMemo(() => {
    if (newImageFile && previewUrl) {
      return [
        {
          uid: 'new-image',
          name: newImageFile.name,
          status: 'done',
          url: previewUrl,
          thumbUrl: previewUrl,
        },
      ];
    }
    if (mode === 'edit' && product?.hasImage && !newImageFile) {
      const existingSrc = getProductImageSrc(product);
      if (existingSrc) {
        return [
          {
            uid: String(product.id),
            name: 'Текущее изображение',
            status: 'done',
            url: existingSrc,
            thumbUrl: existingSrc,
          },
        ];
      }
    }
    return [];
  }, [newImageFile, previewUrl, mode, product]);

  const handleUploadChange = (info: UploadChangeParam<UploadFile>) => {
    const latest = info.fileList.slice(-1);

    if (latest.length === 0) {
      clearImageState();
      return;
    }

    const file = latest[0];
    const origin = file.originFileObj;
    if (!origin) {
      return;
    }

    revokeBlobUrl(previewUrl);
    const objectUrl = URL.createObjectURL(origin);
    setPreviewUrl(objectUrl);
    setNewImageFile(origin);
  };

  const handleRemove = () => {
    clearImageState();
    return true;
  };

  const handleSubmit = useCallback(async () => {
    const values = await form.validateFields();

    onSubmit({
      name: values.name.trim(),
      price: values.price,
      productUrl: values.productUrl.trim(),
      sectionId,
      includeInSum: values.includeInSum,
      imageFile: newImageFile,
    });
  }, [form, newImageFile, onSubmit, sectionId]);

  useEffect(() => {
    onRegisterSubmit(handleSubmit);
  }, [handleSubmit, onRegisterSubmit]);

  const uploadStatusText = useMemo(() => {
    if (newImageFile) {
      return `Загружено: ${newImageFile.name}`;
    }
    if (mode === 'edit' && product?.hasImage && uploadFileList.length > 0) {
      return 'Используется текущее изображение товара';
    }
    return null;
  }, [newImageFile, mode, product?.hasImage, uploadFileList.length]);

  const initialValues =
    mode === 'edit' && product
      ? {
          name: product.name,
          price: Number(product.price),
          productUrl: product.productUrl,
          includeInSum: product.includeInSum,
        }
      : {
          includeInSum: true,
        };

  const imageField = (
    <Form.Item
      label="Изображение"
      help={
        mode === 'edit' ? 'Необязательно: оставьте текущее или загрузите новое' : 'Необязательно'
      }
    >
      <Upload
        accept="image/jpeg,image/png,image/webp,image/gif"
        listType="picture-card"
        maxCount={1}
        fileList={uploadFileList}
        beforeUpload={() => false}
        onChange={handleUploadChange}
        onRemove={handleRemove}
        showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
      >
        {uploadFileList.length === 0 && (
          <div className="product-form-modal__upload-placeholder">
            <BiImageAdd size={24} />
            <span>Загрузить</span>
          </div>
        )}
      </Upload>
      {uploadStatusText && (
        <p
          className={
            newImageFile
              ? 'product-form-modal__upload-status product-form-modal__upload-status--new'
              : 'product-form-modal__upload-status'
          }
        >
          {newImageFile && <BiCheckCircle size={16} aria-hidden />}
          {uploadStatusText}
        </p>
      )}
    </Form.Item>
  );

  return (
    <Form
      form={form}
      layout="vertical"
      className="product-form-modal__form"
      initialValues={initialValues}
    >
      <Form.Item
        label="Наименование"
        name="name"
        rules={[
          { required: true, message: 'Укажите наименование' },
          { max: 20, message: 'Не более 20 символов' },
        ]}
      >
        <Input maxLength={20} showCount autoFocus={mode === 'create'} />
      </Form.Item>
      {imageField}
      <Form.Item label="Цена, ₽" name="price" rules={[{ required: true, message: 'Укажите цену' }]}>
        <InputNumber min={0} precision={2} className="product-form-modal__price" />
      </Form.Item>
      <Form.Item
        label="Ссылка на товар"
        name="productUrl"
        rules={[{ required: true, message: 'Укажите ссылку' }, httpsRule]}
      >
        <Input placeholder="https://..." />
      </Form.Item>
      <Form.Item
        label="Учитывать в сумме"
        name="includeInSum"
        valuePropName="checked"
        extra="Если выключено, цена не войдёт в итоговую сумму раздела"
      >
        <Switch />
      </Form.Item>
    </Form>
  );
};

const ProductFormModal = ({
  open,
  formSession,
  mode,
  product,
  sectionId,
  loading,
  onCancel,
  onSubmit,
}: ProductFormModalProps) => {
  const submitRef = useRef<(() => Promise<void>) | null>(null);

  const registerSubmit = useCallback((submit: () => Promise<void>) => {
    submitRef.current = submit;
  }, []);

  const title = mode === 'create' ? 'Добавить товар' : 'Редактировать товар';

  return (
    <Modal
      title={title}
      open={open}
      centered
      onCancel={onCancel}
      onOk={() => void submitRef.current?.()}
      okText={mode === 'create' ? 'Добавить' : 'Сохранить'}
      cancelText="Отмена"
      confirmLoading={loading}
      destroyOnHidden
      className="product-form-modal"
      classNames={{ wrapper: 'product-form-modal-wrap' }}
      width={480}
    >
      {open ? (
        <ProductFormContent
          key={`${mode}-${formSession}`}
          mode={mode}
          product={product}
          sectionId={sectionId}
          onSubmit={onSubmit}
          onRegisterSubmit={registerSubmit}
        />
      ) : null}
    </Modal>
  );
};

export default ProductFormModal;
