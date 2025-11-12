'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Breadcrumb from '../../components/Breadcrumb'
import SidebarEntrenador from '../../components/SidebarEntrenador'

type Practica = {
  id: number
  nombre: string
  descripcion?: string
  precio: number
}

export default function ModificarPreciosEntrenadorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [practica, setPractica] = useState<Practica | null>(null)
  const [precioInput, setPrecioInput] = useState('')
  const [precioOriginal, setPrecioOriginal] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null)

  // flag para evitar flash durante la hidratación
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    // Validar sesión / rol y cargar práctica
    const usuarioRaw = typeof window !== 'undefined' ? localStorage.getItem('usuario') : null
    if (!usuarioRaw) {
      router.replace('/')
      return
    }

    let usuario: any
    try {
      usuario = JSON.parse(usuarioRaw)
    } catch (e) {
      router.replace('/')
      return
    }

    if (usuario.rol !== 'ENTRENADOR') {
      router.replace('/')
      return
    }

    const practicaId = usuario.practicaDeportivaId || usuario.practicaId || null
    if (!practicaId) {
      setError('No tiene ninguna práctica asignada.')
      setLoading(false)
      return
    }

    const fetchPractica = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/practicas?practicaId=${Number(practicaId)}`)
        if (!res.ok) {
          const allRes = await fetch('/api/practicas')
          if (!allRes.ok) throw new Error('Error al obtener práctica')
          const arr = await allRes.json()
          const p = Array.isArray(arr) ? arr.find((x: any) => Number(x.id) === Number(practicaId)) : null
          if (!p) throw new Error('Práctica no encontrada')
          setPractica(p)
          setPrecioInput(String(p.precio))
          setPrecioOriginal(p.precio)
        } else {
          const data = await res.json()
          const p = data?.practica ?? (Array.isArray(data) ? data.find((x: any) => Number(x.id) === Number(practicaId)) : (Array.isArray(data) ? data[0] : data))
          if (!p) {
            const allRes = await fetch('/api/practicas')
            const arr = await allRes.json()
            const p2 = Array.isArray(arr) ? arr.find((x: any) => Number(x.id) === Number(practicaId)) : null
            if (!p2) throw new Error('Práctica no encontrada')
            setPractica(p2)
            setPrecioInput(String(p2.precio))
            setPrecioOriginal(p2.precio)
          } else {
            setPractica(p)
            setPrecioInput(String(p.precio))
            setPrecioOriginal(p.precio)
          }
        }
      } catch (err: any) {
        setError(err?.message || 'Error al cargar la práctica')
      } finally {
        setLoading(false)
      }
    }

    fetchPractica()
  }, [router])

  const validoPrecio = (v: string) => {
    if (!v) return false
    const n = Number(v)
    if (!isFinite(n)) return false
    if (n <= 0) return false
    return true
  }

  const precioCambiado = () => {
    if (precioOriginal === null) return false
    const parsed = Number(precioInput)
    if (!isFinite(parsed)) return false
    return parsed !== precioOriginal
  }

  const handleGuardar = async () => {
    setToast(null)
    if (!practica) return
    if (!validoPrecio(precioInput)) {
      setToast({ type: 'error', msg: 'Ingrese un precio válido (numérico, positivo).' })
      return
    }

    if (!precioCambiado()) {
      setToast({ type: 'error', msg: 'No se detectaron cambios para guardar.' })
      return
    }

    setSaving(true)
    try {
      const body = {
        id: practica.id,
        precio: Number(precioInput)
      }
      const res = await fetch('/api/practicas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Error al guardar precio')
      }

      setToast({ type: 'success', msg: 'Precio actualizado correctamente.' })
      setPrecioOriginal(Number(precioInput))
      setPractica(prev => prev ? { ...prev, precio: Number(precioInput) } : prev)
      setTimeout(() => setToast(null), 3000)
    } catch (err: any) {
      setToast({ type: 'error', msg: err?.message || 'Error al guardar' })
    } finally {
      setSaving(false)
    }
  }

  // Layout con sidebar a la izquierda; overlay cubre solo el main para evitar ocultar sidebar
  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarEntrenador />

      <main className="flex-1 p-12 relative">
        {/* overlay blanco durante hidratación/loading (solo sobre el main) */}
        {!hydrated && (
          <div aria-hidden className="absolute inset-0 bg-white z-50" style={{ pointerEvents: 'none' }} />
        )}

        <div className="max-w-4xl mx-auto">
          <Breadcrumb items={[{ label: 'Panel Entrenador', href: '/entrenador' }, { label: 'Modificar Precios', active: true }]} />

          <div className="mt-6 bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-white p-6 border-b border-gray-100">
              <h1 className="text-2xl font-semibold text-gray-900">Modificar Precios</h1>
              <p className="text-sm text-gray-500 mt-1">Solo puede modificar la práctica asignada a su cuenta.</p>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-300 mr-4"></div>
                  <div className="text-gray-600">Cargando práctica asignada...</div>
                </div>
              ) : error ? (
                <div className="p-6 bg-red-50 rounded-lg border border-red-100 text-red-700">{error}</div>
              ) : !practica ? (
                <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-100 text-yellow-800">No hay práctica asignada a su cuenta.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="md:col-span-2">
                    <h2 className="text-lg font-medium text-gray-900">{practica.nombre}</h2>
                    {practica.descripcion && <p className="text-sm text-gray-500 mt-1">{practica.descripcion}</p>}
                  </div>

                  <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Precio</label>
                    <div className="flex items-center gap-2">
                      <span className="inline-block px-3 py-2 bg-gray-50 border border-gray-200 rounded-l-md text-gray-600">$</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={precioInput}
                        onChange={(e) => setPrecioInput(e.target.value)}
                        className={`flex-1 px-3 py-2 border rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!validoPrecio(precioInput) && precioInput ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'}`}
                        aria-label="Precio de la práctica"
                      />
                    </div>
                    {!validoPrecio(precioInput) && precioInput && <p className="text-xs text-red-600 mt-2">Ingrese un número positivo válido</p>}

                    <div className="mt-4 flex items-center gap-3">
                      <button
                        onClick={handleGuardar}
                        disabled={!precioCambiado() || !validoPrecio(precioInput) || saving}
                        className={`px-4 py-2 rounded-md font-medium transition ${precioCambiado() && validoPrecio(precioInput) && !saving ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-600 cursor-not-allowed'}`}
                      >
                        {saving ? 'Guardando...' : 'Guardar cambios'}
                      </button>

                      <button
                        onClick={() => { setPrecioInput(String(precioOriginal ?? '')) ; setToast(null) }}
                        type="button"
                        className="px-3 py-2 rounded-md border border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Revertir
                      </button>
                    </div>

                    {toast && (
                      <div className={`mt-4 px-3 py-2 rounded-md text-sm ${toast.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        {toast.msg}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
