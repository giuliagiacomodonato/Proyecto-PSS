'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { jsPDF } from 'jspdf'
import Breadcrumb from '@/app/components/Breadcrumb'

interface PagoCuotaPractica {
  pagoId: string
  montoTotal: number
  cantidadCuotas: number
  cuotasSeleccionadas: Array<{ id: number; nombre: string; precio: number }>
  fecha: string
}

export default function PagoExitoso() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pagoId = searchParams.get('pagoId')
  
  const [pago, setPago] = useState<PagoCuotaPractica | null>(null)
  const [usuario, setUsuario] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario')
    if (!usuarioGuardado) {
      router.push('/login')
      return
    }

    const usuarioObj = JSON.parse(usuarioGuardado)
    setUsuario(usuarioObj)

    if (usuarioObj.rol !== 'SOCIO') {
      router.push('/dashboard')
      return
    }

    if (!pagoId) {
      setError('ID de pago no encontrado')
      setLoading(false)
      return
    }

    const pagoCuota = sessionStorage.getItem('pagoCuotaPractica')
    if (pagoCuota) {
      setPago(JSON.parse(pagoCuota))
    } else {
      setError('Datos de pago no encontrados')
    }
    
    setLoading(false)
  }, [pagoId, router])

  const generarPDF = () => {
    if (!pago || !usuario) return

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 15
    let y = margin

    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('COMPROBANTE DE PAGO', margin, y)
    y += 10

    doc.setDrawColor(0, 0, 0)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Club Deportivo PSS', margin, y)
    y += 5

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('NÚMERO DE COMPROBANTE:', margin, y)
    doc.setFont('helvetica', 'normal')
    doc.text(pago.pagoId, margin + 60, y)
    y += 6

    doc.setFont('helvetica', 'bold')
    doc.text('FECHA:', margin, y)
    doc.setFont('helvetica', 'normal')
    doc.text(new Date(pago.fecha).toLocaleDateString('es-ES'), margin + 60, y)
    y += 8

    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 6

    doc.setFont('helvetica', 'bold')
    doc.text('DATOS DEL SOCIO:', margin, y)
    y += 5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Nombre: ${usuario.nombre}`, margin, y)
    y += 4
    doc.text(`DNI: ${usuario.dni}`, margin, y)
    y += 8

    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 6

    doc.setFont('helvetica', 'bold')
    doc.text('DETALLE DEL PAGO:', margin, y)
    y += 5

    doc.setFontSize(8)
    pago.cuotasSeleccionadas.forEach((cuota) => {
      doc.setFont('helvetica', 'normal')
      doc.text(`${cuota.nombre}`, margin, y)
      doc.text(`$${cuota.precio.toFixed(2)}`, pageWidth - margin - 20, y)
      y += 5
    })

    y += 2
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 4

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('MONTO TOTAL:', margin, y)
    doc.text(`$${pago.montoTotal.toFixed(2)}`, pageWidth - margin - 20, y)
    y += 8

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('MÉTODO DE PAGO:', margin, y)
    doc.setFont('helvetica', 'normal')
    doc.text('Tarjeta de Crédito', margin + 60, y)
    y += 8

    doc.setFont('helvetica', 'bold')
    doc.text('ESTADO:', margin, y)
    doc.setTextColor(0, 128, 0)
    doc.setFont('helvetica', 'bold')
    doc.text('PAGADO', margin + 60, y)

    doc.save(`comprobante_pago_${pago.pagoId}.pdf`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Cargando...</div>
      </div>
    )
  }

  if (error || !pago) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">{error || 'Error cargando el pago'}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Breadcrumb items={[
          { label: 'Panel Principal', href: '/socio' },
          { label: 'Pagos', href: '/socio/pagos' },
          { label: 'Comprobante', active: true }
        ]} />

        <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-8 rounded-r-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-green-600 text-2xl">✓</div>
            <h1 className="text-2xl font-bold text-green-900">¡Pago realizado con éxito!</h1>
          </div>
          <p className="text-green-800">Tu pago ha sido procesado correctamente.</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Cantidad de Cuotas</p>
              <p className="text-lg font-semibold text-gray-900">{pago.cantidadCuotas}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Monto Total</p>
              <p className="text-lg font-bold text-blue-600">${pago.montoTotal.toFixed(2)}</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mb-6">
            <p className="text-sm text-gray-600 mb-3">Cuotas Pagadas:</p>
            <div className="space-y-2">
              {pago.cuotasSeleccionadas.map((cuota) => (
                <div key={cuota.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{cuota.nombre}</span>
                  <span className="font-medium text-gray-900">${cuota.precio.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mb-6">
            <p className="text-sm text-gray-600 mb-2">Número de Comprobante</p>
            <p className="text-sm font-mono bg-gray-50 p-2 rounded">{pago.pagoId}</p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-600 mb-1">Fecha</p>
            <p className="text-sm text-gray-900">
              {new Date(pago.fecha).toLocaleDateString('es-ES')}
            </p>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={generarPDF}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            📥 Descargar Comprobante PDF
          </button>
          <button
            onClick={() => router.push('/socio')}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Volver al Panel Principal
          </button>
        </div>
      </div>
    </div>
  )
}
