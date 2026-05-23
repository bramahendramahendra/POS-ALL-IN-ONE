import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'

import { FormModal } from '@/shared/components'

import { useImportProductsCsvMutation } from '../products.api'
import { validateImportRow } from '../products.utils'

interface ImportCsvModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ParsedRow {
  index: number
  data: Record<string, string>
  valid: boolean
  errors: string[]
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseCsv(text: string): ParsedRow[] {
  const lines = text.trim().split('\n')
  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0])
  const rows: ParsedRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    const data: Record<string, string> = {}
    headers.forEach((h, idx) => {
      data[h] = values[idx] ?? ''
    })

    // Validate price
    const rowObj: Record<string, unknown> = { ...data }
    if (data['price'] !== undefined) {
      const priceNum = Number(data['price'])
      rowObj['price'] = isNaN(priceNum) ? data['price'] : priceNum
    }
    if (data['stock'] !== undefined) {
      const stockNum = Number(data['stock'])
      rowObj['stock'] = isNaN(stockNum) ? data['stock'] : stockNum
    }

    const { valid, errors } = validateImportRow(rowObj)
    rows.push({ index: i, data, valid, errors })
  }

  return rows
}

export function ImportCsvModal({ open, onOpenChange }: ImportCsvModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const { mutate: importCsv, isPending: isImporting } = useImportProductsCsvMutation()

  const validRows = rows.filter((r) => r.valid)
  const invalidRows = rows.filter((r) => !r.valid)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      setRows(parseCsv(text))
    }
    reader.readAsText(file)
  }

  const handleImport = () => {
    if (validRows.length === 0) return
    const payload = validRows.map((r) => ({
      name: r.data['name'],
      sku: r.data['sku'] || undefined,
      category_name: r.data['category_name'] || undefined,
      price: r.data['price'] ? Number(r.data['price']) : undefined,
      stock: r.data['stock'] ? Number(r.data['stock']) : undefined,
    }))
    importCsv(payload, {
      onSuccess: () => {
        onOpenChange(false)
        setRows([])
        setFileName('')
        if (fileInputRef.current) fileInputRef.current.value = ''
      },
    })
  }

  const handleClose = (open: boolean) => {
    if (!open && !isImporting) {
      setRows([])
      setFileName('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
    onOpenChange(open)
  }

  return (
    <FormModal
      open={open}
      onOpenChange={handleClose}
      title="Import Produk dari CSV"
      size="lg"
      isLoading={isImporting}
      submitLabel={`Import ${validRows.length} Baris Valid`}
      onSubmit={handleImport}
    >
      <div className="space-y-4">
        {/* Upload area */}
        <div
          className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-200 p-6 cursor-pointer hover:border-gray-300 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload size={24} className="text-gray-400" />
          <p className="text-sm text-gray-500">
            {fileName ? (
              <span className="font-medium text-gray-700">{fileName}</span>
            ) : (
              'Klik untuk pilih file CSV'
            )}
          </p>
          <p className="text-xs text-gray-400">Format: name, sku, category_name, price, stock</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Stats */}
        {rows.length > 0 && (
          <div className="flex gap-3 text-sm">
            <span className="text-gray-500">
              Total: <strong>{rows.length}</strong> baris
            </span>
            <span className="text-green-600">
              Valid: <strong>{validRows.length}</strong>
            </span>
            {invalidRows.length > 0 && (
              <span className="text-red-500">
                Invalid: <strong>{invalidRows.length}</strong>
              </span>
            )}
          </div>
        )}

        {/* Preview table */}
        {rows.length > 0 && (
          <div className="max-h-64 overflow-y-auto rounded-md border text-xs">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">#</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Nama</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">SKU</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Kategori</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Harga</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-600">Stok</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.index} className={row.valid ? 'bg-green-50' : 'bg-red-50'}>
                    <td className="px-3 py-1.5 text-gray-400">{row.index}</td>
                    <td className="px-3 py-1.5 font-medium">{row.data['name'] || '—'}</td>
                    <td className="px-3 py-1.5 font-mono">{row.data['sku'] || '—'}</td>
                    <td className="px-3 py-1.5">{row.data['category_name'] || '—'}</td>
                    <td className="px-3 py-1.5 text-right">{row.data['price'] || '—'}</td>
                    <td className="px-3 py-1.5 text-right">{row.data['stock'] || '—'}</td>
                    <td className="px-3 py-1.5">
                      {row.valid ? (
                        <span className="text-green-600 font-medium">✓ Valid</span>
                      ) : (
                        <span className="text-red-500" title={row.errors.join(', ')}>
                          ✗ {row.errors[0]}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Download template hint */}
        <p className="text-xs text-gray-400">
          Contoh baris:{' '}
          <code className="bg-gray-100 px-1 rounded">Kopi Hitam,KH001,Minuman,5000,100</code>
        </p>
      </div>
    </FormModal>
  )
}
