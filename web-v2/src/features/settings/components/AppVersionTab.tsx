import { useAppVersionListQuery } from '../settings.api'

function formatDate(str: string): string {
  return new Date(str).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const PLATFORM_LABEL: Record<string, string> = {
  web: 'Web',
  desktop: 'Desktop',
  android: 'Android',
}

export function AppVersionTab() {
  const { data: versions, isLoading } = useAppVersionListQuery()
  const list = versions ?? []

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Daftar versi aplikasi yang tersedia. Fitur upload versi baru akan hadir segera.
      </p>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">Belum ada data versi aplikasi</p>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-2.5 text-left">Platform</th>
                <th className="px-4 py-2.5 text-left">Versi</th>
                <th className="px-4 py-2.5 text-left">Tanggal</th>
                <th className="px-4 py-2.5 text-center">Wajib Update</th>
                <th className="px-4 py-2.5 text-left">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {PLATFORM_LABEL[v.platform] ?? v.platform}
                  </td>
                  <td className="px-4 py-3 font-mono text-blue-600">{v.version}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(v.created_at)}</td>
                  <td className="px-4 py-3 text-center">
                    {v.is_mandatory ? (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        Wajib
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Opsional</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={v.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
