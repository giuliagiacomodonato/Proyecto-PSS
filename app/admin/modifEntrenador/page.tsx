'use client'

import type React from 'react'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAdminProtection } from '@/app/hooks/useAdminProtection'
import { Button } from '@/app/components/button'
import { Input } from '@/app/components/input'
import { Label } from '@/app/components/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/select'
import { Eye, EyeOff, Check, User } from 'lucide-react'
import Sidebar from '@/app/components/Sidebar'

interface PracticaDeportiva {
  id: number
  nombre: string
}

interface Entrenador {
  id: string
  nombre: string
  dni: string
  fechaNacimiento: string
  email: string
  telefono: string
  practicaDeportivaId: number
  direccion?: string
}

function ModifEntrenadorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [searchDni, setSearchDni] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [practicasDeportivas, setPracticasDeportivas] = useState<PracticaDeportiva[]>([])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [error, setError] = useState('')

  const [entrenadorEncontrado, setEntrenadorEncontrado] = useState<Entrenador | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    fechaNacimiento: '',
    email: '',
    telefono: '',
    practicaDeportivaId: '',
    contraseña: '',
    direccion: '',
  })

  const [formDataOriginal, setFormDataOriginal] = useState({
    nombre: '',
    dni: '',
    fechaNacimiento: '',
    email: '',
    telefono: '',
    practicaDeportivaId: '',
    contraseña: '',
    direccion: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null)



  useEffect(() => {
    async function fetchPracticas() {
      try {
        const response = await fetch('/api/practicas')
        if (response.ok) {
          const data = await response.json()
          setPracticasDeportivas(data)
        }
      } catch (error) {
        console.error('Error loading practicas deportivas:', error)
      }
    }
    fetchPracticas()
  }, [])

  const handleSearch = async (dniArg?: string) => {
    setError('')
    setEntrenadorEncontrado(null)
    setFormData({
      nombre: '',
      dni: '',
      fechaNacimiento: '',
      email: '',
      telefono: '',
      practicaDeportivaId: '',
      contraseña: '',
      direccion: '',
    })
    setErrors({})

    const dniToSearch = ((dniArg ?? searchDni) || '').trim()
    if (!dniToSearch) {
      setError('Ingrese el DNI del entrenador a buscar')
      return
    }

    setSearching(true)
    try {
      const response = await fetch(`/api/entrenadores?dni=${encodeURIComponent(dniToSearch)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al buscar el entrenador')
      }

      if (data && data.id) {
        setEntrenadorEncontrado(data)
        const initialFormData = {
          nombre: data.nombre,
          dni: data.dni,
          fechaNacimiento: data.fechaNacimiento?.split('T')[0] || '',
          email: data.email,
          telefono: data.telefono,
          practicaDeportivaId: data.practicaDeportivaId?.toString() || '',
          contraseña: '',
          direccion: data.direccion || '',
        }
        setFormData(initialFormData)
        setFormDataOriginal(initialFormData)
      } else {
        setError('No se encontró entrenador con ese DNI')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar el entrenador')
    } finally {
      setSearching(false)
    }
  }

  // Ejecutar búsqueda automática desde URL si existe parámetro dni
  useEffect(() => {
    const dniParam = searchParams.get('dni')
    if (dniParam && dniParam.trim()) {
      setSearchDni(dniParam)
      handleSearch(dniParam)
    }
  }, [searchParams])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido'
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido'
    } else if (!/^\d+$/.test(formData.telefono)) {
      newErrors.telefono = 'El teléfono solo debe contener números'
    }

    if (!formData.practicaDeportivaId) {
      newErrors.practicaDeportivaId = 'Debe seleccionar una práctica deportiva'
    }

    if (formData.contraseña) {
      if (formData.contraseña.length < 8) {
        newErrors.contraseña = 'La contraseña debe tener al menos 8 caracteres'
      } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@\$%*?&._\-!]).+$/.test(formData.contraseña)) {
        newErrors.contraseña = 'La contraseña debe contener mayúscula, minúscula, número y carácter especial'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const hasValidChanges = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido'
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido'
    } else if (!/^\d+$/.test(formData.telefono)) {
      newErrors.telefono = 'El teléfono solo debe contener números'
    }

    if (!formData.practicaDeportivaId) {
      newErrors.practicaDeportivaId = 'Debe seleccionar una práctica deportiva'
    }

    if (formData.contraseña) {
      if (formData.contraseña.length < 8) {
        newErrors.contraseña = 'La contraseña debe tener al menos 8 caracteres'
      } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@\$%*?&._\-!]).+$/.test(formData.contraseña)) {
        newErrors.contraseña = 'La contraseña debe contener mayúscula, minúscula, número y carácter especial'
      }
    }

    if (Object.keys(newErrors).length > 0) {
      return false
    }

    const hasChanges =
      formData.email !== formDataOriginal.email ||
      formData.telefono !== formDataOriginal.telefono ||
      formData.practicaDeportivaId !== formDataOriginal.practicaDeportivaId ||
      formData.contraseña !== formDataOriginal.contraseña ||
      formData.direccion !== formDataOriginal.direccion

    return hasChanges
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!entrenadorEncontrado) {
      setError('Debe buscar y encontrar un entrenador primero')
      return
    }

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const updateData: Record<string, unknown> = {
        email: formData.email,
        telefono: formData.telefono,
        practicaDeportivaId: Number.parseInt(formData.practicaDeportivaId),
        direccion: formData.direccion,
      }

      if (formData.contraseña) {
        updateData.contraseña = formData.contraseña
      }

      const response = await fetch(`/api/entrenadores/${entrenadorEncontrado.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar el entrenador')
      }


  setMensaje({ tipo: 'success', texto: 'Entrenador actualizado exitosamente' })

      setSearchDni('')
      setEntrenadorEncontrado(null)
      setFormData({
        nombre: '',
        dni: '',
        fechaNacimiento: '',
        email: '',
        telefono: '',
        practicaDeportivaId: '',
        contraseña: '',
        direccion: '',
      })
      setErrors({})
      try {
        if (typeof window !== 'undefined') {
          const returnTo = sessionStorage.getItem('returnTo')
          if (returnTo === '/admin/grillaUsuarios') {
            sessionStorage.removeItem('returnTo')
            router.push(returnTo)
          }
        }
      } catch (e) {
        // ignore
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el entrenador')
  setMensaje({ tipo: 'error', texto: err instanceof Error ? err.message : 'Error al actualizar' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setSearchDni('')
    setEntrenadorEncontrado(null)
    setFormData({
      nombre: '',
      dni: '',
      fechaNacimiento: '',
      email: '',
      telefono: '',
      practicaDeportivaId: '',
      contraseña: '',
      direccion: '',
    })
    setErrors({})
    setError('')
  }

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
            Panel Principal &gt; Entrenadores &gt; Modificar Entrenador
          </div>

          <h2 className="text-2xl font-semibold text-gray-800">Modificar Entrenador</h2>
        </div>

        <div className="max-w-3xl">
          {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 mb-4">{error}</div>}

          <div className="mb-8 p-6 border rounded-lg bg-gray-50">
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="searchDni">Buscar Entrenador por DNI</Label>
                <Input
                  id="searchDni"
                  placeholder="Ingrese el DNI"
                  value={searchDni}
                  onChange={(e) => setSearchDni(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  disabled={searching}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={() => handleSearch()} disabled={searching}>
                  {searching ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
            </div>
          </div>

          {entrenadorEncontrado && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="p-6 border rounded-lg bg-gray-50">
                <h2 className="text-lg font-semibold text-black mb-4">Datos del Entrenador</h2>

                <div className="space-y-4">
                  <div>
                    <Label>Nombre Completo</Label>
                    <Input value={formData.nombre} disabled className="bg-gray-200" />
                    <p className="text-xs text-gray-500 mt-1">(no editable)</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>DNI</Label>
                      <Input value={formData.dni} disabled className="bg-gray-200" />
                      <p className="text-xs text-gray-500 mt-1">(no editable)</p>
                    </div>
                    <div>
                      <Label>Fecha de Nacimiento</Label>
                      <Input value={formData.fechaNacimiento} disabled className="bg-gray-200" />
                      <p className="text-xs text-gray-500 mt-1">(no editable)</p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="telefono">Teléfono de Contacto</Label>
                      <Input
                        id="telefono"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        className={errors.telefono ? 'border-red-500' : ''}
                      />
                      {errors.telefono && <p className="text-sm text-red-500">{errors.telefono}</p>}
                    </div>

                    <div>
                      <Label htmlFor="direccion">Dirección</Label>
                      <Input
                        id="direccion"
                        value={formData.direccion}
                        onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                        placeholder="Calle 123, Ciudad"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="contraseña">Contraseña</Label>
                      <div className="relative">
                        <Input
                          id="contraseña"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Dejar vacío para mantener la actual"
                          value={formData.contraseña}
                          onChange={(e) => setFormData({ ...formData, contraseña: e.target.value })}
                          className={errors.contraseña ? 'border-red-500 pr-10' : 'pr-10'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Mínimo 8 caracteres con mayúscula, minúscula, número y carácter especial (dejar vacío si no quiere cambiar)
                      </p>
                      {errors.contraseña && <p className="text-sm text-red-500">{errors.contraseña}</p>}
                    </div>

                    <div>
                      <Label htmlFor="practicaDeportiva">Cambiar Práctica Deportiva</Label>
                      <Select
                        value={formData.practicaDeportivaId}
                        onValueChange={(value) => setFormData({ ...formData, practicaDeportivaId: value })}
                      >
                        <SelectTrigger className={errors.practicaDeportivaId ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Seleccione de la lista" />
                        </SelectTrigger>
                        <SelectContent>
                          {practicasDeportivas.map((practica) => (
                            <SelectItem key={practica.id} value={practica.id.toString()}>
                              {practica.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.practicaDeportivaId && (
                        <p className="text-sm text-red-500">{errors.practicaDeportivaId}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 mt-6 border-t items-center">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={loading}
                    className="px-6 py-2 text-sm"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading || !hasValidChanges()} 
                    className="px-6 py-2 text-sm bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    {loading ? 'Guardando...' : 'Guardar'}
                  </Button>
                  {mensaje && (
                    <div className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${mensaje.tipo === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {mensaje.texto}
                    </div>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  )
}

export default function ModifEntrenadorPage() {
  const { isAuthorized, isChecking } = useAdminProtection()

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

  if (!isAuthorized) {
    return null
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <ModifEntrenadorContent />
    </Suspense>
  )
}
