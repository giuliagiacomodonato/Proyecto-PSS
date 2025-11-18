'use client'

import { useEffect, useState } from 'react'
import Breadcrumb from '../../components/Breadcrumb'
import { Calendar, CheckCircle, XCircle, Filter } from 'lucide-react'

interface AsistenciaRecord {
  id: number
  fecha: string
  presente: boolean
  practicaDeportiva: {
    nombre: string
  }
}

export default function AsistenciaPage() {
  const [loading, setLoading] = useState(true)
  const [asistencias, setAsistencias] = useState<AsistenciaRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [practicaSeleccionada, setPracticaSeleccionada] = useState<string>('todas')
  const [practicasDisponibles, setPracticasDisponibles] = useState<string[]>([])

  useEffect(() => {
    const fetchAsistencias = async () => {
      setLoading(true)

      const usuarioRaw = typeof window !== 'undefined' ? localStorage.getItem('usuario') : null
      if (!usuarioRaw) {
        if (typeof window !== 'undefined') window.location.href = '/'
        return
      }

      try {
        const usuario = JSON.parse(usuarioRaw)

        // Obtener inscripciones del socio
        const inscripcionesRes = await fetch(`/api/socios/${usuario.id}/inscripciones`)
        if (!inscripcionesRes.ok) {
          throw new Error('Error al obtener inscripciones')
        }

        const inscripcionesData = await inscripcionesRes.json()
        
        // Recopilar todas las asistencias de todas las inscripciones
        const todasAsistencias: AsistenciaRecord[] = []
        const practicasInscriptas: string[] = []
        
        if (inscripcionesData.inscripciones) {
          for (const inscripcion of inscripcionesData.inscripciones) {
            // Agregar la práctica a la lista de inscritas
            if (inscripcion.practicaDeportiva?.nombre) {
              practicasInscriptas.push(inscripcion.practicaDeportiva.nombre)
            }
            
            // Agregar asistencias si existen
            if (inscripcion.asistencias) {
              inscripcion.asistencias.forEach((asist: any) => {
                todasAsistencias.push({
                  id: asist.id,
                  fecha: asist.fecha,
                  presente: asist.presente,
                  practicaDeportiva: {
                    nombre: inscripcion.practicaDeportiva.nombre,
                  },
                })
              })
            }
          }
        }

        // Ordenar por fecha descendente (más reciente primero)
        todasAsistencias.sort((a, b) => 
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        )

        setAsistencias(todasAsistencias)
        
        // Usar las prácticas inscritas (no solo las que tienen asistencias)
        const practicasUnicas = Array.from(new Set(practicasInscriptas)).sort()
        setPracticasDisponibles(practicasUnicas)
      } catch (err) {
        console.error('Error al cargar asistencias:', err)
        setError('Error al cargar el historial de asistencias')
      } finally {
        setLoading(false)
      }
    }

    fetchAsistencias()
  }, [])

  // Filtrar asistencias según la práctica seleccionada
  const asistenciasFiltradas = practicaSeleccionada === 'todas'
    ? asistencias
    : asistencias.filter(a => a.practicaDeportiva.nombre === practicaSeleccionada)

  const calcularEstadisticas = () => {
    const dataParaCalcular = asistenciasFiltradas
    
    if (dataParaCalcular.length === 0) return { total: 0, presentes: 0, ausentes: 0, porcentaje: 0 }

    const presentes = dataParaCalcular.filter(a => a.presente).length
    const ausentes = dataParaCalcular.filter(a => !a.presente).length
    const porcentaje = Math.round((presentes / dataParaCalcular.length) * 100)

    return {
      total: dataParaCalcular.length,
      presentes,
      ausentes,
      porcentaje,
    }
  }

  const stats = calcularEstadisticas()

  return (
    <>
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Panel Principal', href: '/socio' },
          { label: 'Mi Historial de Asistencia', active: true }
        ]} />
        <h1 className="text-3xl font-bold text-gray-900">Mi Historial de Asistencia</h1>
        <p className="text-sm text-gray-500 mt-2">Consulte su registro de asistencia a las prácticas deportivas</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-gray-500">Cargando historial de asistencias...</div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-2 border-red-400 rounded-lg p-8 text-center">
          <p className="text-xl text-red-700 font-semibold">{error}</p>
        </div>
      ) : (
        <>
          {/* Filtro por Práctica */}
          {practicasDisponibles.length > 0 && (
            <div className="mb-6">
              <label htmlFor="filtro-practica" className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Filter size={16} />
                Filtrar por Práctica
              </label>
              <select
                id="filtro-practica"
                value={practicaSeleccionada}
                onChange={(e) => setPracticaSeleccionada(e.target.value)}
                className="w-full md:w-80 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="todas">Ver Todas</option>
                {practicasDisponibles.map((practica) => (
                  <option key={practica} value={practica}>
                    {practica}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Panel de Resumen */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {practicaSeleccionada === 'todas' 
                ? 'Asistencia (todas las prácticas)' 
                : `Asistencia en ${practicaSeleccionada}`}
            </h2>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-blue-900">{stats.porcentaje}%</span>
              <span className="text-gray-600">
                ({stats.presentes} de {stats.total} clase{stats.total !== 1 ? 's' : ''})
              </span>
            </div>
          </div>

          {/* Estadísticas Detalladas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium">Total de Clases</p>
              <p className="text-3xl font-bold text-blue-900 mt-1">{stats.total}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium">Presentes</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{stats.presentes}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600 font-medium">Ausentes</p>
              <p className="text-3xl font-bold text-red-900 mt-1">{stats.ausentes}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-600 font-medium">Porcentaje</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{stats.porcentaje}%</p>
            </div>
          </div>

          {/* Historial Detallado */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Historial Detallado</h3>
            <p className="text-sm text-gray-500">Registros ordenados del más reciente al más antiguo</p>
          </div>

          {/* Lista de asistencias */}
          {asistenciasFiltradas.length === 0 ? (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-8 text-center">
              <p className="text-xl text-gray-700 font-semibold">
                {asistencias.length === 0 
                  ? 'Aún no tienes registros de asistencia' 
                  : `Aún no se han registrado asistencias en ${practicaSeleccionada}`}
              </p>
              <p className="text-gray-600 mt-2">
                {asistencias.length === 0
                  ? 'El entrenador aún no ha cargado ninguna asistencia para ti.'
                  : `El entrenador todavía no ha registrado tu asistencia a las clases de ${practicaSeleccionada}.`}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Fecha
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Práctica
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {asistenciasFiltradas.map((asistencia) => (
                      <tr key={asistencia.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-gray-500" />
                            {new Date(asistencia.fecha).toLocaleDateString('es-AR', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {asistencia.practicaDeportiva.nombre}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                              asistencia.presente
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {asistencia.presente ? (
                              <>
                                <CheckCircle size={16} />
                                Presente
                              </>
                            ) : (
                              <>
                                <XCircle size={16} />
                                Ausente
                              </>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}
