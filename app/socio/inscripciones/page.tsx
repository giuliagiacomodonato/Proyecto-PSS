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
  CheckCircle,
  Check,
  X
} from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import Breadcrumb from '../../components/Breadcrumb'

interface Horario {
  id: number
  dia: string
  horaInicio: string
  horaFin: string
}

interface Entrenador {
  id: number
  nombre: string
  apellido: string
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
  entrenador: Entrenador | null
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
  const [selectedPracticaId, setSelectedPracticaId] = useState<string>('')
  const [confirming, setConfirming] = useState(false)
  const [confirmData, setConfirmData] = useState<ConfirmData>({ practica: null })
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<number, string>>({})
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [mensajeTipo, setMensajeTipo] = useState<'success' | 'error'>('success')

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
        setMensaje('Error al cargar las prácticas disponibles')
        setMensajeTipo('error')
      } finally {
        setLoading(false)
      }
    }

    fetchPracticas()
  }, [router])

  // Redirigir al dashboard después de inscripción exitosa
  useEffect(() => {
    if (mensajeTipo === 'success' && mensaje && mensaje.includes('Inscripción exitosa')) {
      const timer = setTimeout(() => {
        router.push('/socio')
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [mensaje, mensajeTipo, router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    router.push('/')
  }

  const handleConfirmInscripcion = async () => {
    if (!confirmData.practica || !socioId) return

    // Verificar si ya está inscrito
    if (confirmData.practica.estaInscrito) {
      setErrors({
        [confirmData.practica.id]: 'Ya está inscrito en esta práctica deportiva'
      })
      setConfirming(false)
      setConfirmData({ practica: null })
      return
    }

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
        setMensaje(data.error || 'Error al registrar la inscripción')
        setMensajeTipo('error')
      } else {
        // Éxito
        setMensaje(`¡Inscripción exitosa en ${confirmData.practica.nombre}!`)
        setMensajeTipo('success')

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

      setConfirming(false)
      setConfirmData({ practica: null })
    } catch (error) {
      console.error('Error:', error)
      setMensaje('Error al procesar la inscripción')
      setMensajeTipo('error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <>
        <div className="mb-8">
          <Breadcrumb items={[
            { label: 'Panel Principal', href: '/socio' },
            { label: 'Inscripciones', active: true }
          ]} />
          <h1 className="text-3xl font-bold text-gray-900">Inscripción a Prácticas Deportivas</h1>
          <p className="text-sm text-gray-500 mt-2">Explore e inscríbase a nuestras prácticas deportivas disponibles</p>
        </div>
        <LoadingSpinner />
      </>
    )
  }

  return (
    <>
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Panel Principal', href: '/socio' },
          { label: 'Inscripciones', active: true }
        ]} />
        <h1 className="text-3xl font-bold text-gray-900">Inscripción a Prácticas Deportivas</h1>
        <p className="text-sm text-gray-500 mt-2">Explore e inscríbase a nuestras prácticas deportivas disponibles</p>
      </div>
      
      <div className="p-8 max-w-2xl mx-auto">
        {/* Select Práctica */}
        <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Seleccionar Práctica Deportiva
                </label>
                <select
                  value={selectedPracticaId}
                  onChange={(e) => {
                    setSelectedPracticaId(e.target.value)
                    setErrors({})
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                >
                  <option value="">-- Seleccionar una práctica --</option>
                  {practicas.filter(practica => practica.cuposDisponibles > 0).map((practica) => (
                    <option key={practica.id} value={practica.id}>
                      {practica.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Detalles de la Práctica Seleccionada */}
              {selectedPracticaId && (() => {
                const practica = practicas.find(p => p.id === parseInt(selectedPracticaId))
                return practica ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-8 py-6 border-b border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold text-gray-900">{practica.nombre}</h2>
                        </div>
                        <Volleyball size={32} className="text-blue-600 flex-shrink-0" />
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="px-8 py-6 space-y-6">
                      {/* Entrenador a cargo */}
                      <div className="pb-6 border-b border-gray-200">
                        <div className="flex items-start gap-3">
                          <Users size={24} className="text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="text-base font-semibold text-gray-900 mb-1">Entrenador a cargo:</h3>
                            {practica.entrenador ? (
                              <p className="text-gray-700 font-medium">
                                {practica.entrenador.nombre} {practica.entrenador.apellido}
                              </p>
                            ) : (
                              <p className="text-gray-500 italic">Sin entrenador por el momento</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Cupos */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Users size={24} className="text-blue-600" />
                            <div>
                              <p className="text-sm text-gray-600">Cupo restante</p>
                              <p className="text-base font-semibold text-gray-900">
                                {practica.cuposDisponibles} de {practica.cupo}
                              </p>
                            </div>
                          </div>
                          <div className={`text-center ${practica.cuposDisponibles > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            <p className="text-sm font-medium">{practica.cuposDisponibles > 0 ? 'Disponible' : 'Sin cupos'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Horarios */}
                      <div className="pb-6 border-b border-gray-200">
                        <div className="flex items-start gap-3">
                          <Clock size={24} className="text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="text-base font-semibold text-gray-900 mb-3">Horarios:</h3>
                            <div className="space-y-2">
                              {practica.horarios.length > 0 ? (
                                practica.horarios.map((h) => (
                                  <div key={h.id} className="flex items-center gap-2 text-gray-700">
                                    <Calendar size={18} className="text-blue-600" />
                                    <span className="font-medium">{h.dia}</span>
                                    <span className="text-gray-500">
                                      {h.horaInicio} - {h.horaFin}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-500 italic">Sin horarios disponibles</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Precio */}
                      <div className="flex items-center justify-between pb-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <DollarSign size={24} className="text-blue-600" />
                          <span className="text-gray-600">Precio:</span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">
                          ${practica.precio.toLocaleString('es-AR')}
                        </span>
                      </div>

                      {/* Descripción */}
                      <div className="text-sm text-gray-700">
                        <p className="font-semibold text-gray-900 mb-2">Descripción:</p>
                        <p className="text-gray-700">{practica.descripcion}</p>
                      </div>

                      {/* Inscritos */}
                      <div className="text-sm text-gray-600 pt-2 border-t border-gray-200">
                        <p>Inscritos actualmente: <span className="font-semibold text-gray-900">{practica.inscriptosActuales}</span></p>
                      </div>
                    </div>

                    {/* Error message */}
                    {errors[practica.id] && (
                      <div className="px-8 py-4 bg-red-50 border-t border-red-200">
                        <div className="flex items-start gap-3">
                          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-red-700">{errors[practica.id]}</p>
                        </div>
                      </div>
                    )}

                    {/* Card Footer */}
                    <div className="px-8 py-6 border-t border-gray-200 bg-gray-50 flex gap-4">
                      <button
                        onClick={() => {
                          setConfirmData({ practica })
                          setConfirming(true)
                        }}
                        className="flex-1 py-3 px-6 rounded-lg font-semibold transition-colors bg-gray-800 text-white hover:bg-gray-600"
                      >
                        Inscribirse
                      </button>
                    </div>
                  </div>
                ) : null
              })()}
            </div>
          </div>

      {/* Modal de confirmación*/}
      {confirming && confirmData.practica && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white shadow-lg max-w-md w-full mx-4 pointer-events-auto border-3 border-black">
            {/* Card Header */}
            <div className="bg-gray-800 text-white px-8 py-6 border-b-2 border-black">
              <h2 className="text-lg font-bold text-center">Confirmar Inscripción</h2>
              <p className="text-center">
                ¿Está seguro que desea inscribirse a la práctica deportiva?
              </p>
            </div>

            {/* Card Body */}
            <div className="px-8 py-8 bg-white">
              <p className="text-center text-gray-900">
                Práctica deportiva seleccionada: {confirmData.practica.nombre}
              </p>
            </div>

            {/* Card Footer */}
            <div className="px-8 py-6 border-t-2 border-black bg-gray-800 flex gap-4">
              <button
                onClick={handleConfirmInscripcion}
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Check size={20} />
                {submitting ? 'Procesando...' : 'Confirmar'}
              </button>
              <button
                onClick={() => {
                  setConfirming(false)
                  setConfirmData({ practica: null })
                }}
                disabled={submitting}
                className="flex-1 px-4 py-3 border-2 border-gray-400 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <X size={20} />
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje inline de éxito/error */}
      {mensaje && (
        <div className={`mt-8 flex justify-center`}>
          <div className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${mensajeTipo === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {mensaje}
          </div>
        </div>
      )}
    </>
  )
}
