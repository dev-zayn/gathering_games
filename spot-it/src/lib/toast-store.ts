import { useSyncExternalStore } from 'react'

// Global, app-wide messaging. Callable from anywhere — a mutation's onError, an
// event handler — without a provider:
//   toast.success('تم نسخ رقم الطلب')
//   toast.info('تم حذف المادة', { action: { label: 'تراجع', onClick: undo } })

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: number
  variant: ToastVariant
  message: string
  /** ms; 0 = sticky (manual dismiss only). */
  duration: number
  action?: ToastAction
}

export interface ToastOptions {
  duration?: number
  action?: ToastAction
}

const MAX_VISIBLE = 3
const DEFAULT_DURATION = 3500

const listeners = new Set<() => void>()
const timers = new Map<number, number>()
let toasts: Toast[] = []
let counter = 1

function emit() {
  listeners.forEach((listener) => {
    listener()
  })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getSnapshot = () => toasts

function clearTimer(id: number) {
  const handle = timers.get(id)
  if (handle !== undefined) {
    window.clearTimeout(handle)
    timers.delete(id)
  }
}

function dismiss(id: number) {
  clearTimer(id)
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

function show(variant: ToastVariant, message: string, opts: ToastOptions = {}): number {
  const id = counter++
  const toast: Toast = {
    id,
    variant,
    message,
    duration: opts.duration ?? DEFAULT_DURATION,
    action: opts.action,
  }
  let next = [...toasts, toast]
  // Cap the queue, evicting the oldest and cleaning up its timer.
  if (next.length > MAX_VISIBLE) {
    next.slice(0, next.length - MAX_VISIBLE).forEach((t) => {
      clearTimer(t.id)
    })
    next = next.slice(-MAX_VISIBLE)
  }
  toasts = next
  emit()
  if (toast.duration > 0) {
    timers.set(
      id,
      window.setTimeout(() => {
        dismiss(id)
      }, toast.duration),
    )
  }
  return id
}

export const toast = {
  dismiss,
  success: (message: string, opts?: ToastOptions) => show('success', message, opts),
  error: (message: string, opts?: ToastOptions) => show('error', message, opts),
  warning: (message: string, opts?: ToastOptions) => show('warning', message, opts),
  info: (message: string, opts?: ToastOptions) => show('info', message, opts),
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(subscribe, getSnapshot)
}
