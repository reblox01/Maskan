import { toast as sonnerToast } from 'sonner'

type ToastOptions = {
  description?: string
  duration?: number
  action?: { label: string; onClick: () => void }
  variant?: 'default' | 'success' | 'destructive'
}

export function toast(options: ToastOptions & { title: string }) {
  const { title, description, variant = 'default', ...rest } = options
  
  switch (variant) {
    case 'destructive':
      sonnerToast.error(title, { description, ...rest })
      break
    case 'success':
      sonnerToast.success(title, { description, ...rest })
      break
    default:
      sonnerToast(title, { description, ...rest })
  }
}

export function useToast() {
  return { toast }
}