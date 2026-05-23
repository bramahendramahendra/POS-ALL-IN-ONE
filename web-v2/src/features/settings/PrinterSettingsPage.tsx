import { PageHeader } from '@/shared/components'

import { PrinterSettingsTab } from './components/PrinterSettingsTab'

export function PrinterSettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Pengaturan Printer"
        breadcrumbs={[{ label: 'Sistem' }, { label: 'Printer' }]}
      />
      <PrinterSettingsTab />
    </div>
  )
}
