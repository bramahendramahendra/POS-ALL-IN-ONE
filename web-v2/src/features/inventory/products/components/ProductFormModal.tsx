import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

import { FormModal } from '@/shared/components'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Label } from '@/shared/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

import {
  useCategoryListQuery,
  useCreateProductMutation,
  useGenerateBarcodeQuery,
  useGenerateSkuQuery,
  useProductDetailQuery,
  useUnitListQuery,
  useUpdateProductMutation,
} from '../products.api'
import type { Product } from '../products.types'
import { PriceTierTab } from './PriceTierTab'

const productSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi').max(100),
  sku: z.string().min(1, 'SKU wajib digenerate'),
  barcode: z.string().min(1, 'Barcode wajib digenerate'),
  category_id: z.number({ required_error: 'Kategori wajib dipilih' }),
  description: z.string().optional(),
  purchase_price: z.number().min(0, 'Harga beli tidak boleh negatif'),
  selling_price: z.number().min(1, 'Harga jual harus lebih dari 0'),
  stock: z.number().min(0, 'Stok tidak boleh negatif'),
  min_stock: z.number().min(0, 'Stok minimum tidak boleh negatif'),
  unit: z.string().min(1, 'Satuan wajib dipilih'),
  is_active: z.boolean(),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId?: number
}

type ModalTab = 'info' | 'prices'

function calcMargin(purchasePrice: number, sellingPrice: number): number {
  if (purchasePrice <= 0 || sellingPrice <= 0) return 0
  return Math.round(((sellingPrice - purchasePrice) / sellingPrice) * 100)
}

function mapProductToForm(product: Product): ProductFormValues {
  return {
    name: product.name,
    sku: product.sku ?? '',
    barcode: product.barcode ?? '',
    category_id: product.category_id ?? undefined,
    description: product.description ?? '',
    purchase_price: product.purchase_price,
    selling_price: product.selling_price,
    stock: product.stock,
    min_stock: product.min_stock,
    unit: product.unit ?? '',
    is_active: product.is_active,
  }
}

export function ProductFormModal({ open, onOpenChange, productId }: ProductFormModalProps) {
  const isEdit = productId !== undefined
  const [activeTab, setActiveTab] = useState<ModalTab>('info')
  const [generateBarcodeEnabled, setGenerateBarcodeEnabled] = useState(false)
  const [generateSkuEnabled, setGenerateSkuEnabled] = useState(false)

  const { data: detailData, isLoading: isLoadingDetail } = useProductDetailQuery(
    isEdit && open ? (productId as number) : 0
  )
  const { data: categories = [] } = useCategoryListQuery()
  const { data: units = [] } = useUnitListQuery()


  const { mutate: createProduct, isPending: isCreating } = useCreateProductMutation()
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProductMutation()
  const isPending = isCreating || isUpdating

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      barcode: '',
      category_id: undefined,
      description: '',
      purchase_price: 0,
      selling_price: 0,
      stock: 0,
      min_stock: 5,
      unit: '',
      is_active: true,
    },
  })

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = form

  const isActiveValue = watch('is_active')
  const categoryIdValue = watch('category_id')
  const unitValue = watch('unit')
  const purchasePriceValue = watch('purchase_price')
  const sellingPriceValue = watch('selling_price')
  const margin = calcMargin(purchasePriceValue, sellingPriceValue)

  const { data: barcodeData, isFetching: isFetchingBarcode } = useGenerateBarcodeQuery(
    !isEdit && generateBarcodeEnabled
  )
  const { data: skuData, isFetching: isFetchingSku } = useGenerateSkuQuery(
    categoryIdValue ?? 0,
    !isEdit && generateSkuEnabled
  )

  // Isi field barcode saat data dari API kembali
  useEffect(() => {
    const barcode = (barcodeData?.data as { barcode?: string })?.barcode
    if (barcode) setValue('barcode', barcode)
  }, [barcodeData, setValue])

  // Isi field SKU saat data dari API kembali
  useEffect(() => {
    const sku = (skuData?.data as { sku?: string })?.sku
    if (sku) setValue('sku', sku)
  }, [skuData, setValue])

  // Reset generate state saat modal ditutup
  // Prefill form on edit
  useEffect(() => {
    if (isEdit && detailData) {
      reset(mapProductToForm(detailData))
    }
  }, [detailData, isEdit, reset])

  // Reset form and tab on close
  useEffect(() => {
    if (!open) {
      reset({
        name: '',
        sku: '',
        barcode: '',
        category_id: undefined,
        description: '',
        purchase_price: 0,
        selling_price: 0,
        stock: 0,
        min_stock: 5,
        unit: '',
        is_active: true,
      })
      setActiveTab('info')
      setGenerateBarcodeEnabled(false)
      setGenerateSkuEnabled(false)
    }
  }, [open, reset])

  const onSubmit = (values: ProductFormValues) => {
    const payload = {
      name: values.name,
      sku: values.sku,
      barcode: values.barcode,
      category_id: values.category_id,
      description: values.description || undefined,
      purchase_price: values.purchase_price,
      selling_price: values.selling_price,
      stock: values.stock,
      min_stock: values.min_stock,
      unit: values.unit,
      is_active: values.is_active,
    }

    if (isEdit) {
      updateProduct(
        { id: productId, ...payload },
        {
          onSuccess: () => {
            toast.success('Produk berhasil diperbarui')
            onOpenChange(false)
          },
          onError: (error) => toast.error(error.message),
        }
      )
    } else {
      createProduct(payload, {
        onSuccess: () => {
          toast.success('Produk berhasil ditambahkan')
          onOpenChange(false)
        },
        onError: (error) => toast.error(error.message),
      })
    }
  }

  const isLoadingContent = isEdit && (isLoadingDetail || !detailData)

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Produk' : 'Tambah Produk'}
      size="lg"
      isLoading={isPending}
      onSubmit={activeTab === 'info' ? handleSubmit(onSubmit) : undefined}
      submitLabel={activeTab === 'info' ? 'Simpan' : undefined}
    >
      {/* Tab bar — only in edit mode */}
      {isEdit && (
        <div className="flex gap-1 border-b -mt-1 mb-4">
          {(['info', 'prices'] as ModalTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-[#2c3e50] text-[#2c3e50]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'info' ? 'Info Dasar' : 'Unit & Harga'}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'info' && (
        <>
          {isLoadingContent ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-md bg-gray-100" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Nama Produk */}
              <div className="space-y-1.5">
                <Label htmlFor="name">
                  Nama Produk <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Nama produk"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>

              {/* Barcode + SKU */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="barcode">
                    Barcode <span className="text-red-500">*</span>
                  </Label>
                  {isEdit ? (
                    <Input id="barcode" {...register('barcode')} readOnly className="bg-gray-50 text-gray-500" />
                  ) : (
                    <div className="flex gap-1.5">
                      <Input
                        id="barcode"
                        {...register('barcode')}
                        readOnly
                        placeholder="Klik Generate"
                        className={`bg-gray-50 text-gray-700 ${errors.barcode ? 'border-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        disabled={generateBarcodeEnabled || isFetchingBarcode}
                        onClick={() => setGenerateBarcodeEnabled(true)}
                        className="shrink-0 rounded-md border border-gray-300 px-2.5 text-xs text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {isFetchingBarcode ? '...' : 'Generate'}
                      </button>
                    </div>
                  )}
                  {errors.barcode && <p className="text-xs text-red-500">{errors.barcode.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sku">
                    SKU / Kode <span className="text-red-500">*</span>
                  </Label>
                  {isEdit ? (
                    <Input id="sku" {...register('sku')} readOnly className="bg-gray-50 text-gray-500" />
                  ) : (
                    <div className="flex gap-1.5">
                      <Input
                        id="sku"
                        {...register('sku')}
                        readOnly
                        placeholder={categoryIdValue ? 'Klik Generate' : 'Pilih kategori dulu'}
                        className={`bg-gray-50 text-gray-700 ${errors.sku ? 'border-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        disabled={!categoryIdValue || generateSkuEnabled || isFetchingSku}
                        onClick={() => setGenerateSkuEnabled(true)}
                        className="shrink-0 rounded-md border border-gray-300 px-2.5 text-xs text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {isFetchingSku ? '...' : 'Generate'}
                      </button>
                    </div>
                  )}
                  {errors.sku && <p className="text-xs text-red-500">{errors.sku.message}</p>}
                </div>
              </div>

              {/* Satuan + Kategori */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>
                    Satuan <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={unitValue || ''}
                    onValueChange={(v) => setValue('unit', v)}
                  >
                    <SelectTrigger className={errors.unit ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Pilih Satuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.filter((u) => u.is_active).map((u) => (
                        <SelectItem key={u.id} value={u.name}>
                          {u.name} ({u.abbreviation})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.unit && <p className="text-xs text-red-500">{errors.unit.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>
                    Kategori <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={categoryIdValue !== undefined ? String(categoryIdValue) : ''}
                    onValueChange={(v) => {
                      setValue('category_id', Number(v))
                      // Reset SKU jika kategori berubah sebelum generate
                      if (!generateSkuEnabled) return
                      setGenerateSkuEnabled(false)
                      setValue('sku', '')
                    }}
                  >
                    <SelectTrigger className={errors.category_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Pilih Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category_id && (
                    <p className="text-xs text-red-500">{errors.category_id.message}</p>
                  )}
                </div>
              </div>

              {/* Harga Beli + Harga Jual + Margin */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="purchase_price">Harga Beli (Rp)</Label>
                  <Input
                    id="purchase_price"
                    type="number"
                    min={0}
                    {...register('purchase_price', { valueAsNumber: true })}
                    className={errors.purchase_price ? 'border-red-500' : ''}
                  />
                  {errors.purchase_price && (
                    <p className="text-xs text-red-500">{errors.purchase_price.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="selling_price">
                    Harga Jual (Rp) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="selling_price"
                    type="number"
                    min={0}
                    {...register('selling_price', { valueAsNumber: true })}
                    className={errors.selling_price ? 'border-red-500' : ''}
                  />
                  {errors.selling_price && (
                    <p className="text-xs text-red-500">{errors.selling_price.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Margin</Label>
                  <div
                    className={`flex h-9 items-center rounded-md border px-3 text-sm font-medium ${
                      margin >= 30
                        ? 'border-green-200 bg-green-50 text-green-700'
                        : margin >= 15
                          ? 'border-amber-200 bg-amber-50 text-amber-700'
                          : margin > 0
                            ? 'border-red-200 bg-red-50 text-red-600'
                            : 'border-gray-200 bg-gray-50 text-gray-400'
                    }`}
                  >
                    {margin}%
                  </div>
                </div>
              </div>

              {/* Stok + Stok Minimum */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="stock">Stok</Label>
                  <Input
                    id="stock"
                    type="number"
                    min={0}
                    {...register('stock', { valueAsNumber: true })}
                    className={errors.stock ? 'border-red-500' : ''}
                  />
                  {errors.stock && <p className="text-xs text-red-500">{errors.stock.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="min_stock">Stok Minimum</Label>
                  <Input
                    id="min_stock"
                    type="number"
                    min={0}
                    {...register('min_stock', { valueAsNumber: true })}
                    className={errors.min_stock ? 'border-red-500' : ''}
                  />
                  {errors.min_stock && (
                    <p className="text-xs text-red-500">{errors.min_stock.message}</p>
                  )}
                </div>
              </div>

              {/* Deskripsi */}
              <div className="space-y-1.5">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Deskripsi produk (opsional)"
                  className="resize-none"
                  rows={2}
                />
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <Label>Status</Label>
                <RadioGroup
                  value={isActiveValue ? 'active' : 'inactive'}
                  onValueChange={(v) => setValue('is_active', v === 'active')}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="active" id="status-active" />
                    <Label htmlFor="status-active" className="cursor-pointer font-normal">
                      Aktif
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="inactive" id="status-inactive" />
                    <Label htmlFor="status-inactive" className="cursor-pointer font-normal">
                      Nonaktif
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'prices' && isEdit && <PriceTierTab productId={productId as number} />}
    </FormModal>
  )
}
