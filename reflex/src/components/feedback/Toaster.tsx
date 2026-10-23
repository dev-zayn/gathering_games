import { AnimatePresence, m } from 'framer-motion'
import { useToasts } from '@/lib/toast-store'
import { ToastCard } from './ToastCard'

/** The global toast stack, top of the screen above the host bar's content. */
export function Toaster() {
  const toasts = useToasts()

  return (
    <div
      role="region"
      aria-label="الإشعارات"
      className="pointer-events-none fixed inset-x-0 top-0 z-60 flex flex-col items-center gap-2 px-3 pt-safe-3"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <m.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.94 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="pointer-events-auto max-w-sm"
          >
            <ToastCard toast={t} />
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
