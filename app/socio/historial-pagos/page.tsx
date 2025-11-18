"use client"

import React, { useEffect, useState } from 'react'
import Breadcrumb from '../../components/Breadcrumb'
import LoadingSpinner from '../../components/LoadingSpinner'
import { CreditCard } from 'lucide-react'

interface PagoListItem {
  id: number
  monto: number
  tipoPago: string
  fechaPago: string
  estado?: string
  cuota?: { mes: number; anio: number } | null
}

interface PagoDetail {
  id: number
  monto: number
  tipoPago: string
  fechaPago: string
  usuarioSocio: { id: number; nombre: string; dni: string }
  cuota?: { mes: number; anio: number } | null
}

export default function HistorialPagosPage() {
  const [pagos, setPagos] = useState<PagoListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [usuarioId, setUsuarioId] = useState<number | null>(null)
  const [notAuthorized, setNotAuthorized] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URL(window.location.href).searchParams
    const debugIdParam = params.get('debug')

    const fetchPagosFor = async (id: number) => {
      try {
        setLoading(true)
        const res = await fetch(`/api/socios/pagos?usuarioId=${id}`)
        if (!res.ok) {
          setPagos([])
          return
        }
        const data = await res.json()
        const lista: PagoListItem[] = (data.pagos || []).map((p: any) => ({
          id: p.id,
          monto: p.monto,
          tipoPago: p.tipoPago,
          fechaPago: p.fechaPago,
          estado: p.estado,
          cuota: p.cuota || null
        }))
        setPagos(lista)
      } catch (err) {
        console.error('Error cargando pagos', err)
        setPagos([])
      } finally {
        setLoading(false)
      }
    }

    if (debugIdParam) {
      const dbg = Number(debugIdParam)
      if (!isNaN(dbg) && dbg > 0) {
        setUsuarioId(dbg)
        fetchPagosFor(dbg)
        return
      }
    }

    const usuarioRaw = localStorage.getItem('usuario')
    const token = localStorage.getItem('token')
    if (!usuarioRaw || !token) {
      setNotAuthorized(true)
      setLoading(false)
      return
    }

    try {
      const usuario = JSON.parse(usuarioRaw)
      if (usuario.rol !== 'SOCIO') {
        setNotAuthorized(true)
        setLoading(false)
        return
      }
      setUsuarioId(usuario.id)
      fetchPagosFor(usuario.id)
    } catch (err) {
      console.error('Error parseando usuario', err)
      setNotAuthorized(true)
      setLoading(false)
    }
  }, [])

  const conceptoFor = (p: PagoListItem) => {
    if (p.cuota) {
      const dt = new Date(p.cuota.anio, (p.cuota.mes || 1) - 1)
      return `Cuota Socio - ${dt.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}`
    }
    const map: Record<string, string> = {
      CUOTA_PRACTICA: 'Cuota Practica',
      CUOTA_MENSUAL: 'Cuota Mensual',
      PRACTICA_DEPORTIVA: 'Cuota Practica',
      RESERVA_CANCHA: 'Reserva Cancha'
    }
    return map[p.tipoPago] || p.tipoPago
  }

  const descargarComprobante = async (pagoId: number) => {
    try {
      const headers: Record<string, string> = {}
      if (usuarioId) headers['x-usuario-id'] = String(usuarioId)

      const res = await fetch(`/api/pagos/${pagoId}/comprobante`, { headers })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        console.error('Error al obtener el comprobante', res.status, txt)
        return
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `comprobante_pago_${pagoId}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error descargando comprobante', err)
    }
  }

  if (loading) return <LoadingSpinner />

  if (notAuthorized) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <h2 className="text-lg font-semibold">No autorizado</h2>
        <p className="text-sm text-gray-600">Debes iniciar sesión con una cuenta de Socio para ver tu historial de pagos.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <Breadcrumb items={[{ label: 'Panel Principal', href: '/socio' }, { label: 'Mi Historial de Pagos', active: true }]} />
      <div className="flex items-center gap-4 mb-4">
        <CreditCard className="text-blue-600" />
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Mi Historial de Pagos</h1>
          <p className="text-sm text-gray-500">Pagos Registrados</p>
        </div>
      </div>

      {pagos.length === 0 ? (
        <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
          <p className="text-gray-600">Aún no has realizado pagos.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Fecha de pago</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Concepto</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Monto</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Comprobante</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((p) => (
                  <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900">{new Date(p.fechaPago).toLocaleDateString('es-ES')}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{conceptoFor(p)}</td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">${(p.monto).toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      {p.estado === 'PAGADO' ? (
                        <button onClick={() => descargarComprobante(p.id)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded">Descargar</button>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
