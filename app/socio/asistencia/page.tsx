'use client'

import { useEffect, useState } from 'react'
import Breadcrumb from '../../components/Breadcrumb'
import { Calendar, CheckCircle, XCircle } from 'lucide-react'

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
        
        if (inscripcionesData.inscripciones) {
          for (const inscripcion of inscripcionesData.inscripciones) {
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
      } catch (err) {
        console.error('Error al cargar asistencias:', err)
        setError('Error al cargar el historial de asistencias')
      } finally {
        setLoading(false)
      }
    }

    fetchAsistencias()
  }, [])

  const calcularEstadisticas = () => {
    if (asistencias.length === 0) return { total: 0, presentes: 0, ausentes: 0, porcentaje: 0 }

    const presentes = asistencias.filter(a => a.presente).length
    const ausentes = asistencias.filter(a => !a.presente).length
    const porcentaje = Math.round((presentes / asistencias.length) * 100)

    return {
      total: asistencias.length,
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
          { label: 'Asistencia', active: true }
        ]} />
        <h1 className="text-3xl font-bold text-gray-900">Mi Asistencia</h1>
        <p className="text-sm text-gray-500 mt-2">Consulte su registro de asistencia a las prácticas</p>
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
          {/* Estadísticas */}
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

          {/* Lista de asistencias */}
          {asistencias.length === 0 ? (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-8 text-center">
              <p className="text-xl text-gray-700 font-semibold">No hay registros de asistencia</p>
              <p className="text-gray-600 mt-2">Aún no se ha registrado ninguna asistencia a prácticas.</p>
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
                    {asistencias.map((asistencia) => (
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
