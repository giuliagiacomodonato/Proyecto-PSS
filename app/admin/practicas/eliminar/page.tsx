'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/app/components/Sidebar'
import { User, Trash2, AlertTriangle } from 'lucide-react'
import { useAdminProtection } from '@/app/hooks/useAdminProtection'

interface Practica {
  id: number
  nombre: string
  descripcion?: string
  cupo?: number
  precio?: number
  entrenadores?: Array<{ id: number; nombre: string }>
  horarios?: Array<{ id: number; dia: string; horaInicio: string; horaFin: string }>
}

export default function EliminarPracticaPage() {
  const router = useRouter()
  const { isAuthorized, isChecking } = useAdminProtection()

  const [practicas, setPracticas] = useState<Practica[]>([])
  const [practicaId, setPracticaId] = useState('')
  const [practicaSeleccionada, setPracticaSeleccionada] = useState<Practica | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingPracticas, setLoadingPracticas] = useState(true)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    cargarPracticas()
  }, [])

  const cargarPracticas = async () => {
    try {
      setLoadingPracticas(true)
      const res = await fetch('/api/practicas')
      if (!res.ok) throw new Error('Error cargando prácticas')
      const data = await res.json()
      // la API devuelve un array de prácticas
      setPracticas(Array.isArray(data) ? data : (data.practicas || []))
    } catch (err) {
      console.error('Error al cargar prácticas:', err)
    } finally {
      setLoadingPracticas(false)
    }
  }

  const handlePracticaChange = (id: string) => {
    setPracticaId(id)
    if (!id) {
      setPracticaSeleccionada(null)
      return
    }
    const p = practicas.find(x => x.id === parseInt(id)) || null
    setPracticaSeleccionada(p)
  }

  const handleConfirmarBaja = () => {
    if (!practicaSeleccionada) {
      setErrorMessage('Debe seleccionar una práctica')
      return
    }
    setShowConfirmModal(true)
  }

  const handleCancelarModal = () => {
    setShowConfirmModal(false)
  }

  const eliminarPractica = async () => {
    if (!practicaSeleccionada) return
    setLoading(true)
    setErrorMessage('')

    try {
      const res = await fetch(`/api/practicas?id=${practicaSeleccionada.id}`, {
        method: 'DELETE'
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || 'Error eliminando práctica')
      }

      setShowConfirmModal(false)
      setSuccessMessage('¡Práctica eliminada exitosamente!')
      setPracticaId('')
      setPracticaSeleccionada(null)

      // Recargar lista
      await cargarPracticas()

      // Redirigir al panel principal después de 2.5s
      setTimeout(() => router.push('/admin'), 2500)
    } catch (err: any) {
      console.error('Error al eliminar práctica:', err)
      setErrorMessage(err.message || 'Error desconocido')
      setShowConfirmModal(false)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => router.push('/admin')

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

  if (!isAuthorized) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Gestor Club Deportivo</h1>
            <div className="flex items-center gap-2 text-gray-600 bg-white px-3 py-2 rounded-full border border-gray-200">
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-sm">Usuario Admin</span>
            </div>
          </div>

          <div className="text-sm text-gray-500 mb-6">
            Panel Principal &gt; Prácticas Deportivas &gt; Eliminar Práctica
          </div>

          <h2 className="text-2xl font-semibold text-gray-800">Eliminar Práctica</h2>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-2xl">
          <div className="mb-6">
            <label htmlFor="practica" className="block text-sm font-medium text-gray-700 mb-2">
              Buscar Práctica por Nombre <span className="text-red-500">*</span>
            </label>
            <select
              id="practica"
              value={practicaId}
              onChange={(e) => handlePracticaChange(e.target.value)}
              disabled={loadingPracticas}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleccione</option>
              {practicas.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          {practicaSeleccionada && (
            <div className="mb-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos de la Práctica</h3>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Nombre:</span>
                  <p className="font-medium text-gray-900">{practicaSeleccionada.nombre}</p>
                </div>
                {practicaSeleccionada.descripcion && (
                  <div>
                    <span className="text-gray-500">Descripción:</span>
                    <p className="font-medium text-gray-900">{practicaSeleccionada.descripcion}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Entrenadores asociados:</span>
                  <p className="font-medium text-gray-900">{practicaSeleccionada.entrenadores?.length || 0}</p>
                </div>
                <div>
                  <span className="text-gray-500">Horarios:</span>
                  <p className="font-medium text-gray-900">{practicaSeleccionada.horarios?.length || 0}</p>
                </div>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-4 text-sm text-red-600">{errorMessage}</div>
          )}

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
                disabled={!practicaSeleccionada || loading}
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

      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full transform transition-all">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Confirmar Baja Práctica Deportiva</h3>
              </div>

              <p className="text-gray-600 mb-6">¿Está seguro que desea eliminar la práctica deportiva?</p>

              {practicaSeleccionada && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Se eliminará:</p>
                  <p className="font-semibold text-gray-900 text-lg">{practicaSeleccionada.nombre}</p>
                  <p className="text-sm text-gray-600 mt-1">Entrenadores asociados: {practicaSeleccionada.entrenadores?.length || 0}</p>
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
                  onClick={eliminarPractica}
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
