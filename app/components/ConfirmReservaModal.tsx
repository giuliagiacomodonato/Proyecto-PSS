"use client"

import React from 'react'
import { X, Check } from 'lucide-react'

interface Cancha {
  id: number
  nombre: string
  tipo: string
  precio: number
}

interface ConfirmReservaModalProps {
  cancha: Cancha
  fecha: string
  horario: string
  precio: number
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmReservaModal({
  cancha,
  fecha,
  horario,
  precio,
  onConfirm,
  onCancel
}: ConfirmReservaModalProps) {
  // Formatear la fecha
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Confirmar Reserva</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Cancha y Precio lado a lado */}
          <div className="flex gap-8">
            <div className="flex-1">
              <p className="text-sm text-gray-600">Cancha:</p>
              <p className="text-lg font-semibold text-gray-900">{cancha.nombre}</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600">Precio a pagar:</p>
              <p className="text-lg font-bold text-gray-900">${precio}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600">Fecha:</p>
            <p className="text-lg font-semibold text-gray-900">
              {formatDate(fecha)}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-600">Horario:</p>
            <p className="text-lg font-semibold text-gray-900">{horario}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-4 p-6 border-t">
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <Check size={20} />
            Confirmar
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
