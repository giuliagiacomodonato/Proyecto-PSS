"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Breadcrumb from '../../components/Breadcrumb'

type Form = {
  titular: string
  numero: string
  vencimiento: string
  cvv: string
}

interface ReservaData {
  canchaId: number
  fecha: string
  horario: string
  usuarioSocioId: number
  precio: number
  nombreCancha: string
}

interface PracticaInscrita {
  id: number
  nombre: string
  precio: number
  descripcion: string
}

interface CuotaInfo {
  precio: number
  precioBase: number
  cantidadFamiliares: number
  descuento: number
  precioOriginal: number
}

interface CuotaPractica {
  id: number
  practicaDeportivaId: number
  nombrePractica: string
  precio: number
  periodo: string
  estado: 'PAGADA' | 'IMPAGA'
}

export default function PagoSocio() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tipo = searchParams.get('tipo') || 'CUOTA_MENSUAL'
  
  const [form, setForm] = useState<Form>({ titular: '', numero: '', vencimiento: '', cvv: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({})
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'success'; texto: string } | null>(null)
  const [reservaData, setReservaData] = useState<ReservaData | null>(null)
  const [usuarioSocioId, setUsuarioSocioId] = useState<number | null>(null)
  const [practicasInscritas, setPracticasInscritas] = useState<PracticaInscrita[]>([])
  const [cuotaInfo, setCuotaInfo] = useState<CuotaInfo | null>(null)
  const [cuotasPractica, setCuotasPractica] = useState<CuotaPractica[]>([])
  const [selectedCuotas, setSelectedCuotas] = useState<Set<number>>(new Set())
  const [pagoCuotaData, setPagoCuotaData] = useState<any | null>(null)
  const [pagoExitoso, setPagoExitoso] = useState<any | null>(null)
  const [showComprobante, setShowComprobante] = useState(false)

  useEffect(() => {
    // Obtener el usuarioSocioId del localStorage
    const usuarioGuardado = localStorage.getItem('usuario')
    if (usuarioGuardado) {
      const usuarioData = JSON.parse(usuarioGuardado)
      setUsuarioSocioId(usuarioData.id)
    }

    // Obtener los datos de la reserva desde sessionStorage
    if (tipo === 'RESERVA_CANCHA') {
      const data = sessionStorage.getItem('reservaPendiente')
      if (data) {
        setReservaData(JSON.parse(data))
      }
    }

    // Obtener los datos del pago de cuota desde sessionStorage
    const pagoCuotaDataStr = sessionStorage.getItem('pagoCuotaPendiente')
    if (pagoCuotaDataStr) {
      const data = JSON.parse(pagoCuotaDataStr)
      setPagoCuotaData(data)
      setLoadingData(false)
      // Si hay datos de pago de cuota, no necesitamos cargar datos adicionales
      return
    }
  }, [tipo])

  useEffect(() => {
    const fetchDatosPago = async () => {
      if (!usuarioSocioId) return

      try {
        setLoadingData(true)

        if (tipo === 'PRACTICA_DEPORTIVA') {
          // Obtener las prácticas a las que está inscrito el socio
          const response = await fetch(`/api/socios/practicas?usuarioSocioId=${usuarioSocioId}`)
          if (response.ok) {
            const data = await response.json()
            setPracticasInscritas(data.practicas || [])
          }
        } else if (tipo === 'CUOTA_MENSUAL') {
          // Obtener información de la cuota del socio
          const response = await fetch(`/api/socios/cuota?usuarioSocioId=${usuarioSocioId}`)
          if (response.ok) {
            const data = await response.json()
            setCuotaInfo(data.cuota || null)
          }
        } else if (tipo === 'CUOTA_PRACTICA') {
          // Obtener las cuotas de prácticas pendientes de pago
          const response = await fetch(`/api/socios/cuotas-practica?usuarioId=${usuarioSocioId}`)
          if (response.ok) {
            const data = await response.json()
            const unpaidQuotas = data.cuotasPractica?.filter((c: CuotaPractica) => c.estado === 'IMPAGA') || []
            setCuotasPractica(unpaidQuotas)
            setSelectedCuotas(new Set())
          }
        }
      } catch (error) {
        console.error('Error al obtener datos:', error)
      } finally {
        setLoadingData(false)
      }
    }

    fetchDatosPago()
  }, [usuarioSocioId, tipo])

  const getTipoPagoInfo = () => {
    if (tipo === 'RESERVA_CANCHA' && reservaData) {
      return {
        concepto: 'Pago Reserva de Cancha',
        monto: reservaData.precio,
        descripcion: `Reserva de ${reservaData.nombreCancha} para el ${new Date(reservaData.fecha).toLocaleDateString('es-ES')} a las ${reservaData.horario}`,
        tipoPago: 'RESERVA_CANCHA',
        detalles: null
      }
    }
    if (tipo === 'PRACTICA_DEPORTIVA') {
      const total = practicasInscritas.reduce((sum, p) => sum + p.precio, 0)
      return {
        concepto: 'Pago Cuota Práctica',
        monto: total,
        descripcion: 'Actualmente está inscripto en:',
        tipoPago: 'PRACTICA_DEPORTIVA',
        detalles: practicasInscritas
      }
    }
    if (pagoCuotaData) {
      return {
        concepto: 'Pago Cuota Mensual Socio',
        monto: pagoCuotaData.total,
        descripcion: `Pago de ${pagoCuotaData.cuotas.length} cuota${pagoCuotaData.cuotas.length > 1 ? 's' : ''}${pagoCuotaData.tipoUsuario === 'FAMILIAR' ? ' (con 30% de descuento)' : ''}`,
        tipoPago: 'CUOTA_MENSUAL',
        detalles: pagoCuotaData.cuotas
      }
    }
    if (tipo === 'CUOTA_MENSUAL' && cuotaInfo) {
      return {
        concepto: 'Pago Cuota Socio',
        monto: cuotaInfo.precio,
        descripcion: `El valor de la cuota actualmente para tu plan es:${cuotaInfo.descuento > 0 ? ` (${cuotaInfo.cantidadFamiliares} familiares con 30% de descuento)` : ''}`,
        tipoPago: 'CUOTA_MENSUAL',
        detalles: cuotaInfo
      }
    }
    if (tipo === 'CUOTA_PRACTICA') {
      const total = Array.from(selectedCuotas).reduce((sum, cuotaId) => {
        const cuota = cuotasPractica.find(c => c.id === cuotaId)
        return sum + (cuota?.precio || 0)
      }, 0)
      return {
        concepto: 'Pago Cuota Práctica',
        monto: total,
        descripcion: 'Seleccione las cuotas de prácticas que desea pagar:',
        tipoPago: 'CUOTA_PRACTICA',
        detalles: cuotasPractica
      }
    }
    return {
      concepto: 'Pago Cuota Mensual',
      monto: 10000,
      descripcion: 'Pago de cuota mensual de socio',
      tipoPago: 'CUOTA_MENSUAL',
      detalles: null
    }
  }

  const pagoPaginfo = getTipoPagoInfo()

  const validate = () => {
    const e: Partial<Record<keyof Form, string>> = {}
    if (!form.titular.trim()) e.titular = 'El nombre del titular es requerido'
    if (!/^[0-9]{16}$/.test(form.numero.replace(/\s+/g, ''))) e.numero = 'El número debe tener 16 dígitos'
    if (!/^(0[1-9]|1[0-2])\/(20\d{2})$/.test(form.vencimiento)) e.vencimiento = 'Formato MM/AAAA'
    if (!/^[0-9]{3,4}$/.test(form.cvv)) e.cvv = 'CVV inválido (3 o 4 dígitos)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    
    // Para CUOTA_PRACTICA, verificar que haya cuotas seleccionadas
    if (tipo === 'CUOTA_PRACTICA' && selectedCuotas.size === 0) {
      setMensaje({ tipo: 'error', texto: 'Por favor, selecciona al menos una cuota para pagar.' })
      return
    }
    
    setLoading(true)
    setErrors({})
    try {
      const last4 = form.numero.replace(/\s+/g, '').slice(-4)
      
      // Si es reserva de cancha, guardar la reserva y el pago
      let turnoId = null
      if (tipo === 'RESERVA_CANCHA' && reservaData) {
        const reservaResponse = await fetch('/api/reservas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            canchaId: reservaData.canchaId,
            fecha: reservaData.fecha,
            horario: reservaData.horario,
            usuarioSocioId: reservaData.usuarioSocioId
          })
        })

        if (!reservaResponse.ok) {
          throw new Error('Error al guardar la reserva')
        }

        const reservaResultado = await reservaResponse.json()
        turnoId = reservaResultado.turnoId
      }

      const payload: any = { 
        titular: form.titular, 
        last4, 
        monto: pagoPaginfo.monto, 
        tipo: pagoPaginfo.tipoPago,
        usuarioSocioId: usuarioSocioId,
        turnoId: turnoId,
        metodoPago: 'TARJETA_CREDITO'
      }
      
      // Si es cuota práctica, agregar los detalles de las cuotas seleccionadas
      if (tipo === 'CUOTA_PRACTICA') {
        const cuotasSeleccionadas = Array.from(selectedCuotas).map(cuotaId => {
          const cuota = cuotasPractica.find(c => c.id === cuotaId)
          return {
            id: cuotaId,
            nombre: cuota?.nombrePractica || 'Práctica',
            precio: cuota?.precio || 0
          }
        })
        payload.cuotasSeleccionadas = cuotasSeleccionadas
      }
      
      const res = await fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) {
  setMensaje({ tipo: 'error', texto: data.error || 'El pago fue rechazado. Por favor, verifica los datos o intenta con otra tarjeta.' })
  setForm({ titular: '', numero: '', vencimiento: '', cvv: '' })
  setLoading(false)
  return
      }
      // éxito
      if (tipo === 'CUOTA_PRACTICA') {
        // Guardar datos de pago en sessionStorage para la página de éxito
        sessionStorage.setItem('pagoCuotaPractica', JSON.stringify({
          pagoId: data.pagoId,
          montoTotal: data.montoTotal,
          cantidadCuotas: data.cantidadCuotas,
          cuotasSeleccionadas: Array.from(selectedCuotas).map(cuotaId => {
            const cuota = cuotasPractica.find(c => c.id === cuotaId)
            return {
              id: cuotaId,
              nombre: cuota?.nombrePractica || 'Práctica',
              precio: cuota?.precio || 0
            }
          }),
          fecha: new Date().toLocaleString('es-ES')
        }))
        // Redirigir a la página de éxito para cuota práctica
        router.push(`/socio/pagoExitoso?pagoId=${data.pagoId}`)
      } else {
        setMensaje({ tipo: 'success', texto: '¡Pago realizado con éxito! Tu reserva está confirmada.' })
        // Limpiar sessionStorage
        sessionStorage.removeItem('reservaPendiente')
        // redirigir al panel principal del socio después de mostrar toast
        setTimeout(() => router.push('/socio'), 1500)
      }
    } catch (err) {
  setMensaje({ tipo: 'error', texto: 'El pago fue rechazado. Por favor, verifica los datos o intenta con otra tarjeta.' })
  setForm({ titular: '', numero: '', vencimiento: '', cvv: '' })
  setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Panel Principal', href: '/socio' },
          { label: 'Pagos', href: '/socio/pagos' },
          { label: tipo === 'practica' ? 'Pago Practicas' : 'Pago Cuota', active: true }
        ]} />
        <h1 className="text-3xl font-bold text-gray-900">{pagoPaginfo.concepto}</h1>
        <p className="text-sm text-gray-500 mt-2">{pagoPaginfo.descripcion}</p>
      </div>

      {tipo === 'CUOTA_PRACTICA' && cuotasPractica.length > 0 && (
        <div className="max-w-md mx-auto bg-white rounded-xl p-8 shadow-sm border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold mb-4">Prácticas Pendientes de Pago</h3>
          <div className="space-y-3">
            {cuotasPractica.map(cuota => (
              <div key={cuota.id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg">
                <input
                  type="checkbox"
                  id={`cuota-${cuota.id}`}
                  checked={selectedCuotas.has(cuota.id)}
                  onChange={(e) => {
                    const newSelected = new Set(selectedCuotas)
                    if (e.target.checked) {
                      newSelected.add(cuota.id)
                    } else {
                      newSelected.delete(cuota.id)
                    }
                    setSelectedCuotas(newSelected)
                  }}
                  className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300"
                />
                <label htmlFor={`cuota-${cuota.id}`} className="flex-1 cursor-pointer">
                  <div className="font-medium text-gray-900">{cuota.nombrePractica}</div>
                  <div className="text-sm text-gray-600">{cuota.periodo}</div>
                  <div className="text-sm font-semibold text-gray-900">${cuota.precio.toFixed(2)}</div>
                </label>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total a pagar:</span>
              <span className="text-xl font-bold text-blue-600">
                ${Array.from(selectedCuotas).reduce((sum, cuotaId) => {
                  const cuota = cuotasPractica.find(c => c.id === cuotaId)
                  return sum + (cuota?.precio || 0)
                }, 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {tipo === 'CUOTA_PRACTICA' && cuotasPractica.length === 0 && (
        <div className="max-w-md mx-auto bg-white rounded-xl p-8 shadow-sm border border-gray-200 mb-6">
          <p className="text-center text-gray-600">No hay cuotas pendientes de pago.</p>
        </div>
      )}

      <div className="max-w-md mx-auto bg-white rounded-xl p-8 shadow-sm border border-gray-200">
        {/* Mostrar detalles de las cuotas si es pago múltiple */}
        {pagoCuotaData && pagoCuotaData.cuotas.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Cuotas a pagar:</h3>
            <ul className="space-y-1">
              {pagoCuotaData.cuotas.map((cuota: any) => (
                <li key={cuota.id} className="text-sm text-gray-600 flex justify-between">
                  <span>{cuota.periodo}</span>
                  <span className="font-medium">${cuota.monto.toLocaleString('es-AR')}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 pt-3 border-t border-blue-300 flex justify-between font-semibold text-gray-900">
              <span>Total:</span>
              <span>${pagoCuotaData.total.toLocaleString('es-AR')}</span>
            </div>
          </div>
        )}

        <h3 className="text-2xl font-semibold mb-8 text-center">Tarjeta</h3>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-700 mb-2">Nombre del titular de la tarjeta *</label>
            <input 
              value={form.titular} 
              onChange={(e) => setForm({ ...form, titular: e.target.value })} 
              placeholder="Como aparece en el plástico"
              className={`w-full p-3 border rounded-lg text-gray-700 placeholder-gray-400 ${errors.titular ? 'border-red-500' : 'border-gray-300'}`} 
            />
            {errors.titular && <p className="text-red-500 text-xs mt-1">{errors.titular}</p>}
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Número de la tarjeta *</label>
            <input 
              value={form.numero} 
              onChange={(e) => setForm({ ...form, numero: e.target.value })} 
              placeholder="Ingrese los 16 dígitos" 
              className={`w-full p-3 border rounded-lg text-gray-700 placeholder-gray-400 ${errors.numero ? 'border-red-500' : 'border-gray-300'}`} 
            />
            {errors.numero && <p className="text-red-500 text-xs mt-1">{errors.numero}</p>}
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Fecha de vencimiento *</label>
            <input 
              value={form.vencimiento} 
              onChange={(e) => setForm({ ...form, vencimiento: e.target.value })} 
              placeholder="MM/AAAA" 
              className={`w-full p-3 border rounded-lg text-gray-700 placeholder-gray-400 ${errors.vencimiento ? 'border-red-500' : 'border-gray-300'}`} 
            />
            {errors.vencimiento && <p className="text-red-500 text-xs mt-1">{errors.vencimiento}</p>}
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">CVV *</label>
            <input 
              value={form.cvv} 
              onChange={(e) => setForm({ ...form, cvv: e.target.value })} 
              placeholder="Ingrese 3 o 4 dígitos" 
              className={`w-full p-3 border rounded-lg text-gray-700 placeholder-gray-400 ${errors.cvv ? 'border-red-500' : 'border-gray-300'}`} 
            />
            {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
          </div>

          <div className="flex items-center justify-center gap-4 mt-8 pt-4">
            <button 
              type="submit" 
              disabled={loading || loadingData} 
              className="px-8 py-3 bg-gray-400 text-white rounded-lg disabled:opacity-50 font-semibold hover:bg-gray-500 transition-colors"
            >
              Confirmar
            </button>
            
            {mensaje && (
              <div className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${mensaje.tipo === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {mensaje.texto}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Modal de Comprobante */}
      {showComprobante && pagoExitoso && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-green-600 text-white px-6 py-4 rounded-t-xl">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-2xl font-bold">¡Pago Exitoso!</h2>
              </div>
            </div>

            {/* Comprobante Content */}
            <div id="comprobante-content" className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">Comprobante de Pago</h3>
                <p className="text-sm text-gray-500 mt-1">Club Deportivo PSS</p>
              </div>

              {/* Información del Pago */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Fecha:</p>
                    <p className="font-semibold text-gray-900">{pagoExitoso.fecha}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Hora:</p>
                    <p className="font-semibold text-gray-900">{pagoExitoso.hora}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Concepto:</p>
                    <p className="font-semibold text-gray-900">{pagoExitoso.concepto}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Método de Pago:</p>
                    <p className="font-semibold text-gray-900">Tarjeta •••• {pagoExitoso.last4}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600">Titular:</p>
                    <p className="font-semibold text-gray-900">{pagoExitoso.titular}</p>
                  </div>
                </div>
              </div>

              {/* Detalle de Cuotas */}
              {pagoExitoso.cuotas && pagoExitoso.cuotas.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Detalle de Cuotas Pagadas:</h4>
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">Período</th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {pagoExitoso.cuotas.map((cuota: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-700">{cuota.periodo}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium text-right">
                              ${cuota.monto.toLocaleString('es-AR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Monto Total Pagado:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${pagoExitoso.monto.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer con Botones */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex gap-3">
              <button
                onClick={() => {
                  const content = document.getElementById('comprobante-content')
                  if (content) {
                    const printWindow = window.open('', '', 'width=800,height=600')
                    if (printWindow) {
                      printWindow.document.write(`
                        <html>
                          <head>
                            <title>Comprobante de Pago</title>
                            <style>
                              body { font-family: Arial, sans-serif; padding: 20px; }
                              .header { text-align: center; margin-bottom: 30px; }
                              .info { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 8px; }
                              .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                              .table th, .table td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                              .table th { background: #f0f0f0; font-weight: bold; }
                              .total { background: #e3f2fd; padding: 15px; margin-top: 20px; border-radius: 8px; font-size: 18px; font-weight: bold; }
                            </style>
                          </head>
                          <body>
                            ${content.innerHTML.replace(/class="[^"]*"/g, '')}
                          </body>
                        </html>
                      `)
                      printWindow.document.close()
                      printWindow.print()
                    }
                  }
                }}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Descargar Comprobante (PDF)
              </button>
              <button
                onClick={() => {
                  setShowComprobante(false)
                  router.push('/socio')
                }}
                className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
              >
                Volver a Panel Principal
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
