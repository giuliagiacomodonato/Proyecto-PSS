"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/app/components/Sidebar'
import { Check } from 'lucide-react'

// Página de administración para modificar el precio base de la cuota de socios.
// - Carga el valor actual desde GET /api/config/cuota
// - Permite actualizarlo vía PATCH /api/config/cuota
// Comentarios y nombres de funciones están en español para facilitar la lectura.

export default function ModificarCuota() {
  const router = useRouter()
  const [precio, setPrecio] = useState<number | ''>('')
  const [loading, setLoading] = useState(true)
  const [mensaje, setMensaje] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Cargar el precio actual al montar el componente
  useEffect(() => {
    const fetchPrecio = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/config/cuota')
        if (!res.ok) throw new Error('No se pudo cargar')
        const data = await res.json()
        setPrecio(data.precioBase ?? 0)
      } catch (err) {
        console.error(err)
        setMensaje('Error al cargar el precio')
      } finally {
        setLoading(false)
      }
    }
    fetchPrecio()
  }, [])

  // Guardar el nuevo precio: validación mínima y llamada PATCH
  const handleGuardar = async () => {
    if (precio === '' || Number.isNaN(Number(precio)) || Number(precio) < 0) return
    try {
      setSubmitting(true)
      const res = await fetch('/api/config/cuota', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ precio: Number(precio) })
      })
      const data = await res.json()
      if (!res.ok) {
        // Mostrar el mensaje de error devuelto por la API si existe
        setMensaje(data.message || 'Error al guardar')
        return
      }
      // Mensaje de éxito; la página permanece abierta según la especificación
      setMensaje('¡Tarifas actualizadas exitosamente!')
      // permanecer en la misma pestaña
    } catch (err) {
      console.error(err)
      setMensaje('Error de conexión')
    } finally {
      setSubmitting(false)
    }
  }

  // Cancelar vuelve al panel principal de admin
  const handleCancelar = () => {
    router.push('/admin')
  }

  // Validación mínima del input: debe ser número >= 0
  const validar = () => {
    return precio !== '' && !Number.isNaN(Number(precio)) && Number(precio) >= 0
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Cuota Socio</h2>
        </div>

        <div className="max-w-sm bg-white p-6 rounded-lg shadow">
          {mensaje && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-800">{mensaje}</div>
          )}

          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="text-sm text-gray-700">Individual</div>
            <input
              type="number"
              min={0}
              placeholder="[editable]"
              value={precio}
              onChange={(e) => setPrecio(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-40 px-3 py-2 border rounded text-right"
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleCancelar}
              className="px-4 py-2 border rounded bg-white text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>

            <button
              onClick={handleGuardar}
              disabled={!validar() || submitting}
              className={`flex items-center gap-2 px-3 py-2 rounded ${!validar() || submitting ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-900 hover:bg-gray-400'}`}
            >
              <span className={`${!validar() || submitting ? 'p-1 rounded bg-gray-200' : 'p-1 rounded bg-gray-800'}`}>
                <Check className={`${!validar() || submitting ? 'text-gray-400' : 'text-white'}`} size={16} />
              </span>
              <span className="text-sm font-medium">{submitting ? 'Guardando...' : 'Guardar'}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
