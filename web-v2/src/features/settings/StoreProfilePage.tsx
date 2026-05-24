import { PageHeader } from '@/shared/components'

import { StoreProfileForm } from './components/StoreProfileForm'

export function StoreProfilePage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Profil Toko"
        breadcrumbs={[{ label: 'Sistem' }, { label: 'Profil Toko' }]}
      />
      <StoreProfileForm />
    </div>
  )
}
