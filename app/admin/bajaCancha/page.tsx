'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/app/components/Sidebar'
import { User, Trash2, AlertTriangle } from 'lucide-react'
import { useAdminProtection } from '@/app/hooks/useAdminProtection'

interface Cancha {
  id: number
  nombre: string
  tipo: string
  ubicacion: string
  precio: number
}

export default function BajaCanchaPage() {
  const router = useRouter()
  const { isAuthorized, isChecking } = useAdminProtection()

  const [canchaId, setCanchaId] = useState('')
  const [canchas, setCanchas] = useState<Cancha[]>([])
  const [canchaSeleccionada, setCanchaSeleccionada] = useState<Cancha | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingCanchas, setLoadingCanchas] = useState(true)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Cargar canchas al montar el componente
  useEffect(() => {
    cargarCanchas()
  }, [])

  const cargarCanchas = async () => {
    try {
      setLoadingCanchas(true)
      const response = await fetch('/api/canchas')
      
      if (!response.ok) {
        throw new Error('Error al cargar canchas')
      }

      const data = await response.json()
      setCanchas(data.canchas || [])
    } catch (error) {
      console.error('Error al cargar canchas:', error)
    } finally {
      setLoadingCanchas(false)
    }
  }

  // Cuando se selecciona una cancha del dropdown
  const handleCanchaChange = (id: string) => {
    setCanchaId(id)
    
    if (id) {
      const cancha = canchas.find(c => c.id === parseInt(id))
      setCanchaSeleccionada(cancha || null)
    } else {
      setCanchaSeleccionada(null)
    }
  }

  // Abrir modal de confirmación
  const handleConfirmarBaja = () => {
    if (!canchaSeleccionada) {
      console.error('Debe seleccionar una cancha')
      return
    }
    setShowConfirmModal(true)
  }

  // Cancelar en el modal
  const handleCancelarModal = () => {
    setShowConfirmModal(false)
  }

  // Eliminar cancha
  const eliminarCancha = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/canchas?id=${canchaSeleccionada?.id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Error al eliminar cancha')
      }

      // Cerrar modal de confirmación
      setShowConfirmModal(false)

      // Mostrar mensaje de éxito al lado del botón
      setSuccessMessage('¡Cancha eliminada exitosamente!')
      
      // Limpiar formulario
      setCanchaId('')
      setCanchaSeleccionada(null)

      // Recargar lista de canchas
      await cargarCanchas()

      // Redirigir al dashboard después de 3 segundos
      setTimeout(() => {
        router.push('/admin')
      }, 3000)

    } catch (error) {
      // Cerrar modal de confirmación en caso de error
      setShowConfirmModal(false)
      console.error('Error al eliminar cancha:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/admin')
  }

  // Mostrar pantalla de carga mientras verifica
  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  // No renderizar nada si no está autorizado
  if (!isAuthorized) {
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
            Panel Principal &gt; Canchas &gt; Eliminar Cancha
          </div>

          <h2 className="text-2xl font-semibold text-gray-800">Eliminar Cancha</h2>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-2xl">
          {/* Campo Buscar Cancha */}
          <div className="mb-6">
            <label htmlFor="cancha" className="block text-sm font-medium text-gray-700 mb-2">
              Buscar Cancha <span className="text-red-500">*</span>
            </label>
            <select
              id="cancha"
              value={canchaId}
              onChange={(e) => handleCanchaChange(e.target.value)}
              disabled={loadingCanchas}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccione</option>
              {canchas.map((cancha) => (
                <option key={cancha.id} value={cancha.id}>
                  {cancha.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Información de la cancha seleccionada */}
          {canchaSeleccionada && (
            <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Datos de la Cancha
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Nombre:</span>
                  <p className="font-medium text-gray-900">{canchaSeleccionada.nombre}</p>
                </div>
                <div>
                  <span className="text-gray-500">Tipo:</span>
                  <p className="font-medium text-gray-900">{canchaSeleccionada.tipo}</p>
                </div>
                <div>
                  <span className="text-gray-500">Ubicación:</span>
                  <p className="font-medium text-gray-900">{canchaSeleccionada.ubicacion}</p>
                </div>
                <div>
                  <span className="text-gray-500">Precio:</span>
                  <p className="font-medium text-gray-900">${canchaSeleccionada.precio}</p>
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
            <div className="flex-1 flex items-center gap-3">
              <button
                type="button"
                onClick={handleConfirmarBaja}
                disabled={!canchaSeleccionada || loading}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                Confirmar Baja
              </button>
              {successMessage && (
                <div className="px-3 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-lg whitespace-nowrap">
                  ✓ {successMessage}
                </div>
              )}
            </div>
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
                  Confirmar Baja de Cancha
                </h3>
              </div>

              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas eliminar esta cancha? 
                Esta acción <strong>no se puede deshacer</strong> y se eliminarán <strong>todas las reservas</strong> asociadas.
              </p>

              {canchaSeleccionada && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Se eliminará:</p>
                  <p className="font-semibold text-gray-900 text-lg">{canchaSeleccionada.nombre}</p>
                  <p className="text-sm text-gray-600 mt-1">Tipo: {canchaSeleccionada.tipo}</p>
                  <p className="text-sm text-gray-600">Ubicación: {canchaSeleccionada.ubicacion}</p>
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
                  onClick={eliminarCancha}
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

    </div>
  )
}
