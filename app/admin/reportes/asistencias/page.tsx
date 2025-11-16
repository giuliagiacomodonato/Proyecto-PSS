"use client"

import React, { useState, useEffect } from "react"
import { useAdminProtection } from "@/app/hooks/useAdminProtection"
import Sidebar from "@/app/components/Sidebar"
import { ArrowLeft, Download, Search, Filter, User } from "lucide-react"
import { useRouter } from "next/navigation"

interface Asistencia {
  id: number
  fecha: string
  practica: string
  socio: string
  socioDni: string
  estado: string
  entrenador: string
  inscripcionActiva: boolean
}

interface Metricas {
  asistenciaPromedio: number
  totalClases: number
  totalAsistencias: number
  totalAusencias: number
}

interface ReporteData {
  metricas: Metricas
  asistencias: Asistencia[]
  filtrosAplicados: {
    deporteId: string | null
    fechaDesde: string | null
    fechaHasta: string | null
    socioDni: string | null
  }
}

export default function ReportesAsistenciaPage() {
  const { isAuthorized, isChecking } = useAdminProtection()
  const router = useRouter()

  // Estados para filtros
  const [deportes, setDeportes] = useState<any[]>([])
  const [deportesFiltro, setDeportesFiltro] = useState<string[]>([])
  const [fechaDesde, setFechaDesde] = useState<string>("")
  const [fechaHasta, setFechaHasta] = useState<string>("")
  const [socioDni, setSocioDni] = useState<string>("")

  // Estados para datos
  const [reporteData, setReporteData] = useState<ReporteData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [filtrosAplicados, setFiltrosAplicados] = useState(false)

  // Cargar deportes disponibles
  useEffect(() => {
    const fetchDeportes = async () => {
      try {
        const res = await fetch('/api/practicas')
        if (res.ok) {
          const data = await res.json()
          setDeportes(data)
        }
      } catch (error) {
        console.error('Error al cargar deportes:', error)
      }
    }
    fetchDeportes()
  }, [])

  const handleToggleDeporte = (deporteId: string) => {
    setDeportesFiltro(prev => 
      prev.includes(deporteId) 
        ? prev.filter(id => id !== deporteId)
        : [...prev, deporteId]
    )
  }

  const handleAplicarFiltros = async () => {
    setLoading(true)
    setError("")
    
    try {
      // Construir query params
      const params = new URLSearchParams()
      
      // Si hay deportes seleccionados, usar el primero (o podrías hacer múltiples llamadas)
      if (deportesFiltro.length > 0) {
        params.append('deporteId', deportesFiltro[0])
      }
      
      if (fechaDesde) {
        params.append('fechaDesde', fechaDesde)
      }
      
      if (fechaHasta) {
        params.append('fechaHasta', fechaHasta)
      }
      
      if (socioDni.trim()) {
        params.append('socioDni', socioDni.trim())
      }

      const res = await fetch(`/api/reportes/asistencias?${params.toString()}`)
      
      if (!res.ok) {
        throw new Error('Error al obtener datos')
      }
      
      const data = await res.json()
      setReporteData(data)
      setFiltrosAplicados(true)
      
    } catch (err) {
      console.error('Error:', err)
      setError('Error al cargar los datos. Por favor, intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleExportarCSV = () => {
    if (!reporteData) return

    // Usar punto y coma como separador (compatible con Excel en locales ES)
    const sep = ';'
    const bom = '\uFEFF' // BOM para que Excel reconozca UTF-8
    const rows: string[] = []

    // Encabezados y métricas
    rows.push('REPORTE DE ASISTENCIAS')
    rows.push('')
    rows.push('METRICAS RESUMIDAS')
    rows.push(['Asistencia Promedio', `${reporteData.metricas.asistenciaPromedio}%`].join(sep))
    rows.push(['Total Clases/Practicas', `${reporteData.metricas.totalClases}`].join(sep))
    rows.push(['Total Asistencias', `${reporteData.metricas.totalAsistencias}`].join(sep))
    rows.push(['Total Ausencias', `${reporteData.metricas.totalAusencias}`].join(sep))
    rows.push('')

    // Encabezados de tabla
    rows.push(['Fecha', 'Practica', 'Socio', 'DNI', 'Estado', 'Entrenador'].join(sep))

    // Función auxiliar para escapar campos que contienen el separador o comillas
    const escapeField = (value: any) => {
      if (value === null || value === undefined) return ''
      const str = String(value)
      if (str.includes(sep) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    // Filas de datos
    reporteData.asistencias.forEach(asistencia => {
      const fecha = new Date(asistencia.fecha).toLocaleDateString('es-AR')
      const row = [fecha, asistencia.practica, asistencia.socio, asistencia.socioDni, asistencia.estado, asistencia.entrenador]
        .map(escapeField)
        .join(sep)
      rows.push(row)
    })

    // Construir contenido CSV con CRLF y BOM
    const csv = bom + rows.join('\r\n')

    // Descargar como Blob para asegurar encoding correcto
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reporte_asistencias_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Verificación de acceso
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Reportes de Asistencia</h1>
                <p className="text-sm text-gray-500 mt-1">Panel Principal &gt; Reportes Asistencia</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600 bg-white px-3 py-2 rounded-full border border-gray-200">
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-sm">Usuario Admin</span>
            </div>
          </div>
        </div>

        {/* Formulario de Filtros Avanzados */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Filtros Avanzados</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Filtro por Deporte */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Deporte
              </label>
              <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto bg-white">
                <label className="flex items-center gap-2 mb-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deportesFiltro.length === 0}
                    onChange={() => setDeportesFiltro([])}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Todos</span>
                </label>
                {deportes.map(deporte => (
                  <label key={deporte.id} className="flex items-center gap-2 mb-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deportesFiltro.includes(deporte.id.toString())}
                      onChange={() => handleToggleDeporte(deporte.id.toString())}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{deporte.nombre}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Filtro por Período de Tiempo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Período de Tiempo
              </label>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Desde</label>
                  <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                  />
                </div>
              </div>
            </div>

            {/* Filtro por Socio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por Socio
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ingrese DNI del socio"
                  value={socioDni}
                  onChange={(e) => setSocioDni(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 pl-10 text-sm text-gray-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                />
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>
          </div>

          <button
            onClick={handleAplicarFiltros}
            disabled={loading}
            className="w-full md:w-auto bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Cargando...' : 'Aplicar Filtros'}
          </button>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Resultados */}
        {filtrosAplicados && reporteData && (
          <>
            {/* Métricas Resumidas */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Métricas Resumidas</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Asistencia Promedio</div>
                  <div className="text-3xl font-bold text-blue-600">
                    {reporteData.metricas.asistenciaPromedio}%
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Total Clases/Prácticas</div>
                  <div className="text-3xl font-bold text-green-600">
                    {reporteData.metricas.totalClases}
                  </div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Total Asistencias</div>
                  <div className="text-3xl font-bold text-purple-600">
                    {reporteData.metricas.totalAsistencias}
                  </div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Total Ausencias</div>
                  <div className="text-3xl font-bold text-orange-600">
                    {reporteData.metricas.totalAusencias}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabla de Asistencia Detallada */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Tabla de Asistencia Detallada</h2>
                <button
                  onClick={handleExportarCSV}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exportar Reporte (CSV)
                </button>
              </div>

              {reporteData.asistencias.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No se encontraron registros de asistencia para los filtros aplicados.
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Intente ajustar los filtros o verifique que se hayan registrado asistencias.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Práctica (Deporte)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Socio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Entrenador
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reporteData.asistencias.map((asistencia) => (
                        <tr key={asistencia.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(asistencia.fecha).toLocaleDateString('es-AR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {asistencia.practica}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>{asistencia.socio}</div>
                            <div className="text-xs text-gray-500">DNI: {asistencia.socioDni}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                asistencia.estado === 'Presente'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {asistencia.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {asistencia.entrenador}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Mensaje inicial antes de aplicar filtros */}
        {!filtrosAplicados && !loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
            <p className="text-blue-800 text-lg font-medium mb-2">
              Seleccione los filtros y presione "Aplicar Filtros" para ver los reportes
            </p>
            <p className="text-blue-600 text-sm">
              Puede filtrar por deporte, período de tiempo y/o socio específico
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
