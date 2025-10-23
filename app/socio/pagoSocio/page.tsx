"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

type Form = {
  titular: string
  numero: string
  vencimiento: string
  cvv: string
}

export default function PagoSocio() {
  const router = useRouter()
  const [form, setForm] = useState<Form>({ titular: '', numero: '', vencimiento: '', cvv: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({})
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'error' | 'success'; msg: string } | null>(null)

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
      const payload = { titular: form.titular, last4, monto: 10000, concepto: 'Reserva Cancha', reservaId: 1 }
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
      // redirigir al panel principal del socio después de mostrar toast
      setTimeout(() => router.push('/socio'), 1500)
    } catch (err) {
      setToast({ type: 'error', msg: 'Error de conexión con la pasarela.' })
      setForm({ titular: '', numero: '', vencimiento: '', cvv: '' })
      setTimeout(() => setToast(null), 5000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/90 rounded-xl p-6 shadow">
        <h2 className="text-2xl font-semibold mb-4">Pagar Reserva</h2>

        <div className="mb-4 text-sm text-gray-700">
          <div>Concepto: <strong>Reserva Cancha</strong></div>
          <div>Fecha: <strong>--/--/----</strong></div>
          <div>Hora: <strong>--:--</strong></div>
          <div>Monto a pagar: <strong>$10000</strong></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm">Nombre del titular</label>
            <input value={form.titular} onChange={(e) => setForm({ ...form, titular: e.target.value })} className={`w-full p-2 border rounded ${errors.titular ? 'border-red-500' : 'border-gray-300'}`} />
            {errors.titular && <p className="text-red-500 text-sm">{errors.titular}</p>}
          </div>

          <div>
            <label className="block text-sm">Número de la tarjeta</label>
            <input value={form.numero} onChange={(e) => setForm({ ...form, numero: e.target.value })} placeholder="1234123412341234" className={`w-full p-2 border rounded ${errors.numero ? 'border-red-500' : 'border-gray-300'}`} />
            {errors.numero && <p className="text-red-500 text-sm">{errors.numero}</p>}
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm">Fecha de vencimiento</label>
              <input value={form.vencimiento} onChange={(e) => setForm({ ...form, vencimiento: e.target.value })} placeholder="MM/AAAA" className={`w-full p-2 border rounded ${errors.vencimiento ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.vencimiento && <p className="text-red-500 text-sm">{errors.vencimiento}</p>}
            </div>
            <div style={{ width: 120 }}>
              <label className="block text-sm">CVV</label>
              <input value={form.cvv} onChange={(e) => setForm({ ...form, cvv: e.target.value })} placeholder="123" className={`w-full p-2 border rounded ${errors.cvv ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.cvv && <p className="text-red-500 text-sm">{errors.cvv}</p>}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-4">
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{loading ? 'Procesando...' : 'Pagar'}</button>
          </div>
        </form>

        {toast && (
          <div className={`fixed right-6 bottom-6 max-w-xs p-3 rounded shadow-lg text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {toast.msg}
          </div>
        )}
      </div>
    </div>
  )
}
