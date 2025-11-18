'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminProtection } from '@/app/hooks/useAdminProtection'
import Sidebar from '@/app/components/Sidebar'
import { User, Search, Trash2, AlertTriangle, Check } from 'lucide-react'

interface Entrenador {
  id: number
  nombre: string
  dni: string
  email: string
  fechaNacimiento: string
  telefono: string
  fechaAlta: string
  practicaDeportiva?: {
    id: number
    nombre: string
  }
}

export default function BajaEntrenadorPage() {
  const router = useRouter()
  // ✅ Verificar que sea admin ANTES de renderizar
  const { isAuthorized, isChecking } = useAdminProtection()

  const [dni, setDni] = useState('')
  const [fechaBaja, setFechaBaja] = useState('')
  const [entrenador, setEntrenador] = useState<Entrenador | null>(null)
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
    const digits = value.replace(/\D/g, '').slice(0, 8)
    setDni(digits)
    setEntrenador(null)
    
    // Limpiar error si el DNI está correcto
    if (digits && /^\d{7,8}$/.test(digits)) {
      setErrors({})
    }
  }

  // Buscar entrenador por DNI
  const buscarEntrenador = async () => {
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
    setMensaje(null)

    try {
      const response = await fetch(`/api/entrenadores?dni=${dni}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al buscar entrenador')
      }

      // Verificar que sea entrenador
      if (data.rol !== 'ENTRENADOR') {
        throw new Error('El DNI no corresponde a un entrenador')
      }

      setEntrenador(data)
      setMensaje('Entrenador encontrado')
      setMensajeTipo('info')

    } catch (error) {
      setMensaje(error instanceof Error ? error.message : 'Error al buscar entrenador')
      setMensajeTipo('error')
      setEntrenador(null)
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
  }

  // Eliminar entrenador
  const eliminarEntrenador = async () => {
    setLoading(true)

    try {
      // Obtener el ID del administrador autenticado desde localStorage
      const usuarioRaw = typeof window !== 'undefined' ? localStorage.getItem('usuario') : null
      let realizadoPorId = null
      
      if (usuarioRaw) {
        const usuario = JSON.parse(usuarioRaw)
        realizadoPorId = usuario.id
      }

      const response = await fetch('/api/entrenadores', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          dni: entrenador?.dni,
          realizadoPorId: realizadoPorId 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar entrenador')
      }

      // Cerrar modal de confirmación
      setShowConfirmModal(false)

      // Mostrar mensaje de éxito
      setMensaje('¡Entrenador eliminado exitosamente!')
      setMensajeTipo('success')
      
      // Limpiar formulario
      setDni('')
      setEntrenador(null)

      // Redirigir al dashboard después de 3 segundos
      setTimeout(() => {
        router.push('/admin')
      }, 3000)

    } catch (error) {
      // Cerrar modal de confirmación en caso de error
      setShowConfirmModal(false)
      
      setMensaje(error instanceof Error ? error.message : 'Error al eliminar entrenador')
      setMensajeTipo('error')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setDni('')
    setEntrenador(null)
    setErrors({})
    setShowConfirmModal(false)
    setMensaje(null)
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
            Panel Principal &gt; Entrenador &gt; Eliminar Entrenador
          </div>

          <h2 className="text-2xl font-semibold text-gray-800">Eliminar Entrenador</h2>
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
                    buscarEntrenador()
                  }
                }}
                placeholder="Ingrese el DNI del entrenador"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
              <button
                type="button"
                onClick={buscarEntrenador}
                disabled={!dni || !/^\d{7,8}$/.test(dni) || searching}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {searching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Buscando...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Buscar</span>
                  </>
                )}
              </button>
            </div>
            {errors.dni && (
              <p className="mt-2 text-sm text-red-600">{errors.dni}</p>
            )}
          </div>

          {/* Campo Fecha de Baja (solo lectura) */}
          <div className="mb-6">
            <label htmlFor="fechaBaja" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de Baja
            </label>
            <input
              type="text"
              id="fechaBaja"
              value={fechaBaja}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
            />
          </div>

          {/* Datos del Entrenador (solo si fue encontrado) */}
          {entrenador && (
            <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Datos del Entrenador</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="font-medium text-gray-900">{entrenador.nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">DNI</p>
                  <p className="font-medium text-gray-900">{entrenador.dni}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{entrenador.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-medium text-gray-900">{entrenador.telefono}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Nacimiento</p>
                  <p className="font-medium text-gray-900">{formatearFecha(entrenador.fechaNacimiento)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Alta</p>
                  <p className="font-medium text-gray-900">{formatearFecha(entrenador.fechaAlta)}</p>
                </div>
                {entrenador.practicaDeportiva && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Práctica Deportiva</p>
                    <p className="font-medium text-gray-900">{entrenador.practicaDeportiva.nombre}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mensaje de estado */}
          {mensaje && (
            <div className={`mb-6 p-4 rounded-md ${
              mensajeTipo === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
              mensajeTipo === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
              'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              <p className="text-sm font-medium">{mensaje}</p>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmarBaja}
              disabled={!entrenador || loading}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Confirmar Baja
            </button>
          </div>
        </div>
      </main>

      {/* Modal de confirmación */}
      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl border-2 border-gray-300 p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
              Confirmar Baja Entrenador
            </h3>

            <p className="text-gray-700 mb-4 text-center">
              ¿Está seguro que desea eliminar el entrenador?
            </p>

            <p className="text-gray-700 mb-8 text-center">
              <span className="font-medium">DNI:</span> {entrenador?.dni || ''}
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={eliminarEntrenador}
                disabled={loading}
                className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    Confirmar
                  </>
                )}
              </button>
              <button
                onClick={handleCancelarModal}
                disabled={loading}
                className="px-6 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
