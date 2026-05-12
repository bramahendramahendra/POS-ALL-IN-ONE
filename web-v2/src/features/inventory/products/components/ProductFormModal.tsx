import { useEffect } from 'react'
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
  useProductDetailQuery,
  useUpdateProductMutation,
} from '../products.api'
import type { Product } from '../products.types'

const productSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi').max(100),
  sku: z.string().optional(),
  category_id: z.number().optional(),
  description: z.string().optional(),
  is_active: z.boolean(),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId?: number
}

function mapProductToForm(product: Product): ProductFormValues {
  return {
    name: product.name,
    sku: product.sku ?? '',
    category_id: product.category_id ?? undefined,
    description: product.description ?? '',
    is_active: product.is_active,
  }
}

export function ProductFormModal({ open, onOpenChange, productId }: ProductFormModalProps) {
  const isEdit = productId !== undefined

  const { data: detailData, isLoading: isLoadingDetail } = useProductDetailQuery(
    isEdit && open ? (productId as number) : 0
  )
  const { data: categories = [] } = useCategoryListQuery()

  const { mutate: createProduct, isPending: isCreating } = useCreateProductMutation()
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProductMutation()
  const isPending = isCreating || isUpdating

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      category_id: undefined,
      description: '',
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

  // Prefill form on edit
  useEffect(() => {
    if (isEdit && detailData) {
      reset(mapProductToForm(detailData))
    }
  }, [detailData, isEdit, reset])

  // Reset form on close
  useEffect(() => {
    if (!open) {
      reset({
        name: '',
        sku: '',
        category_id: undefined,
        description: '',
        is_active: true,
      })
    }
  }, [open, reset])

  const onSubmit = (values: ProductFormValues) => {
    const payload = {
      name: values.name,
      sku: values.sku || undefined,
      category_id: values.category_id,
      description: values.description || undefined,
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

  const isLoadingContent = isEdit && isLoadingDetail

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Produk' : 'Tambah Produk'}
      size="md"
      isLoading={isPending}
      onSubmit={handleSubmit(onSubmit)}
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
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* SKU + Kategori */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sku">SKU / Kode</Label>
              <Input
                id="sku"
                {...register('sku')}
                placeholder="Generate otomatis jika kosong"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select
                value={categoryIdValue !== undefined ? String(categoryIdValue) : 'none'}
                onValueChange={(v) =>
                  setValue('category_id', v === 'none' ? undefined : Number(v))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tanpa Kategori</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              rows={3}
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
    </FormModal>
  )
}
