import { CircleAlert, CircleCheck, Info, TriangleAlert, X, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast as toastApi, type Toast, type ToastVariant } from '@/lib/toast-store'
import { cn } from '@/lib/utils'

const ICONS: Record<ToastVariant, { icon: LucideIcon; tone: string }> = {
  success: { icon: CircleCheck, tone: 'text-mint' },
  error: { icon: CircleAlert, tone: 'text-brick-lit' },
  warning: { icon: TriangleAlert, tone: 'text-brass-lit' },
  info: { icon: Info, tone: 'text-turquoise-lit' },
}

interface Props {
  toast: Toast
}

/** A note slid across the table: icon, message, an optional action. */
export function ToastCard({ toast }: Props) {
  const { icon: Icon, tone } = ICONS[toast.variant]
  return (
    <div
      role={toast.variant === 'error' ? 'alert' : 'status'}
      className="flex items-center gap-2.5 rounded-full border border-hairline-strong bg-slab-raised/95 py-1.5 ps-3.5 pe-1.5 text-ink shadow-slab backdrop-blur-sm"
    >
      <Icon aria-hidden className={cn('size-5 shrink-0', tone)} strokeWidth={2.25} />
      <p className="min-w-0 flex-1 text-13 leading-snug font-medium">{toast.message}</p>
      {toast.action && (
        <Button
          variant="ghost"
          size="inline"
          className="px-1.5 font-bold text-brass-lit hover:bg-transparent"
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
        className="size-8 rounded-full text-ink-faint hover:text-ink"
        onClick={() => {
          toastApi.dismiss(toast.id)
        }}
      >
        <X className="size-4" strokeWidth={2.5} />
      </Button>
    </div>
  )
}
