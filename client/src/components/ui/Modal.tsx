import { type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  maxWidth?: string
}

export default function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = 'max-w-lg' }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]"
          />
          <div className="fixed inset-0 z-[70] overflow-y-auto p-4">
            <motion.div
  initial={{ opacity: 0, y: 20, scale: 0.98 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: 10, scale: 0.98 }}
  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
  className={`w-full ${maxWidth} bg-noir-900 border border-white/10 my-8 mx-auto max-h-[90vh] overflow-y-auto`}
>
              <div className="flex items-start justify-between px-7 pt-7 pb-5 border-b border-white/10">
                <div>
                  <h3 className="font-display italic text-2xl">{title}</h3>
                  {subtitle && <p className="text-bone-dim text-sm mt-1">{subtitle}</p>}
                </div>
                <button onClick={onClose} aria-label="Close" className="text-bone-dim hover:text-bone">
                  <X size={20} />
                </button>
              </div>
              <div className="px-7 py-6">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
