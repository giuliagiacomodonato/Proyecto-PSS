"use client"

import React, { useEffect, useState } from "react"
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
          <div className="text-gray-600">{icon}</div>
          <div>
            <div className="text-sm font-medium">{title}</div>
            <div className="text-xs text-gray-500">Haz clic para ver detalles</div>
          </div>
        </div>
        <div className="text-gray-500">{open ? <ChevronUp /> : <ChevronDown />}</div>
      </button>

      <div className="px-4 pb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="p-3 bg-gray-50 rounded">
              <div className="text-xs text-gray-500">{m.label}</div>
              <div className="text-lg font-semibold">
                {m.value === null ? (
                  <span className="text-gray-400">—</span>
                ) : (
                  m.value
                )}
              </div>
            </div>
          ))}
        </div>

        {loading && <div className="text-sm text-gray-500 mt-3">Comprobando datos...</div>}
        {dataAvailable === false && (
          <div className="text-sm text-red-600 mt-3">Datos no disponibles</div>
        )}

        {open && (
          <div className="mt-4 p-3 border-t border-gray-100">
            {children ? (
              children
            ) : (
              <div className="text-sm text-gray-600">No hay detalles para mostrar.</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const [from, setFrom] = useState<string>("")
  const [to, setTo] = useState<string>("")

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8">
        {/* Top header (site title + user) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Gestor Club Deportivo</h1>
            <div className="flex items-center gap-2 text-gray-600 bg-white px-3 py-2 rounded-full border border-gray-200">
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-sm">Usuario Admin</span>
            </div>
          </div>

          <div className="text-sm text-gray-500 mb-4">Panel Principal</div>

          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Métricas del Club</h2>

          {/* Filtro por Fecha - caja blanca amplia */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 max-w-4xl">
            <div className="text-sm text-gray-700 mb-3 font-medium">Filtro por Fecha</div>
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
              <button className="ml-auto bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-900 transition-colors">Aplicar</button>
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
              <div className="text-sm text-gray-600">Lista de socios (layout de ejemplo)</div>
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
            <div className="text-sm text-gray-600">Detalle de pagos (layout)</div>
          </MetricPanel>

          <MetricPanel
            title="Métricas Alquileres"
            icon={<Calendar size={20} />}
            metrics={[{ label: "Reservas Activas", value: "—" }, { label: "Ocupación", value: "— %" }]}
            detailsUrl="/api/reservas"
          >
            <div className="text-sm text-gray-600">Reservas activas y ocupación (layout)</div>
          </MetricPanel>

          <MetricPanel
            title="Métricas Asistencias"
            icon={<CheckSquare size={20} />}
            metrics={[{ label: "Asistencia", value: "— %" }]}
            detailsUrl="/api/asistencias"
          >
            <div className="text-sm text-gray-600">Selector de deporte + porcentaje (layout)</div>
          </MetricPanel>
        </section>
      </main>
    </div>
  )
}
