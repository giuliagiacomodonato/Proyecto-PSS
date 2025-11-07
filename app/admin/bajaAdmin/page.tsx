'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminProtection } from '@/app/hooks/useAdminProtection'
import Sidebar from '@/app/components/Sidebar'
import { User, Trash2, AlertTriangle } from 'lucide-react'

interface Administrador {
  id: number
  nombre: string
  dni: string
  email: string
  fechaNacimiento: string
  telefono: string
  fechaAlta: string
}


export default function BajaAdminPage() {
  const router = useRouter()
  // ✅ Verificar que sea admin ANTES de renderizar
  const { isAuthorized, isChecking, isSuperAdmin } = useAdminProtection()

  // Si se verificó la sesión y el usuario no es super-admin, redirigir al dashboard
  useEffect(() => {
    if (!isChecking && isAuthorized && !isSuperAdmin) {
      router.replace('/admin')
    }
  }, [isChecking, isAuthorized, isSuperAdmin, router])

  const [dni, setDni] = useState('')
  const [fechaBaja, setFechaBaja] = useState('')
  const [administrador, setAdministrador] = useState<Administrador | null>(null)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [errors, setErrors] = useState<{ dni?: string }>({})
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [mensajeTipo, setMensajeTipo] = useState<'success' | 'error' | 'info'>('success')

  // Establecer fecha actual al cargar el componente
  useEffect(() => {
    const hoy = new Date()
    const fechaFormateada = hoy.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    setFechaBaja(fechaFormateada)
  }, [])


  // Validar DNI en tiempo real
  const handleDniChange = (value: string) => {
    setDni(value)
    setAdministrador(null)
    
    // Limpiar error si el DNI está correcto
    if (value && /^\d{7,8}$/.test(value)) {
      setErrors({})
    }
  }

  // Buscar administrador por DNI
  const buscarAdministrador = async () => {
    // Validar DNI
    if (!dni.trim()) {
      setErrors({ dni: 'El DNI es requerido' })
      return
    }

    if (!/^\d{7,8}$/.test(dni)) {
      setErrors({ dni: 'El DNI debe tener 7 u 8 dígitos' })
      return
    }

    setSearching(true)
    setErrors({})

    try {
      const response = await fetch(`/api/administradores?dni=${dni}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al buscar administrador')
      }

      setAdministrador(data.administrador)
  setMensaje('Administrador encontrado')
  setMensajeTipo('info')

    } catch (error) {
      setMensaje(error instanceof Error ? error.message : 'Error al buscar administrador')
      setMensajeTipo('error')
      setAdministrador(null)
    } finally {
      setSearching(false)
    }
  }

  // Abrir modal de confirmación
  const handleConfirmarBaja = () => {
    setShowConfirmModal(true)
  }

  // Cancelar en el modal
  const handleCancelarModal = () => {
    setShowConfirmModal(false)
    // Permanece en la pantalla de baja de administrador
  }

  // Eliminar administrador
  const eliminarAdministrador = async () => {
    setLoading(true)

    try {
      // TODO: Obtener el ID del administrador autenticado desde la sesión
      // Por ahora usamos un ID fijo (1) como ejemplo
      const realizadoPorId = 1

      const response = await fetch('/api/administradores', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          dni: administrador?.dni,
          realizadoPorId: realizadoPorId 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar administrador')
      }

      // Cerrar modal de confirmación
      setShowConfirmModal(false)

      // Mostrar toast de éxito (esquina superior derecha, no bloquea UI)
  setMensaje('¡Administrador eliminado exitosamente!')
  setMensajeTipo('success')
      
      // Limpiar formulario
      setDni('')
      setAdministrador(null)

      // Redirigir al dashboard después de 3 segundos (cuando se cierre el toast)
      setTimeout(() => {
        router.push('/admin')
      }, 3000)

    } catch (error) {
      // Cerrar modal de confirmación en caso de error
      setShowConfirmModal(false)
      
      setMensaje(error instanceof Error ? error.message : 'Error al eliminar administrador')
      setMensajeTipo('error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setDni('')
    setAdministrador(null)
    setErrors({})
    setShowConfirmModal(false)
  }

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
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

  // Solo super-admin puede acceder a esta página
  if (!isSuperAdmin) {
    // Redirigir a dashboard admin
    useEffect(() => {
      router.replace('/admin')
    }, [router])
    return null
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Gestor Club Deportivo</h1>
            <div className="flex items-center gap-2 text-gray-600 bg-white px-3 py-2 rounded-full border border-gray-200">
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-sm">Usuario Admin</span>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="text-sm text-gray-500 mb-6">
            Panel Principal &gt; Administrador &gt; Eliminar Administrador
          </div>

          <h2 className="text-2xl font-semibold text-gray-800">Eliminar Administrador</h2>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-2xl">
          {/* Campo DNI */}
          <div className="mb-6">
            <label htmlFor="dni" className="block text-sm font-medium text-gray-700 mb-2">
              DNI <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              <input
                type="text"
                id="dni"
                value={dni}
                onChange={(e) => handleDniChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    buscarAdministrador()
                  }
                }}
                placeholder="Ingrese el DNI del administrador"
                maxLength={8}
                className={`flex-1 px-4 py-3 border rounded-lg shadow-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.dni ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              <button
                type="button"
                onClick={buscarAdministrador}
                disabled={searching || !dni}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {searching ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
            {errors.dni && (
              <p className="mt-1 text-sm text-red-600">{errors.dni}</p>
            )}
          </div>

          {/* Campo Fecha de Baja (no editable) */}
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

          {/* Información del administrador encontrado */}
          {administrador && (
            <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Datos del Administrador
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Nombre:</span>
                  <p className="font-medium text-gray-900">{administrador.nombre}</p>
                </div>
                <div>
                  <span className="text-gray-500">DNI:</span>
                  <p className="font-medium text-gray-900">{administrador.dni}</p>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <p className="font-medium text-gray-900">{administrador.email}</p>
                </div>
                <div>
                  <span className="text-gray-500">Teléfono:</span>
                  <p className="font-medium text-gray-900">{administrador.telefono}</p>
                </div>
                <div>
                  <span className="text-gray-500">Fecha de Nacimiento:</span>
                  <p className="font-medium text-gray-900">
                    {formatearFecha(administrador.fechaNacimiento)}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Fecha de Alta:</span>
                  <p className="font-medium text-gray-900">
                    {formatearFecha(administrador.fechaAlta)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botones */}
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
              disabled={!administrador}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Confirmar Baja
            </button>
          </div>
        </div>
      </main>

      {/* Modal de Confirmación - Popup centrado sobre la pantalla */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full transform transition-all">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Confirmar Baja de Administrador
                </h3>
              </div>

              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas eliminar a este administrador? 
                Esta acción <strong>no se puede deshacer</strong>.
              </p>

              {administrador && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Se eliminará a:</p>
                  <p className="font-semibold text-gray-900 text-lg">{administrador.nombre}</p>
                  <p className="text-sm text-gray-600 mt-1">DNI: {administrador.dni}</p>
                  <p className="text-sm text-gray-600">Email: {administrador.email}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelarModal}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={eliminarAdministrador}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:bg-red-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Confirmar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje inline de éxito/error */}
      {mensaje && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${mensajeTipo === 'error' ? 'bg-red-100 text-red-800' : mensajeTipo === 'success' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
            {mensaje}
          </div>
        </div>
      )}
    </div>
  )
}
