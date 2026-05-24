import { PageHeader } from '@/shared/components'

import { AppVersionTab } from './components/AppVersionTab'

export function AppVersionPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Versi Aplikasi"
        breadcrumbs={[{ label: 'Sistem' }, { label: 'Versi Aplikasi' }]}
      />
      <AppVersionTab />
    </div>
  )
}
