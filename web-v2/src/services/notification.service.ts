import { toast } from 'sonner'

export const initOfflineDetection = () => {
  const TOAST_ID = 'offline-notification'

  const handleOffline = () => {
    toast.warning('Koneksi internet terputus. Beberapa fitur tidak tersedia.', {
      id: TOAST_ID,
      duration: Infinity,
    })
  }

  const handleOnline = () => {
    toast.dismiss(TOAST_ID)
    toast.success('Koneksi internet kembali normal.')
  }

  window.addEventListener('offline', handleOffline)
  window.addEventListener('online', handleOnline)

  if (!navigator.onLine) handleOffline()

  return () => {
    window.removeEventListener('offline', handleOffline)
    window.removeEventListener('online', handleOnline)
  }
}
