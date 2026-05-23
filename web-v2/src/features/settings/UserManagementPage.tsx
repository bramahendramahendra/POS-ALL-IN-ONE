import { PageHeader } from '@/shared/components'

import { UserManagementTab } from './components/UserManagementTab'

export function UserManagementPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Manajemen User"
        breadcrumbs={[{ label: 'Sistem' }, { label: 'Manajemen User' }]}
      />
      <UserManagementTab />
    </div>
  )
}
