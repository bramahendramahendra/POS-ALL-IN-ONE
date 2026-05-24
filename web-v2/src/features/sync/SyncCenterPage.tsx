import { PageHeader } from '@/shared/components'

import { useSyncStatus } from './hooks/useSyncStatus'
import { ConflictList } from './components/ConflictList'
import { SyncHistoryTable } from './components/SyncHistoryTable'
import { SyncStatusCard } from './components/SyncStatusCard'

export function SyncCenterPage() {
  const { hasConflicts, conflictCount } = useSyncStatus()

  return (
    <div className="space-y-4">
      <PageHeader
        title="Sync Center"
        breadcrumbs={[{ label: 'Operasional' }, { label: 'Sync Center' }]}
      />

      <SyncStatusCard />

      {hasConflicts && (
        <section className="space-y-3">
          <h3 className="font-semibold text-gray-700">
            Konflik yang Perlu Diselesaikan
            <span className="ml-2 inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
              {conflictCount}
            </span>
          </h3>
          <ConflictList />
        </section>
      )}

      <section className="space-y-3">
        <h3 className="font-semibold text-gray-700">Riwayat Sinkronisasi</h3>
        <SyncHistoryTable />
      </section>
    </div>
  )
}
