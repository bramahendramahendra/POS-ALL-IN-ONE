import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Lock, Pencil, Plus, Trash2, Unlock } from 'lucide-react'

import { ConfirmDialog, FormModal } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { RupiahInput } from '@/shared/components/ui/rupiah-input'
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
  useProductPackagesQuery,
  useUnitListQuery,
  useUpdateProductMutation,
  useSaveProductPackagesBulkMutation,
} from '../products.api'
import type { CreateProductPackagePayload, Product } from '../products.types'

const productSchema = z
  .object({
    name: z.string().min(1, 'Nama produk wajib diisi').max(100),
    sku: z.string().min(1, 'SKU wajib digenerate'),
    barcode: z.string().min(1, 'Barcode wajib digenerate'),
    category_id: z.number({ error: 'Kategori wajib dipilih' }).min(1, 'Kategori wajib dipilih'),
    description: z.string().optional(),
    purchase_price: z.number().min(0, 'Harga beli tidak boleh negatif'),
    selling_price: z.number().min(1, 'Harga jual harus lebih dari 0'),
    stock: z.number().min(0, 'Stok tidak boleh negatif'),
    min_stock: z.number().min(0, 'Stok minimum tidak boleh negatif'),
    unit_id: z.number({ error: 'Satuan wajib dipilih' }).min(1, 'Satuan wajib dipilih'),
    is_active: z.boolean(),
  })
  .refine((v) => v.selling_price >= v.purchase_price, {
    message: 'Harga jual tidak boleh lebih rendah dari harga beli',
    path: ['selling_price'],
  })

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId?: number
}

function calcMargin(purchasePrice: number, sellingPrice: number): number {
  if (purchasePrice <= 0 || sellingPrice <= 0) return 0
  return Math.round(((sellingPrice - purchasePrice) / sellingPrice) * 100)
}

function mapProductToForm(product: Product): ProductFormValues {
  return {
    name: product.name,
    sku: product.sku ?? '',
    barcode: product.barcode ?? '',
    category_id: product.category_id ?? 0,
    description: product.description ?? '',
    purchase_price: product.purchase_price,
    selling_price: product.selling_price,
    stock: product.stock,
    min_stock: product.min_stock,
    unit_id: product.unit_id ?? 0,
    is_active: product.is_active,
  }
}

// ─── Grosiran row form ────────────────────────────────────────────────────────

const grosirSchema = z.object({
  unit_id: z.number({ error: 'Satuan wajib dipilih' }).min(1, 'Satuan wajib dipilih'),
  package_name: z.string().optional(),
  conversion_qty: z.number().min(1, 'Konversi harus > 0'),
  purchase_price: z.number().min(0),
  selling_price: z.number().min(1, 'Harga jual harus > 0'),
})
type GrosirFormValues = z.infer<typeof grosirSchema>

function GrosirRowForm({
  baseUnitName,
  basePurchase,
  baseSelling,
  availableUnits,
  initialValues,
  onSave,
  onCancel,
}: {
  baseUnitName: string
  basePurchase: number
  baseSelling: number
  availableUnits: { id: number; name: string; abbreviation: string }[]
  initialValues?: GrosirFormValues
  onSave: (v: GrosirFormValues) => void
  onCancel: () => void
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue: setGrosirValue,
    control: grosirControl,
    formState: { errors },
  } = useForm<GrosirFormValues>({
    resolver: zodResolver(grosirSchema),
    defaultValues: initialValues ?? { unit_id: 0, package_name: '', conversion_qty: 1, purchase_price: 0, selling_price: 0 },
  })

  const convQty = watch('conversion_qty') || 0
  const unitIdVal = watch('unit_id')
  const refPurchase = basePurchase * convQty
  const refSelling = baseSelling * convQty

  return (
    <div className="rounded-md border bg-gray-50 p-3 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Satuan *</Label>
          <Select
            value={unitIdVal > 0 ? String(unitIdVal) : ''}
            onValueChange={(v) => setGrosirValue('unit_id', Number(v))}
          >
            <SelectTrigger className={`h-8 text-sm ${errors.unit_id ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Pilih Satuan" />
            </SelectTrigger>
            <SelectContent>
              {availableUnits.filter((u) => u.id > 0).map((u) => (
                <SelectItem key={u.id} value={String(u.id)}>
                  {u.name} ({u.abbreviation})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.unit_id && <p className="text-xs text-red-500">{errors.unit_id.message}</p>}
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Nama Paket</Label>
          <Input
            {...register('package_name')}
            placeholder="Opsional, misal: 1 Dus, 3 Botol"
            className="h-8 text-sm"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Konversi ke {baseUnitName || 'Satuan Dasar'} *</Label>
        <Input
          type="number"
          min={1}
          {...register('conversion_qty', { valueAsNumber: true })}
          className="h-8 text-sm"
        />
        {convQty > 0 && baseUnitName && (
          <p className="text-xs text-blue-600">1 paket ini = {convQty} {baseUnitName}</p>
        )}
        {errors.conversion_qty && <p className="text-xs text-red-500">{errors.conversion_qty.message}</p>}
      </div>

      {convQty > 0 && (basePurchase > 0 || baseSelling > 0) && (
        <div className="rounded bg-blue-50 border border-blue-100 px-3 py-1.5 text-xs text-blue-700 flex gap-4">
          <span>Ref. Harga Beli: <strong>Rp {refPurchase.toLocaleString('id-ID')}</strong></span>
          <span>Ref. Harga Jual: <strong>Rp {refSelling.toLocaleString('id-ID')}</strong></span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Harga Beli Aktual</Label>
          <Controller
            name="purchase_price"
            control={grosirControl}
            render={({ field }) => (
              <RupiahInput value={field.value} onChange={field.onChange} className="h-8 text-sm" />
            )}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Harga Jual Aktual *</Label>
          <Controller
            name="selling_price"
            control={grosirControl}
            render={({ field }) => (
              <RupiahInput value={field.value} onChange={field.onChange} className="h-8 text-sm" />
            )}
          />
          {errors.selling_price && <p className="text-xs text-red-500">{errors.selling_price.message}</p>}
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Batal</Button>
        <Button type="button" size="sm" onClick={handleSubmit(onSave)}>Simpan Paket</Button>
      </div>
    </div>
  )
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function ProductFormModal({ open, onOpenChange, productId }: ProductFormModalProps) {
  const isEdit = productId !== undefined
  const [generateSkuEnabled, setGenerateSkuEnabled] = useState(false)

  // Grosiran state
  const [grosirRows, setGrosirRows] = useState<CreateProductPackagePayload[]>([])
  const [showGrosirForm, setShowGrosirForm] = useState(false)
  const [editingGrosirIdx, setEditingGrosirIdx] = useState<number | null>(null)

  const [isConfirming, setIsConfirming] = useState(false)
  const [pendingValues, setPendingValues] = useState<ProductFormValues | null>(null)
  const [barcodeLocked, setBarcodeLocked] = useState(true)

  const { data: detailData, isLoading: isLoadingDetail } = useProductDetailQuery(
    isEdit && open ? (productId as number) : 0
  )
  const { data: existingPackages = [] } = useProductPackagesQuery(
    isEdit && open ? (productId as number) : 0
  )
  const { data: categories = [] } = useCategoryListQuery()
  const { data: units = [] } = useUnitListQuery()

  const { mutate: createProduct, isPending: isCreating } = useCreateProductMutation()
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProductMutation()
  const { mutate: savePackages } = useSaveProductPackagesBulkMutation()
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
      unit_id: 0,
      is_active: true,
    },
  })

  const { register, handleSubmit, reset, setValue, watch, control, formState: { errors } } = form

  const categoryIdValue = watch('category_id')
  const unitIdValue = watch('unit_id')
  const purchasePriceValue = watch('purchase_price')
  const sellingPriceValue = watch('selling_price')
  const margin = calcMargin(purchasePriceValue, sellingPriceValue)

  const { data: barcodeData, isFetching: isFetchingBarcode, refetch: refetchBarcode } = useGenerateBarcodeQuery()
  const { data: skuData, isFetching: isFetchingSku } = useGenerateSkuQuery(
    categoryIdValue ?? 0,
    !isEdit && generateSkuEnabled
  )

  useEffect(() => {
    const barcode = barcodeData?.barcode
    if (barcode) setValue('barcode', barcode)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barcodeData])

  useEffect(() => {
    const sku = skuData?.sku
    if (sku && generateSkuEnabled) setValue('sku', sku)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skuData, generateSkuEnabled])

  useEffect(() => {
    if (isEdit && detailData) {
      reset(mapProductToForm(detailData))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailData, isEdit])

  useEffect(() => {
    if (isEdit && existingPackages.length > 0) {
      setGrosirRows(
        existingPackages
          .filter((p) => !p.is_default)
          .map((p) => ({
            unit_id: p.unit_id,
            package_name: p.package_name,
            conversion_qty: p.conversion_qty,
            purchase_price: p.purchase_price,
            selling_price: p.selling_price,
            is_default: false,
          }))
      )
    }
  }, [isEdit, existingPackages])

  useEffect(() => {
    if (!open) {
      reset({
        name: '', sku: '', barcode: '', category_id: undefined, description: '',
        purchase_price: 0, selling_price: 0, stock: 0, min_stock: 5, unit_id: 0, is_active: true,
      })
      setGenerateSkuEnabled(false)
      setGrosirRows([])
      setShowGrosirForm(false)
      setEditingGrosirIdx(null)
      setPendingValues(null)
      setIsConfirming(false)
      setBarcodeLocked(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const onSubmit = (values: ProductFormValues) => {
    setPendingValues(values)
    setIsConfirming(true)
  }

  const handleConfirmedSave = () => {
    if (!pendingValues) return
    const payload = {
      name: pendingValues.name,
      sku: pendingValues.sku,
      barcode: pendingValues.barcode,
      category_id: pendingValues.category_id,
      description: pendingValues.description || undefined,
      purchase_price: pendingValues.purchase_price,
      selling_price: pendingValues.selling_price,
      stock: pendingValues.stock,
      min_stock: pendingValues.min_stock,
      unit_id: pendingValues.unit_id,
      is_active: pendingValues.is_active,
    }

    // Paket default (satuan dasar) selalu dimasukkan sebagai is_default=true
    const allPackages: CreateProductPackagePayload[] = [
      {
        unit_id: pendingValues.unit_id,
        conversion_qty: 1,
        purchase_price: pendingValues.purchase_price,
        selling_price: pendingValues.selling_price,
        is_default: true,
      },
      ...grosirRows,
    ]

    if (isEdit) {
      updateProduct(
        { id: productId, ...payload },
        {
          onSuccess: () => {
            savePackages({ productId: productId as number, packages: allPackages })
            toast.success('Produk berhasil diperbarui')
            setIsConfirming(false)
            onOpenChange(false)
          },
          onError: (error) => toast.error(error.message),
        }
      )
    } else {
      createProduct(payload, {
        onSuccess: (data) => {
          const newId = (data as unknown as { id: number })?.id
          if (newId) {
            savePackages({ productId: newId, packages: allPackages })
          }
          toast.success('Produk berhasil ditambahkan')
          setIsConfirming(false)
          onOpenChange(false)
        },
        onError: (error) => toast.error(error.message),
      })
    }
  }

  const handleAddGrosir = (values: GrosirFormValues) => {
    const row: CreateProductPackagePayload = { ...values, is_default: false }
    if (editingGrosirIdx !== null) {
      setGrosirRows((prev) => prev.map((r, i) => (i === editingGrosirIdx ? row : r)))
      setEditingGrosirIdx(null)
    } else {
      setGrosirRows((prev) => [...prev, row])
    }
    setShowGrosirForm(false)
  }

  const isLoadingContent = isEdit && (isLoadingDetail || !detailData)

  return (
    <>
      <FormModal
        open={open && !isConfirming}
        onOpenChange={(val) => {
          if (isConfirming) return
          onOpenChange(val)
        }}
        title={isEdit ? 'Edit Produk' : 'Tambah Produk'}
        size="lg"
        isLoading={isPending}
        onSubmit={handleSubmit(onSubmit)}
        submitLabel="Simpan"
      >
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

                {/* Kategori + Satuan */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>
                      Kategori <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={categoryIdValue !== undefined ? String(categoryIdValue) : ''}
                      onValueChange={(v) => {
                        setValue('category_id', Number(v))
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
                  <div className="space-y-1.5">
                    <Label>
                      Satuan Dasar <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={unitIdValue > 0 ? String(unitIdValue) : ''}
                      onValueChange={(v) => setValue('unit_id', Number(v))}
                    >
                      <SelectTrigger className={errors.unit_id ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Pilih Satuan" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.filter((u) => u.is_active).map((u) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.name} ({u.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.unit_id && <p className="text-xs text-red-500">{errors.unit_id.message}</p>}
                  </div>
                </div>

                {/* Barcode + SKU */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="barcode">
                      Barcode <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-1.5">
                      <div className="relative flex-1">
                        <Input
                          id="barcode"
                          {...register('barcode')}
                          readOnly={barcodeLocked}
                          placeholder={isEdit ? '' : (barcodeLocked ? 'Klik 🔓 untuk edit manual' : 'Ketik barcode manual')}
                          className={`pr-9 ${barcodeLocked ? 'bg-gray-50 text-gray-700' : ''} ${errors.barcode ? 'border-red-500' : ''}`}
                        />
                        {!isEdit && (
                          <button
                            type="button"
                            onClick={() => setBarcodeLocked((v) => !v)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            title={barcodeLocked ? 'Klik untuk edit manual' : 'Kunci barcode'}
                          >
                            {barcodeLocked ? <Lock size={14} /> : <Unlock size={14} />}
                          </button>
                        )}
                      </div>
                      {!isEdit && barcodeLocked && (
                        <button
                          type="button"
                          disabled={isFetchingBarcode}
                          onClick={() => refetchBarcode()}
                          className="shrink-0 rounded-md border border-gray-300 px-2.5 text-xs text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {isFetchingBarcode ? '...' : 'Generate'}
                        </button>
                      )}
                    </div>
                    {errors.barcode && <p className="text-xs text-red-500">{errors.barcode.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sku">
                      SKU / Kode <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-1.5">
                      <Input
                        id="sku"
                        {...register('sku')}
                        readOnly
                        placeholder={isEdit ? '' : (categoryIdValue ? 'Klik Generate' : 'Pilih kategori dulu')}
                        className={`bg-gray-50 text-gray-700 ${errors.sku ? 'border-red-500' : ''}`}
                      />
                      {!isEdit && (
                        <button
                          type="button"
                          disabled={!categoryIdValue || generateSkuEnabled || isFetchingSku}
                          onClick={() => setGenerateSkuEnabled(true)}
                          className="shrink-0 rounded-md border border-gray-300 px-2.5 text-xs text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {isFetchingSku ? '...' : 'Generate'}
                        </button>
                      )}
                    </div>
                    {errors.sku && <p className="text-xs text-red-500">{errors.sku.message}</p>}
                  </div>
                </div>

                {/* Harga Beli + Harga Jual + Margin */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="purchase_price">Harga Beli</Label>
                    <Controller
                      name="purchase_price"
                      control={control}
                      render={({ field }) => (
                        <RupiahInput
                          id="purchase_price"
                          value={field.value}
                          onChange={field.onChange}
                          className={errors.purchase_price ? 'border-red-500' : ''}
                        />
                      )}
                    />
                    {errors.purchase_price && (
                      <p className="text-xs text-red-500">{errors.purchase_price.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="selling_price">
                      Harga Jual <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name="selling_price"
                      control={control}
                      render={({ field }) => (
                        <RupiahInput
                          id="selling_price"
                          value={field.value}
                          onChange={field.onChange}
                          className={errors.selling_price ? 'border-red-500' : ''}
                        />
                      )}
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
                    <p className="text-xs text-gray-500">
                      Batas stok terendah sebelum muncul peringatan stok hampir habis.
                    </p>
                    {errors.min_stock && (
                      <p className="text-xs text-red-500">{errors.min_stock.message}</p>
                    )}
                  </div>
                </div>


                {/* Grosiran / Satuan Lain */}
                <div className="space-y-2 border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-semibold">Grosiran / Satuan Lain</Label>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Baris Dasar mengikuti harga di atas. Tambahkan paket lain seperti 1 Dus, 3 Botol, dll.
                        </p>
                      </div>
                      {!showGrosirForm && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1 h-7 text-xs"
                          onClick={() => { setEditingGrosirIdx(null); setShowGrosirForm(true) }}
                        >
                          <Plus size={12} /> Tambah Paket
                        </Button>
                      )}
                    </div>

                    {/* Tabel grosiran */}
                    {grosirRows.length > 0 && (
                      <div className="rounded-md border text-xs overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              {['Nama Paket', 'Isi', 'H. Beli', 'H. Jual', ''].map((h) => (
                                <th key={h} className="px-2 py-1.5 text-left font-medium text-gray-600">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {grosirRows.map((row, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="px-2 py-1.5 font-medium">
                                  {units.find((u) => u.id === row.unit_id)?.name ?? '—'}
                                  {row.package_name && <span className="text-gray-400 ml-1">({row.package_name})</span>}
                                </td>
                                <td className="px-2 py-1.5 text-gray-600">
                                  {row.conversion_qty} {units.find((u) => u.id === unitIdValue)?.name || 'satuan dasar'}
                                </td>
                                <td className="px-2 py-1.5">Rp {row.purchase_price.toLocaleString('id-ID')}</td>
                                <td className="px-2 py-1.5">Rp {row.selling_price.toLocaleString('id-ID')}</td>
                                <td className="px-2 py-1.5">
                                  <div className="flex gap-1 justify-end">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-gray-500 hover:text-blue-600"
                                      onClick={() => {
                                        setEditingGrosirIdx(idx)
                                        setShowGrosirForm(true)
                                      }}
                                    >
                                      <Pencil size={12} />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-gray-500 hover:text-red-600"
                                      onClick={() => setGrosirRows((prev) => prev.filter((_, i) => i !== idx))}
                                    >
                                      <Trash2 size={12} />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {showGrosirForm && (
                      <GrosirRowForm
                        baseUnitName={units.find((u) => u.id === unitIdValue)?.name ?? ''}
                        basePurchase={purchasePriceValue}
                        baseSelling={sellingPriceValue}
                        availableUnits={units.filter((u) => u.is_active)}
                        initialValues={
                          editingGrosirIdx !== null
                            ? {
                                unit_id: grosirRows[editingGrosirIdx].unit_id,
                                package_name: grosirRows[editingGrosirIdx].package_name ?? '',
                                conversion_qty: grosirRows[editingGrosirIdx].conversion_qty,
                                purchase_price: grosirRows[editingGrosirIdx].purchase_price,
                                selling_price: grosirRows[editingGrosirIdx].selling_price,
                              }
                            : undefined
                        }
                        onSave={handleAddGrosir}
                        onCancel={() => { setShowGrosirForm(false); setEditingGrosirIdx(null) }}
                      />
                    )}
                  </div>
              </div>
            )}
      </FormModal>

      <ConfirmDialog
        open={isConfirming}
        onOpenChange={(open) => {
          if (!open) {
            setIsConfirming(false)
            setPendingValues(null)
          }
        }}
        title={isEdit ? 'Update Produk' : 'Tambah Produk'}
        description={`Yakin ingin ${isEdit ? 'mengupdate' : 'menambahkan'} produk "${pendingValues?.name}"?`}
        confirmLabel="Ya, Simpan"
        isLoading={isPending}
        onConfirm={handleConfirmedSave}
      />
    </>
  )
}
