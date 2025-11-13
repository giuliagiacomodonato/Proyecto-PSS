"use client"

import { useEffect, useState } from 'react'
import Sidebar from '@/app/components/Sidebar'
import { useAdminProtection } from '@/app/hooks/useAdminProtection'
import { User, Trash2 } from 'lucide-react'
import ConfirmModal from '@/app/components/ConfirmModal'

type Reserva = {
  id: number
  canchaId: number
  fecha: string
  horaInicio: string
  reservado: boolean
  usuarioSocioId?: number | null
  usuarioSocio?: { dni?: string } | null
}

type CanchaOption = { id: number; nombre: string }

export default function GestionReservasPage() {
  const { isAuthorized, isChecking } = useAdminProtection()

  const [canchaId, setCanchaId] = useState('')
  const [fecha, setFecha] = useState('')
  const [turnos, setTurnos] = useState<Reserva[]>([])
  const [canchas, setCanchas] = useState<CanchaOption[]>([])
  const [loading, setLoading] = useState(false)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [mensajeTipo, setMensajeTipo] = useState<'success'|'error'|'info'>('info')

  const [page, setPage] = useState(1)
  const pageSize = 10
  const [total, setTotal] = useState(0)

  const [showConfirm, setShowConfirm] = useState(false)
  const [toCancel, setToCancel] = useState<Reserva | null>(null)

  useEffect(() => { cargarCanchas() }, [])

  async function cargarCanchas() {
    try {
      const res = await fetch('/api/canchas')
      if (!res.ok) throw new Error('Error cargando canchas')
      const data = await res.json()
      setCanchas(Array.isArray(data) ? data : data.canchas || [])
    } catch (e) {
      console.error(e)
      setMensaje('Error cargando canchas')
      setMensajeTipo('error')
    }
  }

  async function cargarTurnos(requestedPage = 1) {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (canchaId) params.set('canchaId', canchaId)
      if (fecha) params.set('fecha', fecha)
      params.set('limit', String(pageSize))
      params.set('offset', String((requestedPage - 1) * pageSize))
      const res = await fetch('/api/reservas?' + params.toString())
      if (!res.ok) throw new Error('Error al cargar reservas')
      const data = await res.json()
      setTurnos(data.turnos || [])
      setTotal(data.total ?? 0)
      setPage(requestedPage)
    } catch (e) {
      console.error(e)
      setMensaje('Error cargando reservas')
      setMensajeTipo('error')
    } finally {
      setLoading(false)
    }
  }

  function openCancelModal(r: Reserva) { setToCancel(r); setShowConfirm(true) }

  async function confirmCancel() {
    if (!toCancel) return
    try {
      const res = await fetch(`/api/reservas?id=${toCancel.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Error cancelando')
      setMensaje('Reserva cancelada correctamente')
      setMensajeTipo('success')
      setShowConfirm(false)
      setToCancel(null)
      cargarTurnos(1)
    } catch (e: any) {
      console.error(e)
      setMensaje(e?.message || 'Error desconocido')
      setMensajeTipo('error')
      setShowConfirm(false)
      setToCancel(null)
    }
  }

  if (isChecking) return <div className="flex items-center justify-center min-h-screen">Verificando permisos...</div>
  if (!isAuthorized) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Gestor Club Deportivo</h1>
            <div className="flex items-center gap-2 text-gray-600 bg-white px-3 py-2 rounded-full border border-gray-200">
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-sm">Usuario Admin</span>
            </div>
          </div>
          <div className="text-sm text-gray-500 mb-6">Panel Principal &gt; Reservas</div>
          <h2 className="text-2xl font-semibold text-gray-800">Gestión de Reservas</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Buscar Cancha</label>
              <select value={canchaId} onChange={(e)=>setCanchaId(e.target.value)} className="w-full px-3 py-2 border rounded">
                <option value="">Seleccione cancha</option>
                {canchas.map(c => <option key={c.id} value={String(c.id)}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Fecha</label>
              <input type="date" value={fecha} onChange={(e)=>setFecha(e.target.value)} className="w-full px-3 py-2 border rounded" />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { if (!canchaId || !fecha) { setMensaje('Debe seleccionar cancha y fecha antes de aplicar los filtros'); setMensajeTipo('error'); return } cargarTurnos(1) }}
                disabled={!canchaId || !fecha}
                className={`px-4 py-2 ${(!canchaId || !fecha) ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white'} rounded`}
              >
                Aplicar
              </button>
            </div>
          </div>

          {mensaje && (<div className="mb-4"><div className={`px-4 py-2 rounded text-sm ${mensajeTipo==='error' ? 'bg-red-100 text-red-800' : mensajeTipo==='success' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{mensaje}</div></div>)}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-2">Estado</th>
                  <th className="py-2">Horario</th>
                  <th className="py-2">DNI Socio</th>
                  <th className="py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {turnos.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-gray-500">No hay reservas</td></tr>
                ) : turnos.map(t => (
                  <tr key={t.id} className="border-b">
                    <td className="py-2">{t.reservado ? 'Reservado' : 'Disponible'}</td>
                    <td className="py-2">{t.horaInicio}</td>
                    <td className="py-2">{t.usuarioSocio?.dni ?? t.usuarioSocioId ?? '-'}</td>
                    <td className="py-2">{t.reservado && <button onClick={()=>openCancelModal(t)} className="inline-flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded"><Trash2 className="w-4 h-4" /> Cancelar</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">Mostrando {(page-1)*pageSize + 1} - {Math.min(page*pageSize, total)} de {total}</div>
            <div className="flex items-center gap-2">
              <button disabled={page<=1} onClick={()=>cargarTurnos(page-1)} className={`px-3 py-1 rounded ${page<=1 ? 'bg-gray-200 text-gray-400' : 'bg-white border'}`}>Anterior</button>
              <div className="px-3 py-1">Página {page} / {Math.max(1, Math.ceil(total/pageSize))}</div>
              <button disabled={page*pageSize >= total} onClick={()=>cargarTurnos(page+1)} className={`px-3 py-1 rounded ${(page*pageSize >= total) ? 'bg-gray-200 text-gray-400' : 'bg-white border'}`}>Siguiente</button>
            </div>
          </div>

          {showConfirm && toCancel && (
            <ConfirmModal title="Confirmar cancelación" onConfirm={confirmCancel} onCancel={()=>{setShowConfirm(false); setToCancel(null)}} confirmText="Confirmar cancelación">
              <div className="text-sm text-gray-700">
                <p>¿Está seguro que desea cancelar la reserva?</p>
                <p className="mt-2"><strong>Cancha:</strong> {canchas.find(c=>c.id===toCancel.canchaId)?.nombre ?? toCancel.canchaId}</p>
                <p><strong>Fecha:</strong> {new Date(toCancel.fecha).toLocaleDateString()}</p>
                <p><strong>Horario:</strong> {toCancel.horaInicio}</p>
              </div>
            </ConfirmModal>
          )}

        </div>
      </main>
    </div>
  )
}