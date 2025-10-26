'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Breadcrumb from '../../components/Breadcrumb'
import { User, Users, CreditCard, Calendar, AlertCircle, CheckCircle, Crown } from 'lucide-react'

interface MiembroFamilia {
  nombre: string
  dni: string
  edad: number
  esMenor: boolean
}

interface PlanInfo {
  tipoSocio: 'INDIVIDUAL' | 'FAMILIAR'
  precioBaseCuota: number
  esCabezaDeFamilia: boolean
  cantidadMiembros?: number
  descuento?: number
  montoSinDescuento?: number
  montoDescuento?: number
  montoTotal?: number
  miembrosFamilia?: MiembroFamilia[]
  cabezaDeFamilia?: string
  mensaje?: string
}

interface SocioInfo {
  nombre: string
  email: string
  dni: string
  fechaAlta: string
}

export default function PlanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [socioInfo, setSocioInfo] = useState<SocioInfo | null>(null)
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null)

  useEffect(() => {
    const fetchPlanInfo = async () => {
      try {
        setLoading(true)
        setError(null)

        const usuarioGuardado = localStorage.getItem('usuario')
        if (!usuarioGuardado) {
          setError('No se encontraron datos de sesión')
          setTimeout(() => router.push('/'), 2000)
          return
        }

        const usuario = JSON.parse(usuarioGuardado)
        const socioId = usuario.id

        const response = await fetch(`/api/socios/plan?socioId=${socioId}`)
        
        if (!response.ok) {
          throw new Error('Error al cargar información del plan')
        }

        const data = await response.json()
        setSocioInfo(data.socio)
        setPlanInfo(data.plan)
      } catch (err) {
        console.error('Error:', err)
        setError('Error al cargar información del plan')
      } finally {
        setLoading(false)
      }
    }

    fetchPlanInfo()
  }, [router])

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando información...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !planInfo || !socioInfo) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertCircle className="text-red-600 mx-auto mb-4" size={48} />
            <p className="text-red-600 mb-4">{error || 'No se pudo cargar la información'}</p>
            <button
              onClick={() => router.push('/socio')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    )
  }

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Breadcrumb items={[
          { label: 'Panel Principal', href: '/socio' },
          { label: 'Plan', active: true }
        ]} />
        <h1 className="text-3xl font-bold text-gray-900 mt-4">Mi Plan</h1>
        <p className="text-sm text-gray-500 mt-2">Información detallada de tu membresía</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarjeta tipo de plan */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <div className="flex items-center gap-3 text-white">
                {planInfo.tipoSocio === 'FAMILIAR' ? (
                  <Users size={24} />
                ) : (
                  <User size={24} />
                )}
                <div>
                  <h2 className="text-xl font-bold">
                    Plan {planInfo.tipoSocio === 'INDIVIDUAL' ? 'Individual' : 'Familiar'}
                  </h2>
                  <p className="text-blue-100 text-sm">
                    {planInfo.tipoSocio === 'INDIVIDUAL' 
                      ? 'Membresía personal' 
                      : planInfo.esCabezaDeFamilia 
                        ? 'Cabeza de familia' 
                        : 'Miembro del grupo familiar'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Información según tipo de socio */}
              {planInfo.tipoSocio === 'INDIVIDUAL' ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                    <CheckCircle className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                    <div>
                      <p className="font-medium text-gray-900">Plan Individual Activo</p>
                      <p className="text-sm text-gray-600 mt-1">
                        Disfruta de acceso completo a todas las instalaciones y actividades del club.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Cuota Mensual</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${planInfo.precioBaseCuota.toLocaleString('es-AR')}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Miembros</p>
                      <p className="text-2xl font-bold text-gray-900">1</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Si es cabeza de familia */}
                  {planInfo.esCabezaDeFamilia ? (
                    <>
                      <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <Crown className="text-amber-600 flex-shrink-0 mt-1" size={20} />
                        <div>
                          <p className="font-semibold text-gray-900">Usted es el cabeza de familia</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Está encargado de pagar la cuota mensual de todo el grupo familiar. 
                            El monto incluye un descuento del {planInfo.descuento}% por plan familiar.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2">
                          <span className="text-gray-600">Cuota base x {planInfo.cantidadMiembros} miembros</span>
                          <span className="font-medium">${planInfo.montoSinDescuento?.toLocaleString('es-AR')}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 text-green-600">
                          <span>Descuento familiar ({planInfo.descuento}%)</span>
                          <span className="font-medium">-${planInfo.montoDescuento?.toLocaleString('es-AR')}</span>
                        </div>
                        <div className="border-t-2 border-gray-200 pt-3 flex justify-between items-center">
                          <span className="text-lg font-semibold text-gray-900">Total a pagar</span>
                          <span className="text-2xl font-bold text-blue-600">
                            ${planInfo.montoTotal?.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-800">
                          <span className="font-semibold">Ahorro mensual:</span> $
                          {planInfo.montoDescuento?.toLocaleString('es-AR')} gracias al descuento familiar
                        </p>
                      </div>
                    </>
                  ) : (
                    // Si NO es cabeza de familia
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                        <Users className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                        <div>
                          <p className="font-medium text-gray-900">Miembro del Grupo Familiar</p>
                          <p className="text-sm text-gray-600 mt-1">{planInfo.mensaje}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Responsable de pago</p>
                        <p className="text-lg font-semibold text-gray-900">{planInfo.cabezaDeFamilia}</p>
                      </div>

                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-sm text-green-800">
                          ✓ Tu cuota está incluida en el plan familiar con descuento del {planInfo.descuento}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Miembros del grupo familiar (solo si es cabeza) */}
          {planInfo.tipoSocio === 'FAMILIAR' && planInfo.esCabezaDeFamilia && planInfo.miembrosFamilia && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Miembros del Grupo Familiar</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {planInfo.cantidadMiembros} {planInfo.cantidadMiembros === 1 ? 'miembro' : 'miembros'} en total
                </p>
              </div>
              <div className="divide-y divide-gray-200">
                {planInfo.miembrosFamilia.map((miembro, index) => (
                  <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <User size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{miembro.nombre}</p>
                          <p className="text-sm text-gray-500">DNI: {miembro.dni}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">{miembro.edad} años</p>
                        {miembro.esMenor && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                            Menor
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar derecho */}
        <div className="space-y-6">
          {/* Información del socio */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Personal</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Nombre</p>
                <p className="font-medium text-gray-900">{socioInfo.nombre}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">DNI</p>
                <p className="font-medium text-gray-900">{socioInfo.dni}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900 text-sm break-words">{socioInfo.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Socio desde</p>
                <p className="font-medium text-gray-900">{formatFecha(socioInfo.fechaAlta)}</p>
              </div>
            </div>
          </div>

          {/* Beneficios */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Beneficios Incluidos</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-gray-700">Acceso a todas las instalaciones</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-gray-700">Inscripción a prácticas deportivas</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-gray-700">Reserva de canchas</p>
              </div>
              {planInfo.tipoSocio === 'FAMILIAR' && (
                <div className="flex items-start gap-2">
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-gray-700">30% de descuento en cuota familiar</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
