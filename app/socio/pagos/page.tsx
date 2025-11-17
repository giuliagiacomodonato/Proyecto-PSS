'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { jsPDF } from 'jspdf'
import Breadcrumb from '../../components/Breadcrumb'
import { CreditCard, Dumbbell } from 'lucide-react'

interface Pago {
  id: number
  monto: number
  tipoPago: string
  fechaPago: string
  usuarioSocio: {
    nombre: string
    apellido: string
    dni: string
  }
}

export default function PagosPage() {
  const router = useRouter()
  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(false)
  const [usuarioId, setUsuarioId] = useState<number | null>(null)

  const handlePagoCuota = () => {
    router.push('/socio/pagoSocio?tipo=CUOTA_MENSUAL')
  }

  const handlePagoPractica = () => {
    router.push('/socio/pagoSocio?tipo=CUOTA_PRACTICA')
  }

  useEffect(() => {
    const usuario = localStorage.getItem('usuario')
    if (!usuario) {
      router.push('/login')
      return
    }

    const usuarioObj = JSON.parse(usuario)
    if (usuarioObj.rol !== 'SOCIO') {
      router.push('/dashboard')
      return
    }

    setUsuarioId(usuarioObj.id)

    const fetchPagos = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/socios/pagos?usuarioId=${usuarioObj.id}`)
        if (response.ok) {
          const data = await response.json()
          setPagos(data.pagos || [])
        }
      } catch (error) {
        console.error('Error al cargar pagos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPagos()
  }, [router])

  const generarPDF = (pago: Pago) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 15
    let y = margin

    // Título
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('COMPROBANTE DE PAGO', margin, y)
    y += 10

    // Línea separadora
    doc.setDrawColor(0, 0, 0)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    // Información del club
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text('Club Deportivo PSS', margin, y)
    y += 5

    // Información del comprobante
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('NÚMERO DE COMPROBANTE:', margin, y)
    doc.setFont('helvetica', 'normal')
    doc.text(`#${pago.id.toString().padStart(8, '0')}`, margin + 60, y)
    y += 6

    doc.setFont('helvetica', 'bold')
    doc.text('FECHA:', margin, y)
    doc.setFont('helvetica', 'normal')
    doc.text(new Date(pago.fechaPago).toLocaleDateString('es-ES'), margin + 60, y)
    y += 8

    // Línea separadora
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 6

    // Información del socio
    doc.setFont('helvetica', 'bold')
    doc.text('DATOS DEL SOCIO:', margin, y)
    y += 5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Nombre: ${pago.usuarioSocio.nombre} ${pago.usuarioSocio.apellido}`, margin, y)
    y += 4
    doc.text(`DNI: ${pago.usuarioSocio.dni}`, margin, y)
    y += 8

    // Línea separadora
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, y, pageWidth - margin, y)
    y += 6

    // Detalles del pago
    doc.setFont('helvetica', 'bold')
    doc.text('DETALLE DEL PAGO:', margin, y)
    y += 5

    const conceptoMap: Record<string, string> = {
      'CUOTA_PRACTICA': 'Cuota de Práctica Deportiva',
      'CUOTA_MENSUAL': 'Cuota Mensual de Socio',
      'PRACTICA_DEPORTIVA': 'Cuota de Práctica Deportiva',
      'RESERVA_CANCHA': 'Reserva de Cancha'
    }

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Concepto: ${conceptoMap[pago.tipoPago] || pago.tipoPago}`, margin, y)
    y += 6

    // Monto
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(14)
    doc.text(`Monto: $${pago.monto.toFixed(2)}`, margin, y)
    y += 10

    // Línea separadora
    doc.setDrawColor(0, 0, 0)
    doc.line(margin, y, pageWidth - margin, y)
    y += 8

    // Pie de página
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text('Gracias por su pago. Este comprobante es válido como recibo de pago.', margin, y)
    y += 4
    doc.text(new Date().toLocaleString('es-ES'), margin, y)

    // Descargar
    doc.save(`comprobante_pago_${pago.id}.pdf`)
  }

  const conceptoMap: Record<string, string> = {
    'CUOTA_PRACTICA': 'Cuota de Práctica Deportiva',
    'CUOTA_MENSUAL': 'Cuota Mensual de Socio',
    'PRACTICA_DEPORTIVA': 'Cuota de Práctica Deportiva',
    'RESERVA_CANCHA': 'Reserva de Cancha'
  }

  return (
    <>
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Panel Principal', href: '/socio' },
          { label: 'Pagos', active: true }
        ]} />
        <h1 className="text-3xl font-bold text-gray-900">Pagos</h1>
        <p className="text-sm text-gray-500 mt-2">Seleccione el tipo de pago que desea realizar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        {/* Opcion Pago Cuota */}
        <div
          onClick={handlePagoCuota}
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow border border-gray-200"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CreditCard size={32} className="text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Pago Cuota</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Realiza el pago de tu cuota mensual de socio
          </p>
          <button
            onClick={handlePagoCuota}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Continuar
          </button>
        </div>

        {/* Opcion Pago Practicas */}
        <div
          onClick={handlePagoPractica}
          className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow border border-gray-200"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Dumbbell size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Pago Practicas</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Realiza el pago de tus practicas deportivas inscritas
          </p>
          <button
            onClick={handlePagoPractica}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            Continuar
          </button>
        </div>
      </div>

      {/* Historial de Pagos */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Historial de Pagos</h2>
        
        {loading ? (
          <div className="bg-white rounded-lg p-8 text-center">
            <p className="text-gray-600">Cargando historial...</p>
          </div>
        ) : pagos.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center border border-gray-200">
            <p className="text-gray-600">No hay pagos registrados.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Fecha</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Concepto</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Monto</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((pago) => (
                    <tr key={pago.id} className="border-b border-gray-200 hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(pago.fechaPago).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {conceptoMap[pago.tipoPago] || pago.tipoPago}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        ${pago.monto.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => generarPDF(pago)}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                        >
                          📄 Descargar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
