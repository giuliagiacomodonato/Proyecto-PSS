'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminProtection } from '@/app/hooks/useAdminProtection'
import Sidebar from '@/app/components/Sidebar'
import { User } from 'lucide-react'


export default function BajaSocioPage() {
  const router = useRouter()
  // ✅ Verificar que sea admin ANTES de renderizar
  const { isAuthorized, isChecking } = useAdminProtection()

  const [dni, setDni] = useState('')
  const [fechaBaja, setFechaBaja] = useState('')
  const [loading, setLoading] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [errors, setErrors] = useState<{ dni?: string }>({})
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [mensajeTipo, setMensajeTipo] = useState<'success' | 'error'>('success')

  // Al montar el componente, establecer la fecha actual formateada
  useEffect(() => {
    const hoy = new Date()
    const fechaFormateada = hoy.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    setFechaBaja(fechaFormateada)
  }, [])


  // Maneja el cambio de valor del campo DNI y valida formato
  const handleDniChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0,8)
    setDni(digits)
    if (value && /^\d{7,8}$/.test(value)) {
      setErrors({})
    }
  }

  // Función que valida el DNI y busca el socio en la base de datos
  // Si existe, muestra el modal de confirmación
  const handleConfirmarBaja = async () => {
    if (!dni.trim()) {
      setErrors({ dni: 'El DNI es requerido' })
      return
    }
    if (!/^\d{7,8}$/.test(dni)) {
      setErrors({ dni: 'El DNI debe tener 7 u 8 dígitos' })
      return
    }
    setLoading(true)
    try {
      const response = await fetch(`/api/socios?dni=${dni}`)
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Error al buscar socio')
      }
      if (!data.socio) {
        throw new Error('No se encontró ningún socio con ese DNI')
      }
      setShowConfirmModal(true)
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : 'Error al buscar socio')
      setMensajeTipo('error')
    } finally {
      setLoading(false)
    }
  }

  // Cierra el modal de confirmación
  const handleCancelarModal = () => {
    setShowConfirmModal(false)
  }

  // Llama al endpoint DELETE para eliminar el socio
  // Muestra toast de éxito o error y redirige al panel principal
  const eliminarSocio = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/socios?dni=${dni}`, {
        method: 'DELETE'
      })
      let mensaje = '¡Socio eliminado exitosamente!'
      if (!response.ok) {
        try {
          const data = await response.json()
          mensaje = data.message || `Error: ${response.status} ${response.statusText}`
        } catch {
          mensaje = `Error: ${response.status} ${response.statusText}`
        }
        throw new Error(mensaje)
      }
      setShowConfirmModal(false)
  setMensaje(mensaje)
  setMensajeTipo('success')
      setDni('')
      setTimeout(() => {
        router.push('/admin')
      }, 3000)
    } catch (error) {
      setShowConfirmModal(false)
      setMensaje(error instanceof Error ? error.message : 'Error al eliminar socio')
      setMensajeTipo('error')
    } finally {
      setLoading(false)
    }
  }

  // Limpia el campo DNI y errores
  const handleCancel = () => {
    setDni('')
    setErrors({})
  }

  // ✅ Mostrar pantalla de carga mientras verifica
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  // ✅ No renderizar nada si no está autorizado
  if (!isAuthorized) {
    return null
  }

  // Renderiza la interfaz de baja de socio
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Barra lateral de navegación */}
      <Sidebar />
      <main className="flex-1 p-8">
        {/* Header y breadcrumb */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Gestor Club Deportivo</h1>
            <div className="flex items-center gap-2 text-gray-600 bg-white px-3 py-2 rounded-full border border-gray-200">
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-sm">Usuario Admin</span>
            </div>
          </div>
          <div className="text-sm text-gray-500 mb-6">
            Panel Principal &gt; Administrador &gt; Eliminar Socio
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">Eliminar Socio</h2>
        </div>
        {/* Formulario para ingresar DNI y confirmar baja */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-2xl">
          <div className="mb-6">
            <label htmlFor="dni" className="block text-sm font-medium text-gray-700 mb-2">
              DNI <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="dni"
              value={dni}
              onChange={(e) => handleDniChange(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleConfirmarBaja()
                }
              }}
              placeholder="Ingrese el DNI del socio"
              maxLength={8}
              className={`w-full px-4 py-3 border rounded-lg shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.dni ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.dni && (
              <p className="mt-1 text-sm text-red-600">{errors.dni}</p>
            )}
          </div>
          <div className="mb-6">
            <label htmlFor="fechaBaja" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Baja
            </label>
            <input
              type="text"
              id="fechaBaja"
              value={fechaBaja}
              readOnly
              disabled
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100 text-gray-600 cursor-not-allowed"
            />
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmarBaja}
              disabled={!dni || loading}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Procesando...' : 'Confirmar Baja'}
            </button>
          </div>
        </div>
      </main>
      {/* Modal de confirmación para eliminar socio */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full transform transition-all">
            <div className="p-6 text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Confirmar Baja Socio
              </h3>
              <p className="text-gray-600 mb-2">
                ¿Estás seguro de que desea eliminar a este socio?
              </p>
              <p className="text-gray-600 mb-1">
                DNI: {dni}
              </p>
              <p className="text-gray-600 mb-6 font-medium">
                Esta acción no se puede deshacer
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={eliminarSocio}
                  disabled={loading}
                  className="px-8 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-medium flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Confirmar
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancelarModal}
                  disabled={loading}
                  className="px-8 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-medium"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Mensaje inline de éxito/error */}
      {mensaje && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${mensajeTipo === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {mensaje}
          </div>
        </div>
      )}
    </div>
  )
}