"use client"

import React from 'react'
import { useRouter } from 'next/navigation'
import Breadcrumb from '../../components/Breadcrumb'
import { CreditCard, Dumbbell } from 'lucide-react'

export default function PagosPage() {
  const router = useRouter()

  const handlePagoCuota = () => {
    router.push('/socio/pagoSocio?tipo=cuota')
  }

  const handlePagoPractica = () => {
    router.push('/socio/pagoSocio?tipo=practica')
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
    </>
  )
}
