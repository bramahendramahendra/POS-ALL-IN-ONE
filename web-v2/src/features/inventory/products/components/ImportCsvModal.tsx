import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'

import { FormModal } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { apiClient } from '@/services/api.client'

import { useImportProductsBulkMutation, type ImportBulkRow } from '../products.api'
import { validateImportRow } from '../products.utils'

interface ImportCsvModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ParsedRow {
  index: number
  data: ImportBulkRow
  valid: boolean
  errors: string[]
  warnings: string[]
}

function parseRows(rawRows: Record<string, unknown>[]): ParsedRow[] {
  const seenBarcodes = new Set<string>()
  return rawRows.map((raw, i) => {
    const data: ImportBulkRow = {
      nama: String(raw['nama'] ?? '').trim(),
      barcode: String(raw['barcode'] ?? '').trim(),
      kategori: String(raw['kategori'] ?? '').trim(),
      harga_beli: Number(raw['harga_beli'] ?? 0),
      harga_jual: Number(raw['harga_jual'] ?? 0),
      stok: Number(raw['stok'] ?? 0),
      stok_minimum: Number(raw['stok_minimum'] ?? 0),
      satuan: String(raw['satuan'] ?? '').trim(),
    }

    const { valid, errors, warnings } = validateImportRow(data)

    if (data.barcode) {
      const key = data.barcode.toLowerCase()
      if (seenBarcodes.has(key)) {
        errors.push(`Barcode "${data.barcode}" duplikat dalam file`)
      } else {
        seenBarcodes.add(key)
      }
    }

    return { index: i + 2, data, valid: valid && errors.length === 0, errors, warnings }
  })
}

function parseXlsx(buffer: ArrayBuffer): Record<string, unknown>[] {
  const wb = XLSX.read(buffer, { type: 'array' })
  const ws = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' })
}

async function downloadTemplate() {
  try {
    const response = await apiClient.get('/products/import-template', {
      responseType: 'blob',
    })
    const url = URL.createObjectURL(response.data as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_import_produk.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    toast.error('Gagal mengunduh template')
  }
}

export function ImportCsvModal({ open, onOpenChange }: ImportCsvModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState('')
  const [filterView, setFilterView] = useState<'all' | 'valid' | 'error'>('all')
  const { mutate: importBulk, isPending: isImporting } = useImportProductsBulkMutation()

  const validRows = rows.filter((r) => r.valid)
  const invalidRows = rows.filter((r) => !r.valid)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setFilterView('all')

    const reader = new FileReader()
    reader.onload = (ev) => {
      const buffer = ev.target?.result as ArrayBuffer
      setRows(parseRows(parseXlsx(buffer)))
    }
    reader.readAsArrayBuffer(file)
  }

  const handleImport = () => {
    if (validRows.length === 0) return
    importBulk(validRows.map((r) => r.data), {
      onSuccess: () => {
        onOpenChange(false)
        resetState()
      },
    })
  }

  const resetState = () => {
    setRows([])
    setFileName('')
    setFilterView('all')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = (open: boolean) => {
    if (!open && !isImporting) resetState()
    onOpenChange(open)
  }

  const displayRows =
    filterView === 'valid' ? validRows : filterView === 'error' ? invalidRows : rows

  return (
    <FormModal
      open={open}
      onOpenChange={handleClose}
      title="Import Produk"
      size="lg"
      isLoading={isImporting}
      submitLabel={validRows.length > 0 ? `Import ${validRows.length} Baris Valid` : 'Import'}
      onSubmit={handleImport}
    >
      <div className="space-y-4">
        {/* Template download */}
        <div className="flex items-center gap-2 rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-600">
          <span>Download template:</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1 h-7 text-xs"
            onClick={downloadTemplate}
          >
            <Download size={12} /> Excel (.xlsx)
          </Button>
        </div>

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
              'Klik untuk pilih file Excel (.xlsx)'
            )}
          </p>
          <p className="text-xs text-gray-400">
            Kolom: nama, barcode, kategori, harga_beli, harga_jual, stok, stok_minimum, satuan
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Stats + filter */}
        {rows.length > 0 && (
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <span className="text-gray-500">Total: <strong>{rows.length}</strong></span>
            <span className="text-green-600">Valid: <strong>{validRows.length}</strong></span>
            {invalidRows.length > 0 && (
              <span className="text-red-500">Error: <strong>{invalidRows.length}</strong></span>
            )}
            <div className="ml-auto flex gap-1">
              {(['all', 'valid', 'error'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilterView(f)}
                  className={`rounded px-2 py-0.5 text-xs border ${
                    filterView === f
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {f === 'all' ? 'Semua' : f === 'valid' ? 'Valid saja' : 'Error saja'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preview table */}
        {rows.length > 0 && (
          <div className="max-h-64 overflow-y-auto rounded-md border text-xs">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  {['#', 'Nama', 'Barcode', 'Kategori', 'H.Beli', 'H.Jual', 'Stok', 'Min', 'Satuan', 'Status'].map((h) => (
                    <th key={h} className="px-2 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => (
                  <>
                    <tr key={row.index} className={row.valid ? 'bg-green-50' : 'bg-red-50'}>
                      <td className="px-2 py-1.5 text-gray-400">{row.index}</td>
                      <td className="px-2 py-1.5 font-medium">{row.data.nama || '—'}</td>
                      <td className="px-2 py-1.5 font-mono">{row.data.barcode || '—'}</td>
                      <td className="px-2 py-1.5">{row.data.kategori || '—'}</td>
                      <td className="px-2 py-1.5 text-right">{row.data.harga_beli.toLocaleString('id-ID')}</td>
                      <td className="px-2 py-1.5 text-right">{row.data.harga_jual.toLocaleString('id-ID')}</td>
                      <td className="px-2 py-1.5 text-right">{row.data.stok}</td>
                      <td className="px-2 py-1.5 text-right">{row.data.stok_minimum}</td>
                      <td className="px-2 py-1.5">{row.data.satuan || '—'}</td>
                      <td className="px-2 py-1.5">
                        {row.valid ? (
                          <span className="text-green-600 font-medium">✓ Valid</span>
                        ) : (
                          <span className="text-red-500">✗ Error</span>
                        )}
                      </td>
                    </tr>
                    {(row.errors.length > 0 || row.warnings.length > 0) && (
                      <tr key={`${row.index}-detail`} className={row.errors.length > 0 ? 'bg-red-50' : 'bg-yellow-50'}>
                        <td colSpan={10} className="px-2 pb-1.5 text-xs">
                          {row.errors.length > 0 && (
                            <span className="text-red-600">↳ {row.errors.join(' · ')}</span>
                          )}
                          {row.warnings.length > 0 && (
                            <span className="text-amber-600">{row.errors.length > 0 ? '  ' : '↳ '}{row.warnings.join(' · ')}</span>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </FormModal>
  )
}
