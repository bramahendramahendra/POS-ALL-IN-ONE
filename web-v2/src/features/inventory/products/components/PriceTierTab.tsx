import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { ROLES } from '@/shared/constants'
import { ConfirmDialog, DataTable, FormModal, RoleGuard } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { useDisclosure } from '@/shared/hooks'
import { formatRupiah } from '@/shared/utils'
import type { ColumnDef } from '@/shared/components/DataTable/DataTable.types'

import {
  useAddPriceTierMutation,
  useDeletePriceTierMutation,
  useProductPackagesQuery,
  useProductPricesQuery,
  useUnitListQuery,
  useUpdatePriceTierMutation,
} from '../products.api'
import type { PriceTier, ProductPackage } from '../products.types'

// ─── Price Tier Form ──────────────────────────────────────────────────────────

const priceTierSchema = z.object({
  unit_id: z.number({ error: 'Satuan wajib dipilih' }),
  tier_name: z.string().min(1, 'Nama tier wajib diisi'),
  min_qty: z.number().min(1, 'Minimal qty harus > 0'),
  price: z.number().min(0, 'Harga tidak boleh negatif'),
})
type PriceTierFormValues = z.infer<typeof priceTierSchema>

// ─── Component ────────────────────────────────────────────────────────────────

interface PriceTierTabProps {
  productId: number
}

export function PriceTierTab({ productId }: PriceTierTabProps) {
  const { data: units = [] } = useUnitListQuery()
  const { data: productPackages = [], isLoading: isLoadingPackages } = useProductPackagesQuery(productId)
  const { data: priceTiers = [], isLoading: isLoadingPrices } = useProductPricesQuery(productId)

  // ── Price Tier CRUD state ──
  const { isOpen: priceFormOpen, open: openPriceForm, close: closePriceForm } = useDisclosure()
  const { isOpen: priceDeleteOpen, open: openPriceDelete, close: closePriceDelete } = useDisclosure()
  const { isOpen: priceConfirmOpen, open: openPriceConfirm, close: closePriceConfirm } = useDisclosure()
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null)
  const [deletingPriceId, setDeletingPriceId] = useState<number | null>(null)
  const [pendingPriceValues, setPendingPriceValues] = useState<PriceTierFormValues | null>(null)

  const { mutate: addPriceTier, isPending: isAddingPrice } = useAddPriceTierMutation(productId)
  const { mutate: updatePriceTier, isPending: isUpdatingPrice } = useUpdatePriceTierMutation(productId)
  const { mutate: deletePriceTier, isPending: isDeletingPrice } = useDeletePriceTierMutation(productId)

  const priceForm = useForm<PriceTierFormValues>({
    resolver: zodResolver(priceTierSchema),
    defaultValues: { unit_id: 0, tier_name: '', min_qty: 1, price: 0 },
  })

  const handleOpenAddPrice = () => {
    setEditingPriceId(null)
    priceForm.reset({ unit_id: 0, tier_name: '', min_qty: 1, price: 0 })
    openPriceForm()
  }

  const handleOpenEditPrice = (pt: PriceTier) => {
    setEditingPriceId(pt.id)
    priceForm.reset({ unit_id: pt.unit_id, tier_name: pt.tier_name, min_qty: pt.min_qty, price: pt.price })
    openPriceForm()
  }

  const handleClosePriceForm = () => {
    closePriceForm()
    setEditingPriceId(null)
    priceForm.reset({ unit_id: 0, tier_name: '', min_qty: 1, price: 0 })
  }

  const onSubmitPrice = (values: PriceTierFormValues) => {
    setPendingPriceValues(values)
    closePriceForm()
    openPriceConfirm()
  }

  const handlePriceConfirmCancel = () => {
    closePriceConfirm()
    if (pendingPriceValues) {
      priceForm.reset(pendingPriceValues)
      openPriceForm()
    }
    setPendingPriceValues(null)
  }

  const handleConfirmSavePrice = () => {
    if (!pendingPriceValues) return
    const values = pendingPriceValues
    if (editingPriceId !== null) {
      updatePriceTier(
        { priceId: editingPriceId, ...values },
        {
          onSuccess: () => {
            toast.success('Harga tier berhasil diperbarui')
            closePriceConfirm()
            setEditingPriceId(null)
            priceForm.reset({ unit_id: 0, tier_name: '', min_qty: 1, price: 0 })
          },
          onError: (e) => toast.error(e.message),
        }
      )
    } else {
      addPriceTier(values, {
        onSuccess: () => {
          toast.success('Harga tier berhasil ditambahkan')
          closePriceConfirm()
          priceForm.reset({ unit_id: 0, tier_name: '', min_qty: 1, price: 0 })
        },
        onError: (e) => toast.error(e.message),
      })
    }
  }

  const handleDeletePrice = () => {
    if (deletingPriceId === null) return
    deletePriceTier(deletingPriceId, {
      onSuccess: () => {
        toast.success('Harga tier berhasil dihapus')
        closePriceDelete()
        setDeletingPriceId(null)
      },
      onError: (e) => toast.error(e.message),
    })
  }

  const packageColumns: ColumnDef<ProductPackage>[] = [
    {
      key: 'unit_name',
      header: 'Satuan',
      cell: (row) => <span className="font-medium">{row.unit_name}</span>,
    },
    {
      key: 'package_name',
      header: 'Nama Paket',
      cell: (row) => row.package_name
        ? <span className="text-gray-600">{row.package_name}</span>
        : <span className="text-gray-400 text-sm">—</span>,
    },
    {
      key: 'conversion_qty',
      header: 'Konversi',
      align: 'right',
      cell: (row) => <span>{row.conversion_qty}×</span>,
    },
    {
      key: 'purchase_price',
      header: 'H. Beli',
      align: 'right',
      cell: (row) => <span>{formatRupiah(row.purchase_price)}</span>,
    },
    {
      key: 'selling_price',
      header: 'H. Jual',
      align: 'right',
      cell: (row) => <span className="font-medium">{formatRupiah(row.selling_price)}</span>,
    },
    {
      key: 'is_default',
      header: 'Default',
      align: 'center',
      cell: (row) => row.is_default ? <span className="text-green-600 text-base">✓</span> : null,
    },
  ]

  const priceTierColumns: ColumnDef<PriceTier>[] = [
    {
      key: 'tier_name',
      header: 'Tier',
      cell: (row) => <span className="font-medium">{row.tier_name}</span>,
    },
    {
      key: 'unit_name',
      header: 'Satuan',
      cell: (row) => <span>{row.unit_name}</span>,
    },
    {
      key: 'min_qty',
      header: 'Min Qty',
      align: 'right',
      cell: (row) => <span>{row.min_qty}</span>,
    },
    {
      key: 'price',
      header: 'Harga',
      align: 'right',
      cell: (row) => <span className="font-medium">{formatRupiah(row.price)}</span>,
    },
    {
      key: 'actions',
      header: 'Aksi',
      align: 'center',
      width: '90px',
      cell: (row) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-500 hover:text-blue-600"
            onClick={() => handleOpenEditPrice(row)}
            title="Edit"
          >
            <Pencil size={14} />
          </Button>
          <RoleGuard allowedRoles={[ROLES.OWNER]}>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-gray-500 hover:text-red-600"
              onClick={() => {
                setDeletingPriceId(row.id)
                openPriceDelete()
              }}
              title="Hapus"
            >
              <Trash2 size={14} />
            </Button>
          </RoleGuard>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* ── Paket Satuan ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700">Paket Satuan</h4>
          <p className="text-xs text-gray-400">Kelola paket di form edit produk</p>
        </div>
        <DataTable<ProductPackage & Record<string, unknown>>
          columns={packageColumns}
          data={productPackages as (ProductPackage & Record<string, unknown>)[]}
          isLoading={isLoadingPackages}
          emptyMessage="Belum ada paket satuan"
          emptyDescription="Tambah paket satuan melalui form edit produk."
        />
      </div>

      {/* ── Price Tiers ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700">Harga Tier</h4>
          <RoleGuard allowedRoles={[ROLES.OWNER, ROLES.ADMIN]}>
            <Button size="sm" variant="outline" onClick={handleOpenAddPrice} className="gap-1 h-7 text-xs">
              <Plus size={12} /> Tambah Harga
            </Button>
          </RoleGuard>
        </div>
        <DataTable<PriceTier & Record<string, unknown>>
          columns={priceTierColumns}
          data={priceTiers as (PriceTier & Record<string, unknown>)[]}
          isLoading={isLoadingPrices}
          emptyMessage="Belum ada harga tier"
          emptyDescription="Tambah harga tier untuk menentukan harga berdasarkan jumlah pembelian."
        />
      </div>

      {/* ── Price Tier Form Modal ── */}
      <FormModal
        open={priceFormOpen}
        onOpenChange={(open) => {
          if (!open && pendingPriceValues !== null) return
          if (!open) handleClosePriceForm()
        }}
        title={editingPriceId !== null ? 'Edit Harga Tier' : 'Tambah Harga Tier'}
        size="sm"
        isLoading={isAddingPrice || isUpdatingPrice}
        onSubmit={priceForm.handleSubmit(onSubmitPrice)}
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>
              Satuan <span className="text-red-500">*</span>
            </Label>
            <Select
              value={priceForm.watch('unit_id') > 0 ? String(priceForm.watch('unit_id')) : ''}
              onValueChange={(v) => priceForm.setValue('unit_id', Number(v))}
            >
              <SelectTrigger className={priceForm.formState.errors.unit_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Pilih satuan" />
              </SelectTrigger>
              <SelectContent>
                {units.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {priceForm.formState.errors.unit_id && (
              <p className="text-xs text-red-500">{priceForm.formState.errors.unit_id.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pt-tier">
              Nama Tier <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pt-tier"
              {...priceForm.register('tier_name')}
              placeholder="Contoh: Retail, Grosir, Member"
              className={priceForm.formState.errors.tier_name ? 'border-red-500' : ''}
            />
            {priceForm.formState.errors.tier_name && (
              <p className="text-xs text-red-500">{priceForm.formState.errors.tier_name.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="pt-qty">
                Min Qty <span className="text-red-500">*</span>
              </Label>
              <Input
                id="pt-qty"
                type="number"
                min={1}
                {...priceForm.register('min_qty', { valueAsNumber: true })}
                className={priceForm.formState.errors.min_qty ? 'border-red-500' : ''}
              />
              {priceForm.formState.errors.min_qty && (
                <p className="text-xs text-red-500">{priceForm.formState.errors.min_qty.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pt-price">
                Harga (Rp) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="pt-price"
                type="number"
                min={0}
                {...priceForm.register('price', { valueAsNumber: true })}
                className={priceForm.formState.errors.price ? 'border-red-500' : ''}
              />
              {priceForm.formState.errors.price && (
                <p className="text-xs text-red-500">{priceForm.formState.errors.price.message}</p>
              )}
            </div>
          </div>
        </div>
      </FormModal>

      <ConfirmDialog
        open={priceConfirmOpen}
        onOpenChange={(open) => {
          if (!open) handlePriceConfirmCancel()
        }}
        title={editingPriceId !== null ? 'Update Harga Tier' : 'Tambah Harga Tier'}
        description={`Yakin ingin ${editingPriceId !== null ? 'mengupdate' : 'menambahkan'} harga tier ini?`}
        confirmLabel="Ya, Simpan"
        isLoading={isAddingPrice || isUpdatingPrice}
        onConfirm={handleConfirmSavePrice}
      />

      <ConfirmDialog
        open={priceDeleteOpen}
        onOpenChange={(open) => {
          if (!open) {
            closePriceDelete()
            setDeletingPriceId(null)
          }
        }}
        title="Hapus Harga Tier"
        description="Harga tier yang dihapus tidak bisa dikembalikan."
        confirmLabel="Ya, Hapus"
        variant="destructive"
        isLoading={isDeletingPrice}
        onConfirm={handleDeletePrice}
      />
    </div>
  )
}
