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

export default function PagoSocio() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tipo = searchParams.get('tipo') || 'CUOTA_MENSUAL'
  
  const [form, setForm] = useState<Form>({ titular: '', numero: '', vencimiento: '', cvv: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({})
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [toast, setToast] = useState<{ type: 'error' | 'success'; msg: string } | null>(null)
  const [reservaData, setReservaData] = useState<ReservaData | null>(null)
  const [usuarioSocioId, setUsuarioSocioId] = useState<number | null>(null)
  const [practicasInscritas, setPracticasInscritas] = useState<PracticaInscrita[]>([])
  const [cuotaInfo, setCuotaInfo] = useState<CuotaInfo | null>(null)

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
    if (tipo === 'CUOTA_MENSUAL' && cuotaInfo) {
      return {
        concepto: 'Pago Cuota Socio',
        monto: cuotaInfo.precio,
        descripcion: `El valor de la cuota actualmente para tu plan es:${cuotaInfo.descuento > 0 ? ` (${cuotaInfo.cantidadFamiliares} familiares con 30% de descuento)` : ''}`,
        tipoPago: 'CUOTA_MENSUAL',
        detalles: cuotaInfo
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
    setLoading(true)
    setErrors({})
    try {
      // Enviar solo datos no sensibles o tokenizados: aquí simulamos tokenización enviando los últimos 4 dígitos
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

      const payload = { 
        titular: form.titular, 
        last4, 
        monto: pagoPaginfo.monto, 
        tipo: pagoPaginfo.tipoPago,
        usuarioSocioId: usuarioSocioId,
        turnoId: turnoId,
        metodoPago: 'TARJETA_CREDITO'
      }
      const res = await fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) {
        setToast({ type: 'error', msg: data.error || 'El pago fue rechazado. Por favor, verifica los datos o intenta con otra tarjeta.' })
        // limpiar campos sensibles
        setForm({ titular: '', numero: '', vencimiento: '', cvv: '' })
        setTimeout(() => setToast(null), 5000)
        return
      }
      // éxito
      setToast({ type: 'success', msg: '¡Pago realizado con éxito! Tu reserva está confirmada.' })
      setTimeout(() => setToast(null), 5000)
      // Limpiar sessionStorage
      sessionStorage.removeItem('reservaPendiente')
      // redirigir al panel principal del socio después de mostrar toast
      setTimeout(() => router.push('/socio'), 1500)
    } catch (err) {
      setToast({ type: 'error', msg: 'El pago fue rechazado. Por favor, verifica los datos o intenta con otra tarjeta.' })
      setForm({ titular: '', numero: '', vencimiento: '', cvv: '' })
      setTimeout(() => setToast(null), 5000)
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

      <div className="max-w-md mx-auto bg-white rounded-xl p-8 shadow-sm border border-gray-200">
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
            
            {toast && (
              <div className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {toast.msg}
              </div>
            )}
          </div>
        </form>
      </div>
    </>
  )
}
