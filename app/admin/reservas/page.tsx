"use client"

import { useEffect, useState } from 'react'
import Sidebar from '@/app/components/Sidebar'
import { useAdminProtection } from '@/app/hooks/useAdminProtection'
import { User, Trash2, AlertTriangle } from 'lucide-react'

type Reserva = {
  id: number
  canchaId: number
  fecha: string
  horaInicio: string
  reservado: boolean
  usuarioSocioId?: number | null
  usuarioSocio?: { dni?: string; nombre?: string } | null
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
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const headers: any = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch('/api/reservas?' + params.toString(), { headers })
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

  // Cargar disponibilidad: obtiene horarios configurados y los combina con reservas del día
  async function cargarDisponibilidad() {
    if (!canchaId || !fecha) return
    setLoading(true)
    setMensaje(null)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const headers: any = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      // Obtener horarios configurados para la cancha
      const resHor = await fetch(`/api/horarios?canchaId=${canchaId}`, { headers })
      if (!resHor.ok) {
        const err = await resHor.json().catch(() => ({}))
        throw new Error(err?.message || 'Error al obtener horarios')
      }
      const { horarios } = await resHor.json()

      if (!horarios || horarios.length === 0) {
        setTurnos([])
        setTotal(0)
        setMensaje('Esta cancha no está habilitada para alquileres en la fecha seleccionada')
        setMensajeTipo('info')
        setLoading(false)
        return
      }

      // Obtener turnos existentes para la cancha y fecha
      const params = new URLSearchParams()
      params.set('canchaId', canchaId)
      params.set('fecha', fecha)
      const resTurnos = await fetch('/api/reservas?' + params.toString(), { headers })
      if (!resTurnos.ok) throw new Error('Error al obtener turnos')
      const data = await resTurnos.json()
      const existingTurnos: any[] = data.turnos || []

      // Combinar horarios con turnos existentes
      const combined = horarios.map((h: any, idx: number) => {
        const match = existingTurnos.find(t => t.horaInicio === h.horaInicio)
        return {
          id: idx + 1,
          canchaId: Number(canchaId),
          fecha,
          horaInicio: h.horaInicio,
          reservado: Boolean(match?.reservado),
          usuarioSocio: match?.usuarioSocio ?? null
        }
      })

      setTurnos(combined)
      setTotal(combined.length)
      setPage(1)
    } catch (e: any) {
      console.error(e)
      setMensaje(e?.message || 'Error cargando disponibilidad')
      setMensajeTipo('error')
    } finally {
      setLoading(false)
    }
  }

  function openCancelModal(r: Reserva) { setToCancel(r); setShowConfirm(true) }

  async function confirmCancel() {
    if (!toCancel) return
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const headers: any = {}
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`/api/reservas?id=${toCancel.id}`, { method: 'DELETE', headers })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Error cancelando')
      // eliminar fila localmente para actualización instantánea
      const cancelledId = toCancel.id
      setTurnos(prev => prev.filter(t => t.id !== cancelledId))
      setMensaje('Reserva cancelada correctamente y socio notificado con éxito')
      setMensajeTipo('success')
      setShowConfirm(false)
      setToCancel(null)
      // refrescar desde servidor (asegurar consistencia)
      cargarTurnos(1)
    } catch (e: any) {
      console.error(e)
      setMensaje(e?.message || 'Error desconocido')
      setMensajeTipo('error')
      setShowConfirm(false)
      setToCancel(null)
    }
  }

  // Determina el estado de la reserva según fecha/hora actual
  function getEstadoReserva(r: Reserva) {
    if (!r.reservado) return 'Disponible'
    try {
      // Soporta dos formatos de `r.fecha`:
      // - ISO con hora y zona, p.ej. 2025-11-15T03:00:00.000Z
      // - solo fecha YYYY-MM-DD
      let dateObj: Date
      if (typeof r.fecha === 'string' && r.fecha.includes('T')) {
        // parseo ISO y luego extraigo la fecha local
        const parsed = new Date(r.fecha)
        if (isNaN(parsed.getTime())) throw new Error('Fecha inválida')
        dateObj = parsed
      } else {
        const fechaParts = (r.fecha || '').split('-').map(Number)
        if (fechaParts.length !== 3) throw new Error('Fecha inválida')
        const [y, m, d] = fechaParts
        dateObj = new Date(y, (m || 1) - 1, d)
      }

      // ahora extraer componentes locales (year, month, day)
      const y = dateObj.getFullYear()
      const m = dateObj.getMonth() + 1
      const d = dateObj.getDate()

      // parsear horaInicio (HH:mm[:ss] o H:mm)
      let hh = 0, mm = 0, ss = 0
      if (r.horaInicio) {
        const timeParts = r.horaInicio.split(':').map(Number)
        hh = Number.isFinite(timeParts[0]) ? timeParts[0] : 0
        mm = Number.isFinite(timeParts[1]) ? timeParts[1] : 0
        ss = Number.isFinite(timeParts[2]) ? timeParts[2] : 0
      }

      const start = new Date(y, m - 1, d, hh, mm, ss)
      const end = new Date(start.getTime() + 60 * 60 * 1000) // duración 1 hora
      const now = new Date()

      if (now >= start && now < end) return 'En uso'
      if (now < start) return 'Activa'
      return 'Finalizada'
    } catch (e) {
      console.error('Error calculando estado reserva', e)
      return r.reservado ? 'Reservado' : 'Disponible'
    }
  }

  // Auto-dismiss del banner de mensaje después de 5 segundos
  useEffect(() => {
    if (!mensaje) return
    const id = window.setTimeout(() => {
      setMensaje(null)
    }, 5000)
    return () => clearTimeout(id)
  }, [mensaje])

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
              <label className="block text-sm text-gray-900 mb-1">Buscar Cancha</label>
              <select value={canchaId} onChange={(e)=>setCanchaId(e.target.value)} className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-400">
                <option value="">Seleccione cancha</option>
                {canchas.map(c => <option key={c.id} value={String(c.id)}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-900 mb-1">Fecha</label>
              <input type="date" value={fecha} onChange={(e)=>setFecha(e.target.value)} className="w-full px-3 py-2 border rounded text-gray-900 placeholder-gray-400" />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { if (!canchaId || !fecha) { setMensaje('Debe seleccionar cancha y fecha antes de aplicar los filtros'); setMensajeTipo('error'); return } cargarDisponibilidad() }}
                disabled={!canchaId || !fecha}
                className={`px-4 py-2 ${(!canchaId || !fecha) ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white'} rounded`}
              >
                Aplicar
              </button>
            </div>
          </div>

          {/* Métricas centralizadas en el Dashboard principal (Admin) */}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                  <tr className="text-left text-gray-800 border-b">
                    <th className="py-2 text-gray-800">Estado</th>
                    <th className="py-2 text-gray-800">Horario</th>
                    <th className="py-2 text-gray-800">DNI / Nombre</th>
                    <th className="py-2 text-gray-800">Acciones</th>
                  </tr>
              </thead>
              <tbody>
                {!canchaId || !fecha ? (
                  <tr><td colSpan={4} className="py-6 text-gray-500">Seleccione una cancha y una fecha para ver la disponibilidad.</td></tr>
                ) : turnos.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-gray-500">Esta cancha no está habilitada para alquileres en la fecha seleccionada.</td></tr>
                ) : turnos.map(t => (
                  <tr key={t.id} className="border-b">
                    <td className="py-2">
                      {t.reservado ? (
                        <span className="inline-flex items-center px-2 py-1 rounded text-sm bg-red-100 text-red-800">Reservado</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded text-sm bg-green-100 text-green-800">Disponible</span>
                      )}
                    </td>
                    <td className="py-2 text-gray-900">{t.horaInicio}</td>
                    <td className="py-2 text-gray-900">{t.reservado ? `${t.usuarioSocio?.dni ?? '-'}${t.usuarioSocio?.nombre ? ' — ' + t.usuarioSocio.nombre : ''}` : '-'}</td>
                    <td className="py-2">{t.reservado && getEstadoReserva(t) === 'Activa' && <button onClick={()=>openCancelModal(t)} className="inline-flex items-center gap-2 px-3 py-1 bg-red-600 text-white rounded"><Trash2 className="w-4 h-4" /> Cancelar</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {mensaje && (
            <div className="mt-6 flex justify-center">
              <div className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${mensajeTipo === 'error' ? 'bg-red-100 text-red-800' : mensajeTipo === 'success' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                {mensaje}
              </div>
            </div>
          )}

          {showConfirm && toCancel && (
            <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-2xl max-w-md w-full transform transition-all">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-red-100 rounded-full">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Confirmar cancelación</h3>
                  </div>

                  <p className="text-gray-600 mb-6">¿Está seguro que desea eliminar la reserva?</p>

                  <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Reserva a cancelar:</p>
                    <p className="font-semibold text-gray-900 text-lg">{canchas.find(c=>c.id===toCancel.canchaId)?.nombre ?? toCancel.canchaId}</p>
                    <p className="text-sm text-gray-600 mt-1">Fecha: {new Date(toCancel.fecha).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-600 mt-1">Horario: {toCancel.horaInicio}</p>
                    <p className="text-sm text-gray-600 mt-1">DNI Socio: {toCancel.usuarioSocio?.dni ?? toCancel.usuarioSocioId ?? '-'}</p>
                  </div>

                  <p className="text-gray-600 mb-6">Advertencia: se enviará una notificación automática por email al socio informando la cancelación.</p>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={confirmCancel}
                      className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      Confirmar
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowConfirm(false); setToCancel(null) }}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}