import { PageHeader } from '@/shared/components'

import { AppVersionTab } from './components/AppVersionTab'

export function AppVersionPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Versi Aplikasi"
        breadcrumbs={[{ label: 'Sistem' }, { label: 'Versi Aplikasi' }]}
      />
      <AppVersionTab />
    </div>
  )
}
