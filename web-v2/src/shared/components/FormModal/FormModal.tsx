import { type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { cn } from '@/shared/utils'

const SIZE_MAP = {
  sm: 'max-w-[400px]',
  md: 'max-w-[540px]',
  lg: 'max-w-[720px]',
  xl: 'max-w-[900px]',
  full: 'max-w-[calc(100vw-48px)]',
} as const

interface FormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  size?: keyof typeof SIZE_MAP
  isLoading?: boolean
  submitDisabled?: boolean
  onSubmit?: () => void
  submitLabel?: string
  cancelLabel?: string
  children: ReactNode
  hideFooter?: boolean
}

export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  size = 'md',
  isLoading,
  submitDisabled,
  onSubmit,
  submitLabel = 'Simpan',
  cancelLabel = 'Batal',
  children,
  hideFooter,
}: FormModalProps) {
  function handleOpenChange(val: boolean) {
    if (isLoading) return
    onOpenChange(val)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn('flex flex-col gap-0 p-0', SIZE_MAP[size])}
        onInteractOutside={(e) => {
          if (isLoading) e.preventDefault()
        }}
        onEscapeKeyDown={(e) => {
          if (isLoading) e.preventDefault()
        }}
      >
        {/* Header */}
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className={description ? '' : 'sr-only'}>
            {description ?? title}
          </DialogDescription>
        </DialogHeader>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4" style={{ maxHeight: '70vh' }}>
          {children}
        </div>

        {/* Footer */}
        {!hideFooter && (
          <DialogFooter className="border-t px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
            <Button type="button" onClick={onSubmit} disabled={isLoading || submitDisabled}>
              {isLoading && <Loader2 size={14} className="animate-spin" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
