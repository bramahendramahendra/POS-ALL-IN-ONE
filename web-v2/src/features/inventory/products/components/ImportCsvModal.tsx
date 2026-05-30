import React, { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'

import { FormModal } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { apiClient } from '@/services/api.client'

import {
  useImportProductsBulkMutation,
  type ImportBulkRow,
  type GrosirImportRow,
} from '../products.api'
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

interface ParsedGrosirRow {
  index: number
  data: GrosirImportRow
  valid: boolean
  errors: string[]
}

function parseRows(rawRows: Record<string, unknown>[]): ParsedRow[] {
  const seenBarcodes = new Set<string>()
  return rawRows.map((raw, i) => {
    const data: ImportBulkRow = {
      no: Number(raw['no'] ?? i + 1),
      nama: String(raw['nama'] ?? '').trim(),
      deskripsi: String(raw['deskripsi'] ?? '').trim(),
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

function parseGrosirRows(rawRows: Record<string, unknown>[], validNos: Set<number>): ParsedGrosirRow[] {
  return rawRows.map((raw, i) => {
    const refBeli = raw['ref_harga_beli'] !== '' ? Number(raw['ref_harga_beli']) : undefined
    const refJual = raw['ref_harga_jual'] !== '' ? Number(raw['ref_harga_jual']) : undefined
    const data: GrosirImportRow = {
      no_produk: Number(raw['no_produk'] ?? 0),
      nama_paket: String(raw['nama_paket'] ?? '').trim(),
      konversi: Number(raw['konversi'] ?? 0),
      harga_beli: Number(raw['harga_beli'] ?? 0),
      harga_jual: Number(raw['harga_jual'] ?? 0),
      ref_harga_beli: !isNaN(refBeli!) ? refBeli : undefined,
      ref_harga_jual: !isNaN(refJual!) ? refJual : undefined,
    }

    const errors: string[] = []
    if (!data.no_produk) errors.push('no_produk kosong')
    else if (!validNos.has(data.no_produk)) errors.push(`no_produk ${data.no_produk} tidak ditemukan di sheet Produk`)
    if (!data.nama_paket) errors.push('Nama paket kosong')
    if (data.konversi <= 0) errors.push('Konversi harus lebih dari 0')
    if (data.harga_jual <= 0) errors.push('Harga jual harus lebih dari 0')

    return { index: i + 2, data, valid: errors.length === 0, errors }
  })
}

function parseXlsx(buffer: ArrayBuffer): { produk: Record<string, unknown>[]; grosir: Record<string, unknown>[] } {
  const wb = XLSX.read(buffer, { type: 'array' })

  const sheetProduk = wb.Sheets['Produk'] ?? wb.Sheets[wb.SheetNames[0]]
  const produk = sheetProduk
    ? XLSX.utils.sheet_to_json<Record<string, unknown>>(sheetProduk, { defval: '' }).filter(
        (raw) => Number(raw['no']) > 0
      )
    : []

  const sheetGrosir = wb.Sheets['Grosir'] ?? wb.Sheets[wb.SheetNames[1]]
  const grosir = sheetGrosir
    ? XLSX.utils.sheet_to_json<Record<string, unknown>>(sheetGrosir, { defval: '' }).filter(
        (raw) => Number(raw['no_produk']) > 0
      )
    : []

  return { produk, grosir }
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

type FilterView = 'all' | 'valid' | 'error'
type ActiveTab = 'produk' | 'grosir'

export function ImportCsvModal({ open, onOpenChange }: ImportCsvModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [grosirRows, setGrosirRows] = useState<ParsedGrosirRow[]>([])
  const [fileName, setFileName] = useState('')
  const [filterView, setFilterView] = useState<FilterView>('all')
  const [activeTab, setActiveTab] = useState<ActiveTab>('produk')
  const { mutate: importBulk, isPending: isImporting } = useImportProductsBulkMutation()

  const validRows = rows.filter((r) => r.valid)
  const invalidRows = rows.filter((r) => !r.valid)
  const validGrosirRows = grosirRows.filter((r) => r.valid)
  const invalidGrosirRows = grosirRows.filter((r) => !r.valid)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setFilterView('all')
    setActiveTab('produk')

    const reader = new FileReader()
    reader.onload = (ev) => {
      const buffer = ev.target?.result as ArrayBuffer
      const { produk, grosir } = parseXlsx(buffer)
      const parsedRows = parseRows(produk)
      setRows(parsedRows)

      const validNos = new Set(parsedRows.map((r) => r.data.no).filter(Boolean))
      setGrosirRows(parseGrosirRows(grosir, validNos))
    }
    reader.readAsArrayBuffer(file)
  }

  const handleImport = () => {
    if (validRows.length === 0) return
    importBulk(
      { rows: validRows.map((r) => r.data), grosir: validGrosirRows.map((r) => r.data) },
      {
        onSuccess: () => {
          onOpenChange(false)
          resetState()
        },
      }
    )
  }

  const resetState = () => {
    setRows([])
    setGrosirRows([])
    setFileName('')
    setFilterView('all')
    setActiveTab('produk')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = (open: boolean) => {
    if (!open && !isImporting) resetState()
    onOpenChange(open)
  }

  const displayRows =
    filterView === 'valid' ? validRows : filterView === 'error' ? invalidRows : rows

  const displayGrosirRows =
    filterView === 'valid' ? validGrosirRows : filterView === 'error' ? invalidGrosirRows : grosirRows

  return (
    <FormModal
      open={open}
      onOpenChange={handleClose}
      title="Import Produk"
      size="lg"
      isLoading={isImporting}
      submitLabel={validRows.length > 0 ? `Import ${validRows.length} Produk Valid` : 'Import'}
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
            Sheet "Produk": no, nama, deskripsi, barcode, kategori, harga_beli, harga_jual, stok, stok_minimum, satuan
          </p>
          <p className="text-xs text-gray-400">
            Sheet "Grosir" (opsional): no_produk, nama_paket, konversi, harga_beli, harga_jual
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Tabs */}
        {rows.length > 0 && (
          <div className="flex border-b text-sm">
            <button
              type="button"
              onClick={() => setActiveTab('produk')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'produk'
                  ? 'border-gray-800 text-gray-800'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Produk
              <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${validRows.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {rows.length}
              </span>
            </button>
            {grosirRows.length > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('grosir')}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'grosir'
                    ? 'border-gray-800 text-gray-800'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Grosir
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${validGrosirRows.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                  {grosirRows.length}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Stats + filter */}
        {rows.length > 0 && (
          <div className="flex items-center gap-3 text-sm flex-wrap">
            {activeTab === 'produk' ? (
              <>
                <span className="text-gray-500">Total: <strong>{rows.length}</strong></span>
                <span className="text-green-600">Valid: <strong>{validRows.length}</strong></span>
                {invalidRows.length > 0 && (
                  <span className="text-red-500">Error: <strong>{invalidRows.length}</strong></span>
                )}
              </>
            ) : (
              <>
                <span className="text-gray-500">Total: <strong>{grosirRows.length}</strong></span>
                <span className="text-green-600">Valid: <strong>{validGrosirRows.length}</strong></span>
                {invalidGrosirRows.length > 0 && (
                  <span className="text-red-500">Error: <strong>{invalidGrosirRows.length}</strong></span>
                )}
              </>
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
                  {f === 'all' ? 'Semua' : f === 'valid' ? 'Valid' : 'Error'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preview table — Produk */}
        {rows.length > 0 && activeTab === 'produk' && (
          <div className="max-h-64 overflow-y-auto rounded-md border text-xs">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  {['No', 'Nama', 'Barcode', 'Kategori', 'H.Beli', 'H.Jual', 'Stok', 'Min', 'Satuan', 'Status'].map((h) => (
                    <th key={h} className="px-2 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => (
                  <React.Fragment key={row.index}>
                    <tr className={row.valid ? 'bg-green-50' : 'bg-red-50'}>
                      <td className="px-2 py-1.5 text-gray-400">{row.data.no || row.index}</td>
                      <td className="px-2 py-1.5 font-medium">{row.data.nama || '—'}</td>
                      <td className="px-2 py-1.5 font-mono">{row.data.barcode || <span className="text-gray-400 italic">auto</span>}</td>
                      <td className="px-2 py-1.5">{row.data.kategori || '—'}</td>
                      <td className="px-2 py-1.5 text-right">{row.data.harga_beli.toLocaleString('id-ID')}</td>
                      <td className="px-2 py-1.5 text-right">{row.data.harga_jual.toLocaleString('id-ID')}</td>
                      <td className="px-2 py-1.5 text-right">{row.data.stok}</td>
                      <td className="px-2 py-1.5 text-right">{row.data.stok_minimum}</td>
                      <td className="px-2 py-1.5">{row.data.satuan || '—'}</td>
                      <td className="px-2 py-1.5">
                        {row.valid ? (
                          <span className="text-green-600 font-medium">✓</span>
                        ) : (
                          <span className="text-red-500">✗</span>
                        )}
                      </td>
                    </tr>
                    {(row.errors.length > 0 || row.warnings.length > 0) && (
                      <tr className={row.errors.length > 0 ? 'bg-red-50' : 'bg-yellow-50'}>
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
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Preview table — Grosir */}
        {grosirRows.length > 0 && activeTab === 'grosir' && (
          <div className="max-h-64 overflow-y-auto rounded-md border text-xs">
            <table className="w-full">
              <thead className="sticky top-0 bg-gray-50">
                <tr>
                  {['#', 'No Produk', 'Nama Paket', 'Konversi', 'H.Beli', 'H.Jual'].map((h) => (
                    <th key={h} className="px-2 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-left font-medium text-gray-400 whitespace-nowrap bg-gray-100">Ref H.Beli</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-400 whitespace-nowrap bg-gray-100">Ref H.Jual</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayGrosirRows.map((row) => (
                  <React.Fragment key={row.index}>
                    <tr className={row.valid ? 'bg-green-50' : 'bg-red-50'}>
                      <td className="px-2 py-1.5 text-gray-400">{row.index}</td>
                      <td className="px-2 py-1.5">{row.data.no_produk || '—'}</td>
                      <td className="px-2 py-1.5 font-medium">{row.data.nama_paket || '—'}</td>
                      <td className="px-2 py-1.5 text-right">{row.data.konversi}</td>
                      <td className="px-2 py-1.5 text-right">{row.data.harga_beli.toLocaleString('id-ID')}</td>
                      <td className="px-2 py-1.5 text-right">{row.data.harga_jual.toLocaleString('id-ID')}</td>
                      <td className="px-2 py-1.5 text-right bg-gray-50 text-gray-400 italic">
                        {row.data.ref_harga_beli != null ? row.data.ref_harga_beli.toLocaleString('id-ID') : '—'}
                      </td>
                      <td className="px-2 py-1.5 text-right bg-gray-50 text-gray-400 italic">
                        {row.data.ref_harga_jual != null ? row.data.ref_harga_jual.toLocaleString('id-ID') : '—'}
                      </td>
                      <td className="px-2 py-1.5">
                        {row.valid ? (
                          <span className="text-green-600 font-medium">✓</span>
                        ) : (
                          <span className="text-red-500">✗</span>
                        )}
                      </td>
                    </tr>
                    {row.errors.length > 0 && (
                      <tr className="bg-red-50">
                        <td colSpan={9} className="px-2 pb-1.5 text-xs">
                          <span className="text-red-600">↳ {row.errors.join(' · ')}</span>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </FormModal>
  )
}
