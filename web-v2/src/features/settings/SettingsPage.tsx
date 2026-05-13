import { useState } from 'react'

import { PageHeader } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'

import { AppVersionTab } from './components/AppVersionTab'
import { StoreProfileForm } from './components/StoreProfileForm'
import { UserManagementTab } from './components/UserManagementTab'

type Tab = 'store' | 'users' | 'versions'

const TABS: { label: string; value: Tab }[] = [
  { label: 'Profil Toko', value: 'store' },
  { label: 'Manajemen User', value: 'users' },
  { label: 'Versi Aplikasi', value: 'versions' },
]

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('store')

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Pengaturan" breadcrumbs={[{ label: 'Settings' }]} />

      {/* Tab bar */}
      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <Button
            key={t.value}
            variant="ghost"
            size="sm"
            className={`rounded-b-none border-b-2 transition-none ${
              activeTab === t.value
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab(t.value)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'store' && <StoreProfileForm />}
        {activeTab === 'users' && <UserManagementTab />}
        {activeTab === 'versions' && <AppVersionTab />}
      </div>
    </div>
  )
}
