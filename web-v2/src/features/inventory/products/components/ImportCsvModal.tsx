import React, { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'

import { FormModal } from '@/shared/components'
import { Button } from '@/shared/components/ui/button'
import { apiClient } from '@/services/api.client'

import {
  useImportPreviewMutation,
  useImportProductsBulkMutation,
  type ImportPreviewRow,
  type ImportPreviewGrosirRow,
} from '../products.api'

interface ImportCsvModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FilterView = 'all' | 'valid' | 'error'
type ActiveTab = 'produk' | 'grosir'

async function downloadTemplate() {
  const response = await apiClient.get('/products/import-template', { responseType: 'blob' })
  const url = URL.createObjectURL(response.data as Blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'template_import_produk.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}

export function ImportCsvModal({ open, onOpenChange }: ImportCsvModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ImportPreviewRow[]>([])
  const [grosirRows, setGrosirRows] = useState<ImportPreviewGrosirRow[]>([])
  const [fileName, setFileName] = useState('')
  const [filterView, setFilterView] = useState<FilterView>('all')
  const [activeTab, setActiveTab] = useState<ActiveTab>('produk')

  const { mutate: fetchPreview, isPending: isLoadingPreview } = useImportPreviewMutation()
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
    setRows([])
    setGrosirRows([])

    fetchPreview(file, {
      onSuccess: (data) => {
        setRows(data.rows ?? [])
        setGrosirRows(data.grosir ?? [])
      },
    })
  }

  const handleImport = () => {
    if (validRows.length === 0) return
    importBulk(
      {
        rows: validRows.map(({ no, nama, barcode, kategori, harga_beli, harga_jual, stok, stok_minimum, satuan, satuan_id }) => ({
          no, nama, barcode, kategori, harga_beli, harga_jual, stok, stok_minimum, satuan, satuan_id,
        })),
        grosir: validGrosirRows.map(({ no_produk, nama_paket, satuan, satuan_id, konversi, harga_beli, harga_jual }) => ({
          no_produk, nama_paket, satuan, satuan_id, konversi, harga_beli, harga_jual,
        })),
      },
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
    if (!open && !isImporting && !isLoadingPreview) resetState()
    onOpenChange(open)
  }

  const displayRows =
    filterView === 'valid' ? validRows : filterView === 'error' ? invalidRows : rows
  const displayGrosirRows =
    filterView === 'valid' ? validGrosirRows : filterView === 'error' ? invalidGrosirRows : grosirRows

  const isLoading = isLoadingPreview || isImporting
  const hasFile = fileName !== ''
  const hasError = invalidRows.length > 0 && !isLoadingPreview
  const submitLabel = isLoadingPreview
    ? 'Memuat preview...'
    : validRows.length > 0
      ? `Import ${validRows.length} Produk Valid`
      : 'Import'

  return (
    <FormModal
      open={open}
      onOpenChange={handleClose}
      title="Import Produk"
      size="lg"
      isLoading={isLoading}
      submitDisabled={validRows.length === 0 && hasFile}
      submitLabel={submitLabel}
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
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors ${
            hasError
              ? 'border-red-300 bg-red-50 hover:border-red-400'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => {
            if (isLoading) return
            if (fileInputRef.current) fileInputRef.current.value = ''
            fileInputRef.current?.click()
          }}
        >
          <Upload size={24} className={isLoadingPreview ? 'text-blue-400 animate-pulse' : hasError ? 'text-red-400' : 'text-gray-400'} />
          <p className="text-sm text-gray-500">
            {isLoadingPreview ? (
              <span className="font-medium text-blue-600">Memvalidasi data...</span>
            ) : fileName ? (
              <span className="font-medium text-gray-700">{fileName}</span>
            ) : (
              'Klik untuk pilih file Excel (.xlsx)'
            )}
          </p>
          {hasError && (
            <p className="text-xs text-red-500 font-medium">
              Terdapat {invalidRows.length} baris error — perbaiki file Excel lalu klik area ini untuk upload ulang
            </p>
          )}
          {!fileName && (
            <p className="text-xs text-gray-400">
              Sheet "Produk": no, nama, deskripsi, barcode, kategori, harga_beli, harga_jual, stok, stok_minimum, satuan
            </p>
          )}
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
                  {['No', 'Produk', 'Barcode', 'Kategori', 'H.Beli', 'H.Jual', 'Margin', 'Stok', 'Stok Min', 'Satuan', 'Status'].map((h) => (
                    <th key={h} className="px-2 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row) => (
                  <React.Fragment key={row.no}>
                    <tr className={row.valid ? 'bg-green-50' : 'bg-red-50'}>
                      <td className="px-2 py-1.5 text-gray-400">{row.no}</td>
                      <td className="px-2 py-1.5 font-medium">{row.nama || '—'}</td>
                      <td className="px-2 py-1.5 font-mono">{row.barcode || <span className="text-gray-400 italic">auto</span>}</td>
                      <td className="px-2 py-1.5">{row.kategori || '—'}</td>
                      <td className="px-2 py-1.5 text-right">{row.harga_beli.toLocaleString('id-ID')}</td>
                      <td className="px-2 py-1.5 text-right">{row.harga_jual.toLocaleString('id-ID')}</td>
                      <td className="px-2 py-1.5 text-center">
                        <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium ${
                          row.margin >= 30
                            ? 'bg-green-100 text-green-700'
                            : row.margin >= 15
                              ? 'bg-amber-100 text-amber-700'
                              : row.margin > 0
                                ? 'bg-red-100 text-red-600'
                                : 'bg-gray-100 text-gray-400'
                        }`}>
                          {row.margin}%
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-right">{row.stok}</td>
                      <td className="px-2 py-1.5 text-right">{row.stok_minimum}</td>
                      <td className="px-2 py-1.5">{row.satuan || '—'}</td>
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
                        <td colSpan={11} className="px-2 pb-1.5 text-xs">
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
                  <th className="px-2 py-2 text-left font-medium text-gray-600 whitespace-nowrap">No Produk</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 whitespace-nowrap">Nama Paket</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 whitespace-nowrap">Satuan</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 whitespace-nowrap">Konversi</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 whitespace-nowrap">H.Beli</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 whitespace-nowrap">H.Jual</th>
                  <th className="px-2 py-2 text-left font-medium text-gray-600 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayGrosirRows.map((row, i) => (
                  <React.Fragment key={i}>
                    <tr className={row.valid ? 'bg-green-50' : 'bg-red-50'}>
                      <td className="px-2 py-1.5">{row.no_produk || '—'}</td>
                      <td className="px-2 py-1.5 font-medium">{row.nama_paket || '—'}</td>
                      <td className="px-2 py-1.5">{row.satuan || '—'}</td>
                      <td className="px-2 py-1.5 text-right">{row.konversi}</td>
                      <td className="px-2 py-1.5 text-right">{row.harga_beli.toLocaleString('id-ID')}</td>
                      <td className="px-2 py-1.5 text-right">{row.harga_jual.toLocaleString('id-ID')}</td>
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
                        <td colSpan={7} className="px-2 pb-1.5 text-xs">
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
