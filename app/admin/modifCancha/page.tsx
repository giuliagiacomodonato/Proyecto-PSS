"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/app/components/Sidebar'
import { useAdminProtection } from '@/app/hooks/useAdminProtection'
import { Plus, X, User, Check } from 'lucide-react'

interface Horario {
  inicio: string
  fin: string
}

interface Cancha {
  id: number
  nombre: string
  tipo: string
  ubicacion: string
  precio: number
  horarios: { id?: number; horaInicio: string; horaFin: string }[]
}

export default function ModifCanchaPage() {
  const router = useRouter()
  const { isAuthorized, isChecking } = useAdminProtection()

  const [canchas, setCanchas] = useState<Cancha[]>([])
  const [loadingCanchas, setLoadingCanchas] = useState(true)
  const [selectedId, setSelectedId] = useState('')

  // Form state
  const [tipo, setTipo] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [precio, setPrecio] = useState('')
  const [horarios, setHorarios] = useState<Horario[]>([])

  const [errors, setErrors] = useState<{ [k: string]: string | undefined }>({})
  const [loadingSave, setLoadingSave] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [tiposCancha, setTiposCancha] = useState<string[]>([])
  const [loadingTipos, setLoadingTipos] = useState(true)

  // Original snapshot to detect changes
  const [original, setOriginal] = useState<Cancha | null>(null)

  useEffect(() => {
    cargarCanchas()
    fetchTipos()
  }, [])

  const fetchTipos = async () => {
    try {
      setLoadingTipos(true)
      const res = await fetch('/api/tipos-cancha')
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al cargar tipos')
      setTiposCancha(data.tipos || [])
    } catch (e) {
      console.error('Error al cargar tipos de cancha', e)
    } finally {
      setLoadingTipos(false)
    }
  }

  const formatTipoLabel = (tipo: string) => {
    return tipo
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  const cargarCanchas = async () => {
    try {
      setLoadingCanchas(true)
      const res = await fetch('/api/canchas')
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al cargar canchas')
      setCanchas(data.canchas || [])
    } catch (e) {
      console.error('Error al cargar canchas:', e)
    } finally {
      setLoadingCanchas(false)
    }
  }

  const handleSelect = (id: string) => {
    setSelectedId(id)
    setErrors({})
    setSuccessMessage('')

    if (!id) {
      // limpiar form
      setTipo('')
      setUbicacion('')
      setPrecio('')
      setHorarios([])
      setOriginal(null)
      return
    }

    const c = canchas.find(x => x.id === parseInt(id))
    if (c) {
      setOriginal(c)
      setTipo(c.tipo)
      setUbicacion(c.ubicacion)
      setPrecio(String(c.precio))
      setHorarios(c.horarios.map(h => ({ inicio: h.horaInicio, fin: h.horaFin })))
    }
  }

  const generarOpcionesHorarios = () => {
    const opciones = [] as { value: string; label: string }[]
    for (let hora = 6; hora <= 23; hora++) {
      const horaStr = hora.toString().padStart(2, '0') + ':00'
      opciones.push({ value: horaStr, label: horaStr })
    }
    return opciones
  }

  const opcionesHorarios = generarOpcionesHorarios()

  const agregarHorario = () => setHorarios(prev => [...prev, { inicio: '', fin: '' }])
  const eliminarHorario = (idx: number) => setHorarios(prev => prev.filter((_, i) => i !== idx))
  const actualizarHorario = (idx: number, campo: 'inicio' | 'fin', valor: string) => {
    const copy = [...horarios]
    copy[idx] = { ...copy[idx], [campo]: valor }
    setHorarios(copy)
    validarHorariosEnTiempoReal(copy)
  }

  const validarHorariosEnTiempoReal = (horariosActuales: Horario[]) => {
    // similar validaciones a altaCancha
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    for (const h of horariosActuales) {
      if ((h.inicio && !timeRegex.test(h.inicio)) || (h.fin && !timeRegex.test(h.fin))) {
        setErrors(prev => ({ ...prev, horarios: 'Formato de horario inválido' }))
        return
      }
      if (h.inicio && h.fin) {
        const ih = parseInt(h.inicio.split(':')[0])
        const fh = parseInt(h.fin.split(':')[0])
        if (ih >= fh) {
          setErrors(prev => ({ ...prev, horarios: 'Inicio debe ser anterior a fin' }))
          return
        }
      }
    }
    // comprobar superposiciones
    for (let i = 0; i < horariosActuales.length; i++) {
      for (let j = i + 1; j < horariosActuales.length; j++) {
        const a = horariosActuales[i]
        const b = horariosActuales[j]
        if (!a.inicio || !a.fin || !b.inicio || !b.fin) continue
        const ai = parseInt(a.inicio.split(':')[0])
        const af = parseInt(a.fin.split(':')[0])
        const bi = parseInt(b.inicio.split(':')[0])
        const bf = parseInt(b.fin.split(':')[0])
        if (ai < bf && bi < af) {
          setErrors(prev => ({ ...prev, horarios: `Horarios superpuestos: ${a.inicio}-${a.fin} y ${b.inicio}-${b.fin}` }))
          return
        }
      }
    }
    setErrors(prev => ({ ...prev, horarios: undefined }))
  }

  const validateFields = () => {
    const newErrors: typeof errors = {}
    if (!tipo) newErrors.tipo = 'Seleccione un tipo'
    if (!ubicacion.trim()) newErrors.ubicacion = 'La ubicación es requerida'
    if (!precio.trim()) newErrors.precio = 'El precio es requerido'
    if (precio && !/^\d+$/.test(precio)) newErrors.precio = 'El precio debe ser numérico'
    if (horarios.length === 0) newErrors.horarios = 'Debe haber al menos un horario'
    for (const h of horarios) {
      if (!h.inicio || !h.fin) { newErrors.horarios = 'Todos los horarios deben tener inicio y fin'; break }
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const detectChanges = () => {
    if (!original) return false
    if (original.tipo !== tipo) return true
    if (original.ubicacion !== ubicacion) return true
    if (String(original.precio) !== precio) return true
    // comparar horarios
    const origH = original.horarios.map(h => `${h.horaInicio}-${h.horaFin}`).join('|')
    const currH = horarios.map(h => `${h.inicio}-${h.fin}`).join('|')
    return origH !== currH
  }

  const handleGuardar = async () => {
    if (!selectedId) return
    if (!validateFields()) return
    // No permitir guardar si existen errores de horarios (p. ej. superposición)
    if (errors.horarios) {
      // Asegurar que el usuario vea el error
      setErrors(prev => ({ ...prev, horarios: errors.horarios }))
      return
    }
    if (!detectChanges()) return

    setLoadingSave(true)
    try {
      const body = {
        tipo,
        ubicacion,
        precio: parseInt(precio),
        horarios: horarios.map(h => ({ inicio: h.inicio, fin: h.fin }))
      }
      const res = await fetch(`/api/canchas?id=${selectedId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Error al guardar')

      setSuccessMessage('Cancha modificada exitosamente!')
      // Mostrar el mensaje junto al botón Guardar y mantenerlo visible unos segundos
      // antes de limpiar el formulario. Primero esperamos 3s, ocultamos el mensaje
      // y luego limpiamos y recargamos la lista.
      setTimeout(async () => {
        setSuccessMessage('')
        // Limpiar formulario para buscar otra cancha
        setSelectedId('')
        setTipo('')
        setUbicacion('')
        setPrecio('')
        setHorarios([])
        setOriginal(null)
        // Recargar lista
        await cargarCanchas()
      }, 3000)
    } catch (e: any) {
      console.error('Error al guardar:', e)
      setErrors(prev => ({ ...prev, general: e.message || 'Error al guardar cambios' }))
    } finally {
      setLoadingSave(false)
    }
  }

  const handleCancelar = () => {
    // Limpiar y volver al admin
    setSelectedId('')
    setTipo('')
    setUbicacion('')
    setPrecio('')
    setHorarios([])
    setOriginal(null)
  }

  if (isChecking) {
    return <div className="p-8">Comprobando permisos...</div>
  }

  if (!isAuthorized) return null

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
              <span className="text-sm text-gray-900">Usuario Admin</span>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Modificar Cancha</h2>
          <p className="text-sm text-gray-600">Seleccione una cancha y modifique sus datos</p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow max-w-4xl">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-900 mb-2">Seleccionar Cancha</label>
            <select value={selectedId} onChange={(e) => handleSelect(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="" className="text-gray-500">-- Seleccione una cancha --</option>
              {canchas.map(c => (
                <option key={c.id} value={c.id} className="text-gray-900">{c.nombre}</option>
              ))}
            </select>
          </div>

          {selectedId && (
            <form onSubmit={(e) => { e.preventDefault(); handleGuardar() }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Nombre (no editable)</label>
                <input readOnly value={original?.nombre || ''} className="mt-1 p-2 border border-gray-300 rounded w-full bg-gray-100 text-gray-700" />
              </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Tipo</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    disabled={loadingTipos}
                    className={`mt-1 p-2 border rounded w-full text-gray-900 bg-white ${errors.tipo ? 'border-red-500' : 'border-gray-300'}`}
                  >
                    <option value="" className="text-gray-500">{loadingTipos ? 'Cargando tipos...' : 'Seleccione un tipo'}</option>
                    {tiposCancha.map(t => (
                      <option key={t} value={t} className="text-gray-900">{formatTipoLabel(t)}</option>
                    ))}
                  </select>
                  {errors.tipo && <p className="text-xs text-red-600">{errors.tipo}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">Ubicación</label>
                  <input value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} className={`mt-1 p-2 border rounded w-full text-gray-900 ${errors.ubicacion ? 'border-red-500' : 'border-gray-300'}`} placeholder="Ej: Cancha Principal" />
                  {errors.ubicacion && <p className="text-xs text-red-600">{errors.ubicacion}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">Precio</label>
                <input value={precio} onChange={(e) => { if (e.target.value === '' || /^\d+$/.test(e.target.value)) setPrecio(e.target.value) }} className={`mt-1 p-2 border rounded w-48 text-gray-900 ${errors.precio ? 'border-red-500' : 'border-gray-300'}`} placeholder="0" />
                {errors.precio && <p className="text-xs text-red-600">{errors.precio}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Horarios disponibles</label>
                <div className="space-y-3">
                  {horarios.map((h, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <select value={h.inicio} onChange={(e) => actualizarHorario(idx, 'inicio', e.target.value)} className="p-2 border border-gray-300 rounded text-gray-900">
                        <option value="" className="text-gray-500">Inicio</option>
                        {opcionesHorarios.map(o => <option key={o.value} value={o.value} className="text-gray-900">{o.label}</option>)}
                      </select>
                      <select value={h.fin} onChange={(e) => actualizarHorario(idx, 'fin', e.target.value)} className="p-2 border border-gray-300 rounded text-gray-900">
                        <option value="" className="text-gray-500">Fin</option>
                        {opcionesHorarios.map(o => <option key={o.value} value={o.value} className="text-gray-900">{o.label}</option>)}
                      </select>
                      {horarios.length > 1 && (
                        <button type="button" onClick={() => eliminarHorario(idx)} className="p-2 text-red-600 rounded hover:bg-red-50"><X /></button>
                      )}
                    </div>
                  ))}

                  <button type="button" onClick={agregarHorario} className="mt-2 inline-flex items-center gap-2 px-3 py-2 border-2 border-dashed border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50">
                    <Plus /> Agregar horario
                  </button>
                  {errors.horarios && <p className="text-xs text-red-600 mt-1">{errors.horarios}</p>}
                </div>
              </div>

              <div className="flex items-start gap-3 pt-4">
                <button type="button" onClick={handleCancelar} className="px-6 py-2 border rounded">Cancelar</button>
                <div className="flex items-center gap-3">
                  <div className="relative inline-block">
                    <button
                      type="submit"
                      disabled={!detectChanges() || loadingSave || !!errors.horarios}
                      className={`px-6 py-2 rounded text-white ${detectChanges() && !errors.horarios ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'}`}
                    >
                      {loadingSave ? 'Guardando...' : 'Guardar'}
                    </button>

                    {/* Mensaje de éxito a la derecha y ligeramente abajo del botón Guardar */}
                    {successMessage && (
                      <div className="absolute left-full ml-3 mt-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap z-10 bg-green-100 text-green-800">
                        {successMessage}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </form>
          )}

          {!selectedId && (
            <div className="text-sm text-gray-600">Selecciona una cancha para editar sus datos.</div>
          )}
        </div>
      </main>
      {/* successMessage ahora se muestra al lado del botón Guardar */}
    </div>
  )
}
