import { PageHeader } from '@/shared/components'

import { UserManagementTab } from './components/UserManagementTab'

export function UserManagementPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Manajemen User"
        breadcrumbs={[{ label: 'Sistem' }, { label: 'Manajemen User' }]}
      />
      <UserManagementTab />
    </div>
  )
}
