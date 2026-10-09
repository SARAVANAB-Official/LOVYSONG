import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/utils/cn'

const icons = {
  info: Info,
  success: CheckCircle2,
  error: AlertCircle,
}

const tones = {
  info: 'border-white/10 bg-ink-800 text-white/85',
  success: 'border-brand-500/30 bg-brand-dim text-brand-300',
  error: 'border-red-500/30 bg-red-500/10 text-red-300',
}

export function Toasts() {
  const toasts = useUiStore((s) => s.toasts)
  const dismiss = useUiStore((s) => s.dismissToast)

  return (
    <div className="pointer-events-none fixed bottom-28 right-4 z-[90] flex w-72 flex-col gap-2 lg:bottom-24">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = icons[toast.tone]
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 24, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              className={cn(
                'pointer-events-auto flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs shadow-soft backdrop-blur',
                tones[toast.tone],
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 leading-snug">{toast.message}</span>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => dismiss(toast.id)}
                className="text-current opacity-50 transition hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
