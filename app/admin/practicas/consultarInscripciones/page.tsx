"use client"

import React, { useEffect, useState } from 'react'
import Sidebar from '@/app/components/Sidebar'
import { useAdminProtection } from '@/app/hooks/useAdminProtection'
import { Input } from '@/app/components/input'
import { Button } from '@/app/components/button'
import { Eye } from 'lucide-react'

type Practica = {
  id: number
  nombre: string
  descripcion?: string
  precio: number
  cupo: number
  inscriptosActuales: number
  cuposDisponibles: number
  entrenador?: { id?: number; nombre?: string }
}

type InscripcionDetalle = {
  id: number
  usuarioSocio: { id: number; nombre: string; dni: string; email?: string }
}

export default function ConsultarInscripcionesPage() {
  const { isAuthorized, isChecking } = useAdminProtection()
  const [practicas, setPracticas] = useState<Practica[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // filtros
  const [nombreFilter, setNombreFilter] = useState('')
  const [entrenadorFilter, setEntrenadorFilter] = useState('')

  // detalle modal
  const [showDetalle, setShowDetalle] = useState(false)
  const [detallePractica, setDetallePractica] = useState<Practica | null>(null)
  const [inscriptosDetalle, setInscriptosDetalle] = useState<InscripcionDetalle[]>([])
  const [detalleLoading, setDetalleLoading] = useState(false)
  const [detalleError, setDetalleError] = useState<string | null>(null)

  useEffect(() => {
    if (isChecking) return
    if (!isAuthorized) return
    fetchPracticas()
  }, [isChecking, isAuthorized])

  const fetchPracticas = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/practicas/inscripciones')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al obtener prácticas')
      setPracticas(data.practicas || [])
    } catch (e: any) {
      setError(e.message || 'Error al obtener prácticas')
    } finally {
      setLoading(false)
    }
  }

  const filtered = practicas.filter((p) => {
    const nombreMatch = p.nombre.toLowerCase().includes(nombreFilter.toLowerCase())
    const entrenadorName = p.entrenador?.nombre || ''
    const entrenadorMatch = entrenadorName.toLowerCase().includes(entrenadorFilter.toLowerCase())
    return nombreMatch && entrenadorMatch
  })


  const openDetalle = async (p: Practica) => {
    setDetalleError(null)
    setDetalleLoading(true)
    setDetallePractica(p)
    setShowDetalle(true)
    try {
      const res = await fetch(`/api/practicas/inscripciones?practicaId=${p.id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al obtener detalle')
      setInscriptosDetalle(data.inscripciones || [])
    } catch (e: any) {
      setDetalleError(e.message || 'Error al obtener detalle')
    } finally {
      setDetalleLoading(false)
    }
  }

  const exportCsv = () => {
    if (!detallePractica) return
    const sep = ';'
    const bom = '\uFEFF'
    const header = ['DNI de Socio', 'Nombre', 'Email']

    const escapeField = (value: any) => {
      if (value === null || value === undefined) return ''
      const str = String(value)
      if (str.includes(sep) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const rows = inscriptosDetalle.map((i) => [i.usuarioSocio.dni, i.usuarioSocio.nombre, i.usuarioSocio.email || ''].map(escapeField).join(sep))
    const csv = bom + [header.join(sep), ...rows].join('\r\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${detallePractica.nombre.replace(/\s+/g,'_')}_inscriptos.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (isChecking) return <div className="p-8">Comprobando permisos...</div>
  if (!isAuthorized) return null

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Consultar Prácticas</h1>

          {/* Filtros */}
          <div className="flex gap-3 mb-4">
            <div className="w-1/3">
              <label className="block text-sm text-gray-700">Buscar práctica por nombre</label>
              <Input value={nombreFilter} onChange={(e) => setNombreFilter(e.target.value)} placeholder="Nombre práctica" />
            </div>
            <div className="w-1/3">
              <label className="block text-sm text-gray-700">Buscar práctica por entrenador</label>
              <Input value={entrenadorFilter} onChange={(e) => setEntrenadorFilter(e.target.value)} placeholder="Nombre entrenador" />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => { setNombreFilter(''); setEntrenadorFilter('') }}>Limpiar</Button>
            </div>
          </div>

        
          <div className="bg-white rounded-lg p-6 shadow">
            {loading ? (
              <div>Cargando prácticas...</div>
            ) : error ? (
              <div className="text-red-600">{error}</div>
            ) : practicas.length === 0 ? (
              <div className="text-gray-600">Aún no hay prácticas registradas. Puede crear una nueva desde 'Registrar Práctica'.</div>
            ) : (
              <table className="w-full text-left table-fixed">
                <thead>
                  <tr className="text-sm text-gray-600">
                    <th className="w-1/4 py-2">Nombre</th>
                    <th className="w-1/6 py-2">Entrenador</th>
                    <th className="w-1/6 py-2">Cupo Máximo</th>
                    <th className="w-1/6 py-2">Inscriptos</th>
                    <th className="w-1/6 py-2">Cupo Disponible</th>
                    <th className="w-1/6 py-2">Precio</th>
                    <th className="w-1/12 py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="py-3 text-sm text-black">{p.nombre}</td>
                      <td className="py-3 text-sm text-gray-600">{p.entrenador?.nombre || 'Sin entrenador'}</td>
                      <td className="py-3 text-sm text-gray-600">{p.cupo}</td>
                      <td className="py-3 text-sm text-gray-600">{p.inscriptosActuales}</td>
                      <td className="py-3 text-sm text-gray-600">{p.cuposDisponibles}</td>
                      <td className="py-3 text-sm text-gray-600">${p.precio.toFixed(2)}</td>
                      <td className="py-3 text-sm">
                        <button onClick={() => openDetalle(p)} className="text-blue-600 flex items-center gap-2">
                          <Eye size={16} /> Ver Detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Detalle Modal */}
        {showDetalle && detallePractica && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-auto">
            <div className="bg-white w-full max-w-3xl rounded-lg shadow-lg p-6 mt-10">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-black">{detallePractica.nombre}</h2>
                  <div className="mt-2 flex items-center gap-6 text-sm text-gray-700">
                    <div><span className="font-medium text-gray-900">Entrenador:</span> {detallePractica.entrenador?.nombre || 'Sin entrenador'}</div>
                    <div><span className="font-medium text-gray-900">Cupo Máximo:</span> {detallePractica.cupo}</div>
                    <div><span className="font-medium text-gray-900">Inscriptos:</span> {detallePractica.inscriptosActuales}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowDetalle(false)}>Cerrar</Button>
                </div>
              </div>

              <div className="mt-4">
                {detalleLoading ? (
                  <div>Cargando inscriptos...</div>
                ) : detalleError ? (
                  <div className="text-red-600">{detalleError}</div>
                ) : inscriptosDetalle.length === 0 ? (
                  <div className="text-gray-600">No hay socios inscriptos en esta práctica.</div>
                ) : (
                  <table className="w-full text-left table-fixed mt-2">
                    <thead>
                      <tr className="text-sm text-gray-600">
                        <th className="py-2">DNI socio</th>
                        <th className="py-2">Nombre</th>
                        <th className="py-2">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inscriptosDetalle.map((i) => (
                        <tr key={i.id} className="border-t">
                          <td className="py-3 text-sm text-gray-800">{i.usuarioSocio.dni}</td>
                          <td className="py-3 text-sm text-gray-800">{i.usuarioSocio.nombre}</td>
                          <td className="py-3 text-sm text-gray-600">{i.usuarioSocio.email || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} className="py-3">
                          <div className="flex justify-begin">
                            <Button variant="outline" onClick={exportCsv}>Exportar Reporte</Button>
                          </div>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
