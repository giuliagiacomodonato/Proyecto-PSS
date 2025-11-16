"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Breadcrumb from '../../components/Breadcrumb'
import { CreditCard, CheckSquare, AlertCircle, Loader2 } from 'lucide-react'

interface CuotaImpaga {
  id: number
  concepto: string
  periodo: string
  mes: number
  anio: number
  monto: number
  montoOriginal: number
  vencimiento: string
  tipoSocio: string
}

interface CuotasData {
  cuotas: CuotaImpaga[]
  tipoSocio: string
  precioBase: number
  descuento: number
  cantidadFamiliares: number
  montoConDescuento: number
}

export default function PagoCuotaSocioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cuotasData, setCuotasData] = useState<CuotasData | null>(null)
  const [cuotasSeleccionadas, setCuotasSeleccionadas] = useState<Set<number>>(new Set())
  const [usuarioSocioId, setUsuarioSocioId] = useState<number | null>(null)

  useEffect(() => {
    // Obtener el usuarioSocioId del localStorage
    const usuarioGuardado = localStorage.getItem('usuario')
    if (!usuarioGuardado) {
      setError('No se encontraron datos de sesión. Por favor, inicie sesión nuevamente.')
      setTimeout(() => router.push('/'), 2000)
      return
    }

    const usuarioData = JSON.parse(usuarioGuardado)
    
    // Verificar que el rol sea SOCIO
    if (usuarioData.rol !== 'SOCIO') {
      setError('Acceso denegado. Esta funcionalidad es solo para socios.')
      setTimeout(() => router.push('/'), 2000)
      return
    }

    setUsuarioSocioId(usuarioData.id)
  }, [router])

  useEffect(() => {
    const fetchCuotasImpagas = async () => {
      if (!usuarioSocioId) return

      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/socios/cuotas-impagas?socioId=${usuarioSocioId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Socio no encontrado')
          } else {
            const data = await response.json()
            setError(data.error || 'Error al cargar las cuotas')
          }
          return
        }

        const data = await response.json()
        setCuotasData(data)

        // Si no hay cuotas impagas, redirigir al dashboard
        if (data.cuotas.length === 0) {
          setError('No tienes cuotas impagas pendientes')
          setTimeout(() => router.push('/socio'), 2000)
        }
      } catch (err) {
        console.error('Error al cargar cuotas:', err)
        setError('Error al conectar con el servidor')
      } finally {
        setLoading(false)
      }
    }

    fetchCuotasImpagas()
  }, [usuarioSocioId, router])

  const toggleCuota = (cuotaId: number) => {
    const nuevasSeleccionadas = new Set(cuotasSeleccionadas)
    if (nuevasSeleccionadas.has(cuotaId)) {
      nuevasSeleccionadas.delete(cuotaId)
    } else {
      nuevasSeleccionadas.add(cuotaId)
    }
    setCuotasSeleccionadas(nuevasSeleccionadas)
  }

  const calcularTotal = () => {
    if (!cuotasData) return 0
    return cuotasSeleccionadas.size * cuotasData.montoConDescuento
  }

  const handlePagar = () => {
    if (cuotasSeleccionadas.size === 0) {
      setError('Debe seleccionar al menos una cuota para pagar')
      return
    }

    // Guardar información del pago en sessionStorage para el formulario de tarjeta
    const cuotasAPagar = cuotasData?.cuotas.filter(c => cuotasSeleccionadas.has(c.id)) || []
    const datosPago = {
      cuotas: cuotasAPagar.map(c => ({
        id: c.id,
        periodo: c.periodo,
        monto: c.monto
      })),
      total: calcularTotal(),
      tipoUsuario: cuotasData?.tipoSocio || 'SOCIO'
    }

    sessionStorage.setItem('pagoCuotaPendiente', JSON.stringify(datosPago))
    
    // Redirigir al formulario de pago con query param
    router.push('/socio/pagoSocio?tipo=CUOTA_MENSUAL')
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
            <p className="text-gray-600">Cargando cuotas...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="text-red-600 mx-auto mb-4" size={48} />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/socio')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Volver al Panel Principal
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!cuotasData || cuotasData.cuotas.length === 0) {
    return null
  }

  const total = calcularTotal()

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Panel Principal', href: '/socio' },
          { label: 'Pagos' },
          { label: 'Cuota Socio', active: true }
        ]} />
      </div>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cuota Socio</h1>
        <p className="text-gray-600">
          Selecciona las cuotas mensuales que deseas pagar
        </p>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header Section */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard size={20} className="text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Cuotas a pagar</h2>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">Tipo de Socio:</span>{' '}
                <span className="capitalize">{cuotasData.tipoSocio.toLowerCase()}</span>
                {cuotasData.tipoSocio === 'FAMILIAR' && cuotasData.descuento > 0 && (
                  <span className="ml-2 text-green-600 font-medium">
                    (Descuento {cuotasData.descuento}%)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Cuotas List */}
          <div className="divide-y divide-gray-200">
            {cuotasData.cuotas.map((cuota) => (
              <div
                key={cuota.id}
                className="px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <label className="flex items-start gap-4 cursor-pointer">
                  <div className="flex items-center h-6">
                    <input
                      type="checkbox"
                      checked={cuotasSeleccionadas.has(cuota.id)}
                      onChange={() => toggleCuota(cuota.id)}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900">{cuota.concepto}</p>
                      <p className="text-lg font-semibold text-gray-900">
                        ${cuota.monto.toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Vencimiento: {cuota.vencimiento}</span>
                      {cuota.tipoSocio === 'FAMILIAR' && cuota.montoOriginal !== cuota.monto && (
                        <span className="text-green-600">
                          Precio original: ${cuota.montoOriginal.toLocaleString('es-AR')}
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-6 py-5 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-gray-600">
                <p className="mb-1">
                  <span className="font-medium">Cuotas seleccionadas:</span>{' '}
                  {cuotasSeleccionadas.size} de {cuotasData.cuotas.length}
                </p>
                {cuotasData.tipoSocio === 'FAMILIAR' && cuotasData.cantidadFamiliares > 1 && (
                  <p className="text-xs text-gray-500">
                    Plan familiar: {cuotasData.cantidadFamiliares} miembros con {cuotasData.descuento}% de descuento
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Total a pagar:</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${total.toLocaleString('es-AR')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/socio')}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handlePagar}
                disabled={cuotasSeleccionadas.size === 0}
                className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <CheckSquare size={20} />
                Pagar
              </button>
            </div>

            {cuotasSeleccionadas.size === 0 && (
              <p className="mt-3 text-sm text-center text-gray-500">
                Selecciona al menos una cuota para continuar
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
