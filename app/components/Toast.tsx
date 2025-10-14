'use client'

import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  message: string
  type?: ToastType
  isOpen: boolean
  onClose: () => void
  duration?: number
}

export default function Toast({ 
  message, 
  type = 'info', 
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

  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-l-4 border-green-500',
      icon: <CheckCircle className="text-green-500" size={24} />,
      text: 'text-green-800'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-l-4 border-red-500',
      icon: <XCircle className="text-red-500" size={24} />,
      text: 'text-red-800'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-l-4 border-yellow-500',
      icon: <AlertCircle className="text-yellow-500" size={24} />,
      text: 'text-yellow-800'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-l-4 border-blue-500',
      icon: <Info className="text-blue-500" size={24} />,
      text: 'text-blue-800'
    }
  }

  const currentStyle = styles[type]

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 duration-300">
      <div className={`${currentStyle.bg} ${currentStyle.border} rounded-lg shadow-lg p-4 max-w-md flex items-start gap-3`}>
        {currentStyle.icon}
        <div className="flex-1">
          <p className={`${currentStyle.text} font-medium`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  )
}