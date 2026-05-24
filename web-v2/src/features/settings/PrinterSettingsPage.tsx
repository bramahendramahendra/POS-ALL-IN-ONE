import { PageHeader } from '@/shared/components'

import { PrinterSettingsTab } from './components/PrinterSettingsTab'

export function PrinterSettingsPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Pengaturan Printer"
        breadcrumbs={[{ label: 'Sistem' }, { label: 'Printer' }]}
      />
      <PrinterSettingsTab />
    </div>
  )
}
