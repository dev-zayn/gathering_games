import { CircleAlert, CircleCheck, Info, TriangleAlert, X, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast as toastApi, type Toast, type ToastVariant } from '@/lib/toast-store'
import { cn } from '@/lib/utils'

const ICONS: Record<ToastVariant, { icon: LucideIcon; tone: string }> = {
  success: { icon: CircleCheck, tone: 'text-success-soft' },
  error: { icon: CircleAlert, tone: 'text-danger-soft' },
  warning: { icon: TriangleAlert, tone: 'text-primary' },
  info: { icon: Info, tone: 'text-neon-soft' },
}

interface Props {
  toast: Toast
}

/** One ink capsule: icon, message, an optional action (the «تراجع» undo). */
export function ToastCard({ toast }: Props) {
  const { icon: Icon, tone } = ICONS[toast.variant]
  return (
    <div
      role={toast.variant === 'error' ? 'alert' : 'status'}
      className="flex items-center gap-2.5 rounded-full bg-screen/92 py-1.5 ps-3.5 pe-1.5 text-white shadow-xl"
    >
      <Icon aria-hidden className={cn('size-5 shrink-0', tone)} strokeWidth={2.25} />
      <p className="min-w-0 flex-1 text-13 leading-snug font-medium">{toast.message}</p>
      {toast.action && (
        <Button
          variant="ghost"
          size="inline"
          className="px-1.5 font-bold text-primary hover:bg-transparent"
          onClick={() => {
            toast.action?.onClick()
            toastApi.dismiss(toast.id)
          }}
        >
          {toast.action.label}
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        aria-label="إغلاق"
        className="size-8 rounded-full text-white/60 hover:bg-white/10 hover:text-white"
        onClick={() => {
          toastApi.dismiss(toast.id)
        }}
      >
        <X className="size-4" strokeWidth={2.5} />
      </Button>
    </div>
  )
}
