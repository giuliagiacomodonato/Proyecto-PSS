"use client"

import React, { useEffect, useState, useRef } from "react"
import { useAdminProtection } from "@/app/hooks/useAdminProtection"
// Update the import path to the correct location of Sidebar
import Sidebar from "../components/Sidebar"
import { Users, CreditCard, Calendar, CheckSquare, ChevronDown, ChevronUp, User } from "lucide-react"

type Metric = { label: string; value: string | number | null }

function MetricPanel({
  title,
  icon,
  metrics,
  detailsUrl,
  children,
}: {
  title: string
  icon: React.ReactNode
  metrics: Metric[]
  detailsUrl?: string
  children?: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dataAvailable, setDataAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true
    // Intentar validar disponibilidad de datos al montar (simulación):
    if (!detailsUrl) {
      setDataAvailable(null)
      return
    }

    const check = async () => {
      setLoading(true)
      try {
        const res = await fetch(detailsUrl, { cache: "no-store" })
        if (!mounted) return
        if (!res.ok) throw new Error("no data")
        setDataAvailable(true)
      } catch (err) {
        if (!mounted) return
        setDataAvailable(false)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    check()

    // Poll cada 10s mientras el panel esté montado
    const t = setInterval(() => check(), 10000)
    return () => {
      mounted = false
      clearInterval(t)
    }
  }, [detailsUrl])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between p-4"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className="text-gray-800">{icon}</div>
          <div>
            <div className="text-sm font-medium text-gray-900">{title}</div>
            <div className="text-xs text-gray-800">Haz clic para ver detalles</div>
          </div>
        </div>
        <div className="text-gray-800">{open ? <ChevronUp /> : <ChevronDown />}</div>
      </button>

      <div className="px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="p-3 bg-gray-50 rounded">
              <div className="text-xs text-gray-900">{m.label}</div>
              <div className="text-lg font-semibold text-gray-900">
                {m.value === null ? (
                  <span className="text-gray-400">—</span>
                ) : (
                  m.value
                )}
              </div>
            </div>
          ))}
        </div>

        {open && (
          <div className="mt-4 p-3 border-t border-gray-100">
            {children ? (
              children
            ) : (
              <div className="text-sm text-gray-800">No hay detalles para mostrar.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  // ✅ Verificar que sea admin ANTES de renderizar
  const { isAuthorized, isChecking } = useAdminProtection()

  // Reservas métricas (migradas desde la página de reservas)
  const [reservasTurnos, setReservasTurnos] = useState<any[]>([])
  const [loadingReservas, setLoadingReservas] = useState(false)
  // Métricas específicas del día
  const [reservasActivasHoy, setReservasActivasHoy] = useState<number | null>(null)
  const [totalTurnosHoy, setTotalTurnosHoy] = useState<number | null>(null)
  const [loadingMetrics, setLoadingMetrics] = useState(false)

  useEffect(() => {
    if (!isAuthorized) return
    let mounted = true
    const fetchReservas = async () => {
      setLoadingReservas(true)
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
        const headers: any = {}
        if (token) headers['Authorization'] = `Bearer ${token}`
        const res = await fetch('/api/reservas', { headers, cache: 'no-store' })
        if (!mounted) return
        if (!res.ok) throw new Error('No se pudieron cargar reservas')
        const data = await res.json()
        // la ruta puede devolver { turnos, total } o directamente un array
        setReservasTurnos(Array.isArray(data) ? data : data.turnos || [])
      } catch (err) {
        console.error('Error cargando métricas de reservas', err)
      } finally {
        if (mounted) setLoadingReservas(false)
      }
    }

    fetchReservas()
    return () => { mounted = false }
  }, [isAuthorized])

  // mounted ref para evitar actualizar estado después del unmount
  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  // calcular métricas iniciales al montar (usa hoy si no hay filtro)
  useEffect(() => {
    if (!isAuthorized) return
    calcularMetricsFiltro()
  }, [isAuthorized])

  // función reutilizable visible en el scope del componente para calcular métricas según el filtro `from`/`to`
  const calcularMetricsFiltro = async (startStr?: string, endStr?: string) => {
    if (!isAuthorized) return
    setLoadingMetrics(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const headers: any = {}
      if (token) headers['Authorization'] = `Bearer ${token}`

      const startDateStr = startStr ?? from ?? new Date().toISOString().slice(0, 10)
      const endDateStr = endStr ?? to ?? startDateStr
      const start = new Date(startDateStr + 'T00:00:00')
      const end = new Date(endDateStr + 'T00:00:00')
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
        setReservasActivasHoy(null)
        setTotalTurnosHoy(null)
        setLoadingMetrics(false)
        return
      }

      const msPerDay = 24 * 60 * 60 * 1000
      const days = Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1

      // 1) obtener canchas y sus horarios (HorarioCancha)
      const canchasRes = await fetch('/api/canchas', { headers, cache: 'no-store' })
      const canchasData = await canchasRes.json()
      const canchas = Array.isArray(canchasData) ? canchasData : canchasData.canchas || []

      const horariosPromises = canchas.map((c: any) =>
        fetch(`/api/horarios?canchaId=${c.id}`, { headers, cache: 'no-store' })
          .then(r => r.ok ? r.json().catch(() => ({ horarios: [] })) : ({ horarios: [] }))
          .catch(() => ({ horarios: [] }))
      )
      const horariosResults = await Promise.all(horariosPromises)
      const horarioCanchaPerDay = horariosResults.reduce((acc: number, res: any) => acc + (res.horarios?.length || 0), 0)

      // 2) obtener practicas y sus horarios (tabla Horario)
      const practicasRes = await fetch('/api/practicas', { headers, cache: 'no-store' })
      const practicasData = await practicasRes.json()
      const practicas = Array.isArray(practicasData) ? practicasData : practicasData.practicas || []
      // cantidad total de horarios de cancha por día (asumimos que HorarioCancha se repite cada día)
      // ya calculado en `horarioCanchaPerDay`.

      // Para prácticas, los horarios tienen un campo `dia` (DiaSemana). Debemos contar
      // sólo los horarios de práctica que coinciden con cada fecha dentro del rango.
      const diaNames = ["DOMINGO", "LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"]

      // recorrer cada día del rango y contar cuántos horarios de práctica aplican
      let practicasHorariosInRange = 0
      for (let i = 0; i < days; i++) {
        const d = new Date(start.getTime() + i * msPerDay)
        const diaName = diaNames[d.getDay()]
        // contar todos los horarios de todas las prácticas cuyo `dia` coincide
        const countForDay = practicas.reduce((acc: number, p: any) => {
          if (!Array.isArray(p.horarios)) return acc
          return acc + p.horarios.filter((h: any) => (h.dia || h.diaSemana || h.dia?.toUpperCase?.()) === diaName).length
        }, 0)
        practicasHorariosInRange += countForDay
      }

      // total de horarios en el rango = (horarios de canchas por día * dias) + totales de prácticas dentro del rango
      const totalHorariosInRange = (horarioCanchaPerDay * days) + practicasHorariosInRange
      if (!mountedRef.current) return
      // Mostrar cálculo en consola para debugging: desglose de turnos y reservas y fórmula de ocupación
      setTotalTurnosHoy(totalHorariosInRange)

      const resReservas = await fetch(`/api/reservas?limit=10000`, { headers, cache: 'no-store' })
      let reservasCount = 0
      if (resReservas.ok) {
        const data = await resReservas.json()
        const turnos = Array.isArray(data) ? data : data.turnos || []
        reservasCount = turnos.filter((t: any) => {
          if (!t.reservado) return false
          const d = new Date(t.fecha)
          if (isNaN(d.getTime())) return false
          const fechaOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate())
          return fechaOnly.getTime() >= start.getTime() && fechaOnly.getTime() <= end.getTime()
        }).length
      }
      if (!mountedRef.current) return
      // calcular ocupación (reservas / turnos_totales * 100) y loggear valores
      const ocupacion = totalHorariosInRange > 0 ? (reservasCount / totalHorariosInRange) * 100 : null
      console.log('[Metrics] calcularMetricsFiltro', {
        from: startDateStr,
        to: endDateStr,
        days,
        totalTurnosHoy: totalHorariosInRange,
        reservasActivasHoy: reservasCount,
        ocupacion: ocupacion !== null ? `${ocupacion}%` : 'N/A',
      })
      setReservasActivasHoy(reservasCount)
    } catch (err) {
      console.error('Error calculando métricas del filtro', err)
      setReservasActivasHoy(null)
      setTotalTurnosHoy(null)
    } finally {
      if (mountedRef.current) setLoadingMetrics(false)
    }
  }

  const [from, setFrom] = useState<string>("")
  const [to, setTo] = useState<string>("")
  
  // Estado para Métricas Asistencias
  const [deportes, setDeportes] = useState<any[]>([])
  const [deporteSeleccionado, setDeporteSeleccionado] = useState<string>("")
  const [porcentajeAsistencia, setPorcentajeAsistencia] = useState<number | null>(null)
  const [loadingAsistencia, setLoadingAsistencia] = useState(false)
  
  // Cargar lista de deportes al montar
  useEffect(() => {
    const fetchDeportes = async () => {
      try {
        const res = await fetch('/api/practicas')
        if (res.ok) {
          const data = await res.json()
          setDeportes(data)
          if (data.length > 0) {
            setDeporteSeleccionado(data[0].id.toString())
          }
        }
      } catch (error) {
        console.error('Error al cargar deportes:', error)
      }
    }
    fetchDeportes()
  }, [])
  
  // Cargar porcentaje de asistencia cuando cambia el deporte
  useEffect(() => {
    if (!deporteSeleccionado) return
    
    const fetchAsistencia = async () => {
      setLoadingAsistencia(true)
      try {
        const res = await fetch(
          `/api/reportes/asistencias?resumenRapido=true&deporteId=${deporteSeleccionado}`
        )
        if (res.ok) {
          const data = await res.json()
          setPorcentajeAsistencia(data.porcentaje)
        }
      } catch (error) {
        console.error('Error al cargar asistencia:', error)
      } finally {
        setLoadingAsistencia(false)
      }
    }
    fetchAsistencia()
  }, [deporteSeleccionado])

  // ✅ Mostrar pantalla de carga mientras verifica
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-800">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  // ✅ No renderizar nada si no está autorizado
  if (!isAuthorized) {
    return null
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8">
        {/* Top header (site title + user) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Gestor Club Deportivo</h1>
            <div className="flex items-center gap-2 text-gray-800 bg-white px-3 py-2 rounded-full border border-gray-200">
              <User className="w-5 h-5 text-gray-800" />
              <span className="text-sm">Usuario Admin</span>
            </div>
          </div>

          <div className="text-sm text-gray-800 mb-4">Panel Principal</div>

          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Métricas del Club</h2>

          {/* Filtro por Fecha - caja blanca amplia */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 max-w-4xl">
            <div className="text-sm text-gray-800 mb-3 font-medium">Filtro por Fecha</div>
            <div className="flex items-center gap-4">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              />
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              />
              <button
                onClick={() => calcularMetricsFiltro(from, to)}
                className="ml-auto bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-900 transition-colors"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>

        <section>
          <MetricPanel
            title="Métricas Socios"
            icon={<Users size={20} />}
            metrics={[
              { label: "Total Socios", value: "—" },
              { label: "Nuevos Socios", value: "—" },
              { label: "Socios Activos", value: "—" },
              { label: "Familias", value: "—" },
              { label: "Individuales", value: "—" },
            ]}
            detailsUrl="/api/socios"
          >
            <div className="space-y-2">
              <div className="text-sm text-gray-800">Lista de socios (layout de ejemplo)</div>
              <ul className="text-sm">
                <li>Socio 1 — Acción</li>
                <li>Socio 2 — Acción</li>
                <li>Socio 3 — Acción</li>
              </ul>
            </div>
          </MetricPanel>

          <MetricPanel
            title="Métricas Pagos"
            icon={<CreditCard size={20} />}
            metrics={[
              { label: "Ingresos Totales", value: "—" },
              { label: "Pagos Pendientes", value: "—" },
              { label: "Por cuotas", value: "—" },
              { label: "Por actividades", value: "—" },
              { label: "Por alquileres", value: "—" },
            ]}
            detailsUrl="/api/pagos"
          >
            <div className="text-sm text-gray-800">Detalle de pagos (layout)</div>
          </MetricPanel>

          <MetricPanel
            title="Métricas Alquileres"
            icon={<Calendar size={20} />}
            metrics={[
              { label: 'Reservas', value: loadingMetrics ? 'Cargando...' : (reservasActivasHoy !== null ? reservasActivasHoy : '—') },
              { label: 'Ocupación', value: loadingMetrics ? 'Cargando...' : (totalTurnosHoy && totalTurnosHoy > 0 && reservasActivasHoy !== null ? `${Math.round((reservasActivasHoy / totalTurnosHoy) * 100)}%` : '—') },
            ]}
            detailsUrl="/api/reservas"
          >
          </MetricPanel>

          <MetricPanel
            title="Métricas Asistencias"  
            icon={<CheckSquare size={20} />}
            metrics={[
              { 
                label: "Asistencia", 
                value: loadingAsistencia 
                  ? "Cargando..." 
                  : porcentajeAsistencia !== null 
                    ? `${porcentajeAsistencia}%` 
                    : "—"
              }
            ]}
            detailsUrl="/api/reportes/asistencias"
          >
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-800 mb-1 block">Filtrar por Deporte:</label>
                <select
                  value={deporteSeleccionado}
                  onChange={(e) => setDeporteSeleccionado(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                >
                  {deportes.map((deporte) => (
                    <option key={deporte.id} value={deporte.id}>
                      {deporte.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={() => window.location.href = '/admin/reportes/asistencias'}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Ver Reporte Detallado
              </button>
            </div>
          </MetricPanel>
        </section>
      </main>
    </div>
  )
}
