"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, DollarSign } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select'
import ConfirmReservaModal from './ConfirmReservaModal'

interface Cancha {
  id: number
  nombre: string
  tipo: string
  precio: number
  horarios: { id: number; horaInicio: string; horaFin: string }[]
}

interface TurnoDisponible {
  hora: string
  disponible: boolean
}

interface ReservaCanchaProps {
  usuarioSocioId: number
  onSuccess: () => void
  onError: (message: string) => void
}

export default function ReservaCancha({ 
  usuarioSocioId, 
  onSuccess, 
  onError 
}: ReservaCanchaProps) {
  const router = useRouter()
  
  // Estados
  const [canchas, setCanchas] = useState<Cancha[]>([])
  const [selectedCancha, setSelectedCancha] = useState<Cancha | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedHora, setSelectedHora] = useState<string>('')
  const [turnosDisponibles, setTurnosDisponibles] = useState<TurnoDisponible[]>([])
  const [loading, setLoading] = useState(true)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{
    cancha?: string
    fecha?: string
    horario?: string
  }>({})

  // Cargar canchas disponibles
  useEffect(() => {
    const fetchCanchas = async () => {
      try {
        const response = await fetch('/api/canchas')
        if (!response.ok) throw new Error('Error al cargar canchas')
        
        const data = await response.json()
        setCanchas(data.canchas)
      } catch (error) {
        console.error('Error:', error)
        onError('Error al cargar las canchas disponibles')
      } finally {
        setLoading(false)
      }
    }

    fetchCanchas()
  }, [onError])

  // Cargar turnos disponibles cuando se selecciona cancha y fecha
  useEffect(() => {
    if (selectedCancha && selectedDate) {
      fetchTurnosDisponibles()
    }
  }, [selectedCancha, selectedDate])

  const fetchTurnosDisponibles = async () => {
    try {
      if (!selectedCancha || !selectedDate) return

      // Validar que el horario de la cancha esté disponible
      const selectedDateObj = new Date(selectedDate)
      const dayOfWeek = selectedDateObj.getDay()

      // Obtener los horarios disponibles de la cancha
      const response = await fetch(
        `/api/turnos/disponibles?canchaId=${selectedCancha.id}&fecha=${selectedDate}`
      )

      if (!response.ok) throw new Error('Error al cargar turnos')

      const data = await response.json()
      setTurnosDisponibles(data.turnos || [])
      setSelectedHora('')
    } catch (error) {
      console.error('Error:', error)
      onError('Error al cargar los horarios disponibles')
      setTurnosDisponibles([])
    }
  }

  const handleCanchaChange = (canchaId: string) => {
    const cancha = canchas.find(c => c.id === parseInt(canchaId))
    setSelectedCancha(cancha || null)
    setSelectedDate('')
    setSelectedHora('')
    setTurnosDisponibles([])
    setValidationErrors({})
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value
    
    if (!date) {
      setSelectedDate('')
      setSelectedHora('')
      setTurnosDisponibles([])
      return
    }

    // Validar que sea una fecha válida
    const selectedDateObj = new Date(date + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Validar que la fecha no sea en el pasado
    if (selectedDateObj < today) {
      onError('La fecha debe ser a partir de hoy')
      return
    }

    // Validar que la fecha no sea más allá de 30 días
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 30)
    maxDate.setHours(23, 59, 59, 999)

    if (selectedDateObj > maxDate) {
      onError('Solo puedes reservar hasta 30 días en adelante')
      return
    }

    setSelectedDate(date)
    setSelectedHora('')
  }

  const isReservaValid = selectedCancha && selectedDate && selectedHora

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {}

    if (!selectedCancha) {
      errors.cancha = 'Debes seleccionar una cancha'
    }

    if (!selectedDate) {
      errors.fecha = 'Debes seleccionar una fecha'
    }

    if (!selectedHora) {
      errors.horario = 'Debes seleccionar un horario'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleConfirmReserva = () => {
    if (validateForm()) {
      setShowConfirmModal(true)
    }
  }

  const handleConfirmPayment = async () => {
    if (!isReservaValid || !selectedCancha) return
    
    try {
      setShowConfirmModal(false)
      
      // Guardar la reserva directamente sin pago (por ahora)
      const response = await fetch('/api/reservas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          canchaId: selectedCancha.id,
          fecha: selectedDate,
          horario: selectedHora,
          usuarioSocioId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al guardar la reserva')
      }

      // Limpiar el formulario
      setSelectedCancha(null)
      setSelectedDate('')
      setSelectedHora('')
      setTurnosDisponibles([])
      
      onSuccess()
    } catch (error) {
      console.error('Error:', error)
      const message = error instanceof Error ? error.message : 'Error al procesar la reserva'
      onError(message)
    }
  }

  // Formatear tipo de cancha (FUTBOL_5 → Fútbol 5)
  const formatTipoCancha = (tipo: string) => {
    return tipo
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  // Obtener fecha mínima (hoy)
  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Obtener fecha máxima (30 días desde hoy)
  const getMaxDate = () => {
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 30)
    return maxDate.toISOString().split('T')[0]
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-600">Cargando canchas disponibles...</div>
      </div>
    )
  }

  if (canchas.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800">No hay canchas disponibles en este momento</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      {/* Selección de Cancha y Precio */}
      <div className="mb-4 flex gap-4 items-stretch">
        {/* Cancha */}
        <div className="flex-1">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Cancha a reservar *
          </label>
          <Select value={selectedCancha?.id.toString() || ''} onValueChange={handleCanchaChange}>
            <SelectTrigger className={`w-full text-sm ${
              validationErrors.cancha ? 'border-red-500 border-2' : 'border-gray-300'
            } bg-white`}>
              <SelectValue placeholder="Seleccionar una cancha" />
            </SelectTrigger>
            <SelectContent>
              {canchas.map(cancha => (
                <SelectItem key={cancha.id} value={cancha.id.toString()}>
                  {cancha.nombre} ({formatTipoCancha(cancha.tipo)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {validationErrors.cancha && (
            <p className="text-red-600 text-xs mt-1">{validationErrors.cancha}</p>
          )}
        </div>

        {/* Mostrar precio cuando se selecciona cancha */}
        {selectedCancha && (
          <div className="flex flex-col justify-end items-end gap-0.5">
            <p className="text-xs text-gray-600">Precio</p>
            <p className="text-base font-semibold text-gray-900">${selectedCancha.precio}</p>
          </div>
        )}
      </div>

      {/* Selección de Fecha */}
      {selectedCancha && (
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            <div className="flex items-center gap-2">
              Fecha *
            </div>
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            min={getMinDate()}
            max={getMaxDate()}
            className={`w-full px-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
              validationErrors.fecha
                ? 'border-red-500 border-2 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          {validationErrors.fecha && (
            <p className="text-red-600 text-xs mt-1">{validationErrors.fecha}</p>
          )}
          <p className="text-gray-500 text-xs mt-1">
            Reserva desde hoy hasta 30 días adelante
          </p>
        </div>
      )}

      {/* Selección de Horario */}
      {selectedCancha && selectedDate && (
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            <div className="flex items-center gap-2">
              Horario *
            </div>
          </label>
          
          {turnosDisponibles.length > 0 ? (
            <div className="space-y-2">
              <Select value={selectedHora} onValueChange={(value) => {
                setSelectedHora(value)
                setValidationErrors(prev => ({ ...prev, horario: undefined }))
              }}>
                <SelectTrigger className={`w-full text-sm ${
                  validationErrors.horario ? 'border-red-500 border-2' : 'border-gray-300'
                } bg-white`}>
                  <SelectValue placeholder="Seleccionar un horario" />
                </SelectTrigger>
                <SelectContent>
                  {turnosDisponibles
                    .filter(turno => turno.disponible)
                    .map((turno, idx) => (
                      <SelectItem key={idx} value={turno.hora}>
                        {turno.hora}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {validationErrors.horario && (
                <p className="text-red-600 text-xs">{validationErrors.horario}</p>
              )}
            </div>
          ) : (
            <div className="text-gray-600 bg-gray-50 p-2 rounded text-sm">
              Cargando horarios...
            </div>
          )}
        </div>
      )}

      {/* Botón Reservar */}
      <div className="flex gap-4 pt-3 border-t">
        <button
          onClick={handleConfirmReserva}
          disabled={!isReservaValid}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            isReservaValid
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg cursor-pointer'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isReservaValid ? 'Reservar' : 'Completa todos los campos'}
        </button>
      </div>

      {/* Modal de Confirmación */}
      {showConfirmModal && selectedCancha && (
        <ConfirmReservaModal
          cancha={selectedCancha}
          fecha={selectedDate}
          horario={selectedHora}
          precio={selectedCancha.precio}
          onConfirm={handleConfirmPayment}
          onCancel={() => setShowConfirmModal(false)}
        />
      )}
    </div>
  )
}
