"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Volleyball,
  Calendar,
  Clock,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import SidebarSocio from '../../components/SidebarSocio'
import Toast from '../../components/Toast'

interface Horario {
  id: number
  dia: string
  horaInicio: string
  horaFin: string
}

interface Practica {
  id: number
  nombre: string
  descripcion: string
  precio: number
  cupo: number
  inscriptosActuales: number
  cuposDisponibles: number
  estaInscrito: boolean
  horarios: Horario[]
}

interface ConfirmData {
  practica: Practica | null
}

export default function InscripcionesPage() {
  const router = useRouter()
  const [practicas, setPracticas] = useState<Practica[]>([])
  const [loading, setLoading] = useState(true)
  const [socioId, setSocioId] = useState<number | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [confirmData, setConfirmData] = useState<ConfirmData>({ practica: null })
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<number, string>>({})
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
    isOpen: boolean
  }>({
    message: '',
    type: 'success',
    isOpen: false
  })

  useEffect(() => {
    const fetchPracticas = async () => {
      try {
        setLoading(true)

        // Obtener ID del socio desde localStorage
        const usuarioGuardado = localStorage.getItem('usuario')
        if (!usuarioGuardado) {
          router.push('/')
          return
        }

        const usuario = JSON.parse(usuarioGuardado)
        setSocioId(usuario.id)

        // Obtener prácticas disponibles
        const response = await fetch(`/api/practicas/inscripciones?socioId=${usuario.id}`)
        if (!response.ok) {
          throw new Error('Error al cargar prácticas')
        }

        const data = await response.json()
        setPracticas(data.practicas)
      } catch (error) {
        console.error('Error:', error)
        setToast({
          message: 'Error al cargar las prácticas disponibles',
          type: 'error',
          isOpen: true
        })
      } finally {
        setLoading(false)
      }
    }

    fetchPracticas()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    router.push('/')
  }

  const openConfirmModal = (practica: Practica) => {
    setConfirmData({ practica })
    setConfirming(true)
  }

  const closeConfirmModal = () => {
    setConfirming(false)
    setConfirmData({ practica: null })
  }

  const handleConfirmInscripcion = async () => {
    if (!confirmData.practica || !socioId) return

    try {
      setSubmitting(true)
      setErrors({})

      const response = await fetch('/api/practicas/inscripciones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          usuarioSocioId: socioId,
          practicaDeportivaId: confirmData.practica.id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Manejar error de cupo lleno
        if (data.cupoLleno) {
          setErrors({
            [confirmData.practica.id]: 'No hay cupos disponibles en esta práctica deportiva'
          })
        } else {
          setErrors({
            [confirmData.practica.id]: data.error || 'Error al registrar la inscripción'
          })
        }
        setToast({
          message: data.error || 'Error al registrar la inscripción',
          type: 'error',
          isOpen: true
        })
      } else {
        // Éxito
        setToast({
          message: `¡Inscripción exitosa en ${confirmData.practica.nombre}!`,
          type: 'success',
          isOpen: true
        })

        // Actualizar la lista de prácticas
        setPracticas(prev =>
          prev.map(p =>
            p.id === confirmData.practica?.id
              ? {
                  ...p,
                  estaInscrito: true,
                  inscriptosActuales: p.inscriptosActuales + 1,
                  cuposDisponibles: p.cuposDisponibles - 1
                }
              : p
          )
        )
      }

      closeConfirmModal()
    } catch (error) {
      console.error('Error:', error)
      setToast({
        message: 'Error al procesar la inscripción',
        type: 'error',
        isOpen: true
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatHorario = (horarios: Horario[]) => {
    if (horarios.length === 0) return 'Sin horarios'
    return horarios.map(h => `${h.dia} ${h.horaInicio}-${h.horaFin}`).join(', ')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SidebarSocio onLogout={handleLogout} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando prácticas disponibles...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <SidebarSocio onLogout={handleLogout} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Link
              href="/socio"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Volver al panel principal"
            >
              <ArrowLeft size={24} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inscripción a Prácticas Deportivas</h1>
              <p className="text-sm text-gray-500 mt-1">Explorá e inscribite a nuestras prácticas deportivas disponibles</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            {practicas.length === 0 ? (
              <div className="text-center py-12">
                <Volleyball size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 text-lg">No hay prácticas disponibles en este momento</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {practicas.map((practica) => (
                  <div
                    key={practica.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all overflow-hidden flex flex-col"
                  >
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h2 className="text-lg font-bold text-gray-900">{practica.nombre}</h2>
                          <p className="text-sm text-gray-600 mt-1">{practica.descripcion}</p>
                        </div>
                        <Volleyball size={24} className="text-blue-600 flex-shrink-0" />
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="px-6 py-4 flex-1 space-y-4">
                      {/* Precio */}
                      <div className="flex items-center gap-3">
                        <DollarSign size={18} className="text-gray-400" />
                        <span className="text-sm text-gray-600">Precio:</span>
                        <span className="text-lg font-bold text-gray-900">${practica.precio.toLocaleString('es-AR')}</span>
                      </div>

                      {/* Horarios */}
                      <div className="flex items-start gap-3">
                        <Clock size={18} className="text-gray-400 mt-0.5" />
                        <div>
                          <span className="text-sm text-gray-600 block mb-1">Horarios:</span>
                          <div className="text-sm text-gray-700 space-y-1">
                            {practica.horarios.map((h) => (
                              <div key={h.id} className="flex items-center gap-2">
                                <Calendar size={14} className="text-gray-400" />
                                <span>{h.dia} {h.horaInicio}-{h.horaFin}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Cupos */}
                      <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg">
                        <Users size={18} className="text-gray-400" />
                        <div className="flex-1 text-sm">
                          <span className="text-gray-600">Cupos disponibles:</span>
                          <span className={`font-bold ml-2 ${practica.cuposDisponibles > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {practica.cuposDisponibles}/{practica.cupo}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Error message */}
                    {errors[practica.id] && (
                      <div className="px-6 py-3 bg-red-50 border-t border-red-200">
                        <div className="flex items-start gap-2">
                          <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-700">{errors[practica.id]}</p>
                        </div>
                      </div>
                    )}

                    {/* Card Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                      {practica.estaInscrito ? (
                        <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
                          <CheckCircle size={20} />
                          Ya inscrito
                        </div>
                      ) : (
                        <button
                          onClick={() => openConfirmModal(practica)}
                          disabled={practica.cuposDisponibles <= 0}
                          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                            practica.cuposDisponibles > 0
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {practica.cuposDisponibles > 0 ? 'Inscribirse' : 'Sin cupos'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal de confirmación */}
      {confirming && confirmData.practica && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Confirmar Inscripción</h2>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600">Práctica:</p>
                <p className="text-lg font-semibold text-gray-900">{confirmData.practica.nombre}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Descripción:</p>
                <p className="text-sm text-gray-700">{confirmData.practica.descripcion}</p>
              </div>

              <div className="flex gap-8">
                <div>
                  <p className="text-sm text-gray-600">Precio:</p>
                  <p className="text-lg font-bold text-gray-900">${confirmData.practica.precio.toLocaleString('es-AR')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Horarios:</p>
                  <div className="text-sm text-gray-700">
                    {confirmData.practica.horarios.length > 0 ? (
                      confirmData.practica.horarios.map((h) => (
                        <div key={h.id}>{h.dia} {h.horaInicio}</div>
                      ))
                    ) : (
                      <div>No disponible</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-4 p-6 border-t border-gray-200">
              <button
                onClick={handleConfirmInscripcion}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Procesando...' : 'Confirmar'}
              </button>
              <button
                onClick={closeConfirmModal}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <Toast
        message={toast.message}
        type={toast.type}
        isOpen={toast.isOpen}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}
