'use client'

import { useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  message: string
  type?: ToastType
  isOpen: boolean
  onClose: () => void
  duration?: number
}

export default function Toast({ 
  message, 
  type = 'success', 
  isOpen, 
  onClose,
  duration = 3000 
}: ToastProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-600" />
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-600" />
      case 'info':
        return <Info className="w-6 h-6 text-blue-600" />
    }
  }

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-white border-l-4 border-green-600 shadow-lg'
      case 'error':
        return 'bg-white border-l-4 border-red-600 shadow-lg'
      case 'warning':
        return 'bg-white border-l-4 border-yellow-600 shadow-lg'
      case 'info':
        return 'bg-white border-l-4 border-blue-600 shadow-lg'
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 duration-300">
      <div className={`${getStyles()} rounded-lg p-4 min-w-[320px] max-w-md flex items-center gap-3`}>
        {getIcon()}
        <p className="flex-1 text-gray-800 font-medium">{message}</p>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  )
}
