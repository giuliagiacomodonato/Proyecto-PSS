"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Home, 
  Volleyball,
  Trophy,
  CreditCard,
  CheckSquare,
  User,
  ChevronRight,
  LogOut,
  AlertCircle
} from 'lucide-react'
import SidebarSocio from '../components/SidebarSocio'

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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err)
        setError('Error al conectar con el servidor')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [router])

  const handleLogout = () => {
    // Limpiar sesión
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    // Redirigir al login
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error && !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <SidebarSocio onLogout={handleLogout} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestor Club Deportivo</h1>
              <p className="text-sm text-gray-500 mt-1">Panel Principal</p>
            </div>
            <div className="flex items-center gap-3 bg-gray-100 px-4 py-2 rounded-full">
              <User size={20} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-700">{socio.nombre}</span>
            </div>
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="mx-8 mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <p className="text-red-700 text-sm ml-2">{error}</p>
          </div>
        )}

        {/* Dashboard Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content Area */}
              <div className="lg:col-span-2 space-y-8">
                {/* Prácticas Deportivas Section */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <Volleyball size={20} className="text-blue-600" />
                      <h2 className="text-lg font-semibold text-gray-900">Prácticas Deportivas</h2>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {practicas && practicas.length > 0 ? (
                      practicas.map((practica) => (
                        <Link
                          key={practica.id}
                          href="/socio/inscripciones"
                          className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between group"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{practica.nombre}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {practica.horario || practica.descripcion || 'Sin información'}
                            </p>
                          </div>
                          <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-600" />
                        </Link>
                      ))
                    ) : (
                      <div className="px-6 py-8 text-center">
                        <p className="text-gray-500 text-sm mb-4">No hay prácticas disponibles</p>
                        <Link
                          href="/socio/inscripciones"
                          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          Explorar prácticas
                        </Link>
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
                          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
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
                    {cuotas && cuotas.length > 0 ? (
                      cuotas.map((cuota) => (
                        <Link
                          key={cuota.id}
                          href="/socio/pagoSocio"
                          className="px-6 py-4 hover:bg-gray-50 transition-colors block group"
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
                        </Link>
                      ))
                    ) : (
                      <div className="px-6 py-8 text-center">
                        <p className="text-gray-500 text-sm">No hay cuotas pendientes</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
