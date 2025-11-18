"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Breadcrumb from '../../../components/Breadcrumb'
import AdminLayout from '../../../components/AdminLayout'

interface Practica {
  id: number
  nombre: string
  precio: number
}

export default function ModifPrecios() {
  const router = useRouter()
  const [practicas, setPracticas] = useState<Practica[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [precios, setPrecios] = useState<{ [key: number]: string }>({})
  const [errors, setErrors] = useState<{ [key: number]: string }>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [toast, setToast] = useState<{ type: 'error' | 'success'; msg: string } | null>(null)
  const [usuario, setUsuario] = useState<any>(null)

  useEffect(() => {
    const verificarUsuario = () => {
      try {
        const usuarioGuardado = localStorage.getItem('usuario')
        if (usuarioGuardado) {
          const usuarioData = JSON.parse(usuarioGuardado)
          if (usuarioData.rol !== 'ADMIN' && usuarioData.rol !== 'SUPER_ADMIN') {
            router.push('/')
            return
          }
          setUsuario(usuarioData)
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Error verificando usuario:', error)
        router.push('/login')
      }
    }
    verificarUsuario()
  }, [router])

  useEffect(() => {
    const fetchPracticas = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/practicas')
        if (!response.ok) throw new Error('Error al cargar prácticas')
        
        const data = await response.json()
        // El endpoint devuelve un array directo
        const practicasList = Array.isArray(data) ? data : (data.practicas || [])
        setPracticas(practicasList)
        
        const preciosIniciales: { [key: number]: string } = {}
        practicasList.forEach((practica: Practica) => {
          preciosIniciales[practica.id] = practica.precio.toString()
        })
        setPrecios(preciosIniciales)
      } catch (error) {
        console.error('Error:', error)
        setToast({ type: 'error', msg: 'Error al cargar las prácticas' })
      } finally {
        setLoading(false)
      }
    }

    fetchPracticas()
  }, [])

  const handlePrecioChange = (id: number, valor: string) => {
    const newErrors = { ...errors }
    
    if (valor === '') {
      delete newErrors[id]
    } else {
      const numValue = parseFloat(valor)
      if (isNaN(numValue) || numValue < 0) {
        newErrors[id] = 'Debe ser un número positivo'
      } else {
        delete newErrors[id]
      }
    }

    setErrors(newErrors)
    setPrecios({ ...precios, [id]: valor })

    const tieneChanges = Object.keys(precios).some(key => {
      const id = parseInt(key)
      const practicaOriginal = practicas.find(p => p.id === id)
      return practicaOriginal && precios[id] !== practicaOriginal.precio.toString()
    })

    setHasChanges(tieneChanges || (precios[id] !== practicas.find(p => p.id === id)?.precio.toString()))
  }

  const handleGuardar = async () => {
    if (Object.keys(errors).length > 0) {
      setToast({ type: 'error', msg: 'Hay errores en los precios ingresados' })
      return
    }

    try {
      setSaving(true)

      const actualizaciones = Object.keys(precios)
        .map(id => parseInt(id))
        .filter(id => {
          const practicaOriginal = practicas.find(p => p.id === id)
          return practicaOriginal && precios[id] !== practicaOriginal.precio.toString()
        })
        .map(id => ({
          id,
          precio: parseInt(precios[id])
        }))

      if (actualizaciones.length === 0) {
        setToast({ type: 'error', msg: 'No hay cambios para guardar' })
        setSaving(false)
        return
      }

      const response = await fetch('/api/practicas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actualizaciones })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Error al guardar')
      }

      setToast({ type: 'success', msg: 'Precios actualizados exitosamente' })
      setHasChanges(false)

      setTimeout(() => setToast(null), 3000)
    } catch (error) {
      console.error('Error:', error)
      setToast({ type: 'error', msg: 'Error al guardar los cambios' })
    } finally {
      setSaving(false)
    }
  }

  if (!usuario) {
    return (
      <AdminLayout rol="ADMIN">
        <div className="flex justify-center items-center h-screen">
          <div className="text-gray-600">Verificando acceso...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout rol="ADMIN">
      <div className="max-w-4xl">
        <div className="mb-8">
          <Breadcrumb items={[
            { label: 'Panel Principal', href: '/admin' },
            { label: 'Modificar Precios', active: true }
          ]} />
          <h1 className="text-3xl font-bold text-gray-900 mt-4">Modificar Precios</h1>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-600">Cargando prácticas...</div>
        ) : practicas.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800">No hay prácticas deportivas registradas</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-semibold mb-8 text-gray-900">Prácticas Deportivas</h2>

              <div className="space-y-6">
                {practicas.map(practica => (
                  <div key={practica.id} className="flex items-center gap-8">
                    <div className="flex-1">
                      <label className="text-gray-700 font-medium">{practica.nombre}</label>
                    </div>
                    <div className="w-48">
                      <label className="block text-sm text-gray-600 mb-1">Precio</label>
                      <input
                        type="number"
                        value={precios[practica.id] || ''}
                        onChange={(e) => handlePrecioChange(practica.id, e.target.value)}
                        placeholder="editable"
                        min="0"
                        step="0.01"
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors[practica.id] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors[practica.id] && (
                        <p className="text-red-500 text-sm mt-1">{errors[practica.id]}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 mt-8 pt-6">
              <button
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleGuardar}
                  disabled={!hasChanges || saving || Object.keys(errors).length > 0}
                  className={`px-8 py-2 rounded-lg font-semibold transition-colors ${
                    hasChanges && Object.keys(errors).length === 0
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>

                {toast && toast.type === 'success' && (
                  <div className="px-3 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-800 whitespace-nowrap">
                    ✓ {toast.msg}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
