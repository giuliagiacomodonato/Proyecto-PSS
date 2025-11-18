"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Breadcrumb from '../components/Breadcrumb'
import { 
  Home, 
  Volleyball,
  Trophy,
  CreditCard,
  CheckSquare,
  User,
  ChevronRight,
  LogOut,
  AlertCircle,
  X
} from 'lucide-react'

interface Practica {
  id: number
  nombre: string
  descripcion?: string
  horario?: string
  precio?: number
}

interface Reserva {
  id: number
  cancha: string
  fecha: string
  horario: string
  tipo?: string
  precio?: number
}

interface Cuota {
  id: number
  tipo: string
  monto: number
  estado: 'pagado' | 'pendiente' | 'vencido'
  vencimiento: string
}

interface CuotaPractica {
  id: number
  practicaDeportivaId: number
  nombrePractica: string
  precio: number
  periodo: string
  estado: 'PAGADA' | 'IMPAGA'
}

interface UserData {
  id: number
  nombre: string
  email: string
  telefono?: string
  dni?: string
}

interface DashboardData {
  socio: UserData
  practicas: Practica[]
  reservas: Reserva[]
  cuotas: Cuota[]
}

export default function SocioPage() {
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [cuotasPractica, setCuotasPractica] = useState<CuotaPractica[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPractica, setSelectedPractica] = useState<Practica | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Obtener datos del usuario desde localStorage
        const usuarioGuardado = localStorage.getItem('usuario')
        if (!usuarioGuardado) {
          setError('No se encontraron datos de sesión. Por favor, inicie sesión nuevamente.')
          setLoading(false)
          // Redirigir al login después de 2 segundos
          setTimeout(() => router.push('/'), 2000)
          return
        }

        const usuario = JSON.parse(usuarioGuardado)
        const socioId = usuario.id

        // Llamar al endpoint del dashboard
        const response = await fetch(`/api/socios/dashboard?socioId=${socioId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Socio no encontrado')
          } else {
            setError('Error al cargar los datos del dashboard')
          }
          return
        }

        const data = await response.json()
        setDashboardData(data)

        // Obtener cuotas de prácticas
        const cuotasResponse = await fetch(`/api/socios/cuotas-practica?usuarioId=${usuario.id}`)
        if (cuotasResponse.ok) {
          const cuotasData = await cuotasResponse.json()
          setCuotasPractica(cuotasData.cuotasPractica || [])
        }
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err)
        setError('Error al conectar con el servidor')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="text-red-600 mx-auto mb-4" size={48} />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return null
  }

  const { socio, practicas, reservas, cuotas } = dashboardData

  return (
    <>
      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
          <p className="text-red-700 text-sm ml-2">{error}</p>
        </div>
      )}

      {/* Dashboard Content */}
          <div className="p-8">
            {/* Breadcrumb */}
            <div className="mb-8">
              <Breadcrumb items={[
                { label: 'Panel Principal', active: true }
              ]} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content Area */}
              <div className="lg:col-span-2 space-y-8">
                {/* Prácticas Deportivas Section */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volleyball size={20} className="text-blue-600" />
                        <h2 className="text-lg font-semibold text-gray-900">Prácticas Deportivas</h2>
                      </div>
                      <Link
                        href="/socio/inscripciones"
                        className="px-3 py-1.5 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
                      >
                        Inscripciones
                      </Link>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {practicas && practicas.length > 0 ? (
                      practicas.map((practica) => (
                        <button
                          key={practica.id}
                          onClick={() => setSelectedPractica(practica)}
                          className="w-full px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between group text-left"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{practica.nombre}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {practica.horario || practica.descripcion || 'Sin información'}
                            </p>
                          </div>
                          <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-600" />
                        </button>
                      ))
                    ) : (
                      <div className="px-6 py-8 text-center">
                        <p className="text-gray-500 text-sm">No hay prácticas disponibles</p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Reservas de Canchas Section */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <Trophy size={20} className="text-blue-600" />
                      <h2 className="text-lg font-semibold text-gray-900">Reservas de Canchas</h2>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {reservas && reservas.length > 0 ? (
                      reservas.map((reserva) => (
                        <Link
                          key={reserva.id}
                          href="/socio/reservaCancha"
                          className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between group"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{reserva.cancha}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {reserva.fecha} - {reserva.horario}
                              {reserva.tipo && ` • ${reserva.tipo}`}
                            </p>
                          </div>
                          <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-600" />
                        </Link>
                      ))
                    ) : (
                      <div className="px-6 py-8 text-center">
                        <p className="text-gray-500 text-sm mb-4">No hay reservas activas</p>
                        <Link
                          href="/socio/reservaCancha"
                          className="inline-block px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                        >
                          Nueva reserva
                        </Link>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Right Sidebar - Cuotas */}
              <div className="lg:col-span-1">
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-8">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <CreditCard size={20} className="text-blue-600" />
                      <h2 className="text-lg font-semibold text-gray-900">Cuotas</h2>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {/* Cuota Socio */}
                    {cuotas && cuotas.length > 0 && (
                      <>
                        {cuotas.map((cuota) => (
                          <button
                            key={cuota.id}
                            onClick={() => {
                              // Guardar la cuota seleccionada en sessionStorage
                              sessionStorage.setItem('pagoCuotaPendiente', JSON.stringify({
                                cuotas: [{
                                  id: cuota.id,
                                  periodo: cuota.tipo,
                                  monto: cuota.monto
                                }],
                                total: cuota.monto,
                                tipoUsuario: 'SOCIO'
                              }))
                              router.push('/socio/pagoSocio?tipo=CUOTA_MENSUAL')
                            }}
                            className="w-full px-6 py-4 hover:bg-gray-50 transition-colors block group text-left"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-gray-900">{cuota.tipo}</p>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  cuota.estado === 'pagado'
                                    ? 'bg-green-100 text-green-800'
                                    : cuota.estado === 'vencido'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {cuota.estado === 'pagado' ? 'Pagado' : cuota.estado === 'vencido' ? 'Vencido' : 'Pendiente'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">Vencimiento: {cuota.vencimiento}</p>
                            <p className="text-lg font-semibold text-gray-900 mt-2">${cuota.monto.toLocaleString('es-AR')}</p>
                          </button>
                        ))}
                      </>
                    )}

                    {/* Cuota Práctica */}
                    {cuotasPractica && cuotasPractica.length > 0 && (
                      <div className="divide-y divide-gray-200">
                        <div className="px-6 py-3 bg-gray-100">
                          <p className="text-xs font-semibold text-gray-600 uppercase">Cuotas de Prácticas</p>
                        </div>
                        {cuotasPractica.map((cuota) => (
                          <div
                            key={cuota.id}
                            className="px-6 py-4 hover:bg-gray-50 transition-colors block group"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-gray-900">{cuota.nombrePractica}</p>
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  cuota.estado === 'PAGADA'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {cuota.estado === 'PAGADA' ? 'Pagada' : 'Impaga'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">{cuota.periodo}</p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-lg font-semibold text-gray-900">${cuota.precio.toFixed(2)}</p>
                              {cuota.estado === 'IMPAGA' && (
                                <button
                                  onClick={() => router.push('/socio/pagoSocio?tipo=CUOTA_PRACTICA')}
                                  className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
                                >
                                  Pagar
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!cuotas && cuotasPractica.length === 0 && (
                      <div className="px-6 py-8 text-center">
                        <p className="text-gray-500 text-sm">No hay cuotas pendientes</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>

          {/* Modal de Práctica */}
          {selectedPractica && (
            <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
              <div className="bg-white shadow-lg max-w-2xl w-full mx-4 pointer-events-auto border-3 border-black">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b-2 border-black bg-gray-800 text-white">
                  <h2 className="text-lg font-bold">{selectedPractica.nombre}</h2>
                  <button
                    onClick={() => setSelectedPractica(null)}
                    className="text-white hover:text-gray-200 transition-colors"
                  >
                    <X size={28} />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="px-8 py-6 space-y-6 bg-white">
                  {/* Descripción */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Descripción</h3>
                    <p className="text-gray-700">{selectedPractica.descripcion || 'Sin descripción disponible'}</p>
                  </div>

                  {/* Información General */}
                  <div className="grid grid-cols-2 gap-4">
                    {selectedPractica.horario && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Horario</p>
                        <p className="font-semibold text-gray-900">{selectedPractica.horario}</p>
                      </div>
                    )}
                    {selectedPractica.precio && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Precio</p>
                        <p className="font-semibold text-gray-900">${selectedPractica.precio.toLocaleString('es-AR')}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="px-8 py-6 border-t-2 border-black bg-gray-800 flex gap-4">
                  <button
                    onClick={() => setSelectedPractica(null)}
                    className="flex-1 px-4 py-3 border-2 border-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                  >
                    Cerrar
                  </button>
                  <Link
                    href="/socio/inscripciones"
                    className="flex-1 px-4 py-3 bg-white text-gray-800 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-center"
                  >
                    Ir a Inscripciones
                  </Link>
                </div>
              </div>
            </div>
          )}
    </>
  )
}
