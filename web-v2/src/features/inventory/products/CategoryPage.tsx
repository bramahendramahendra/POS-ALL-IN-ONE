import { Plus } from 'lucide-react'
import { useState } from 'react'

import { ROLES } from '@/shared/constants'
import { PageHeader, RoleGuard } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'

import { CategoryTab } from './components/CategoryTab'

export function CategoryPage() {
  const [openAdd, setOpenAdd] = useState(false)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Kategori Produk"
        breadcrumbs={[{ label: 'Inventori' }, { label: 'Kategori' }]}
        actions={
          <RoleGuard allowedRoles={[ROLES.OWNER, ROLES.ADMIN]}>
            <Button onClick={() => setOpenAdd(true)} className="gap-1">
              <Plus size={16} />
              Tambah Kategori
            </Button>
          </RoleGuard>
        }
      />
      <CategoryTab openAdd={openAdd} onOpenAddChange={setOpenAdd} />
    </div>
  )
}
