import { PageHeader } from '@/shared/components'

import { CategoryTab } from './components/CategoryTab'

export function CategoryPage() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Kategori Produk"
        breadcrumbs={[{ label: 'Inventori' }, { label: 'Kategori' }]}
      />
      <CategoryTab />
    </div>
  )
}
