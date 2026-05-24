import { Plus } from 'lucide-react'
import { useState } from 'react'

import { ROLES } from '@/shared/constants'
import { PageHeader, RoleGuard } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'

import { UnitTab } from './components/UnitTab'

export function UnitPage() {
  const [openAdd, setOpenAdd] = useState(false)

  return (
    <div className="space-y-4">
      <PageHeader
        title="Satuan Produk"
        breadcrumbs={[{ label: 'Inventori' }, { label: 'Satuan' }]}
        actions={
          <RoleGuard allowedRoles={[ROLES.OWNER, ROLES.ADMIN]}>
            <Button onClick={() => setOpenAdd(true)} className="gap-1">
              <Plus size={16} />
              Tambah Satuan
            </Button>
          </RoleGuard>
        }
      />
      <UnitTab openAdd={openAdd} onOpenAddChange={setOpenAdd} />
    </div>
  )
}
