'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/app/components/Sidebar'
import { Button } from '@/app/components/button'
import { Input } from '@/app/components/input'
import { Label } from '@/app/components/label'

function todayDateString() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function validateYearRange(dateStr?: string, fieldName = 'fecha') {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return `${fieldName} inválida`
  const year = d.getFullYear()
  const now = new Date()
  const currentYear = now.getFullYear()
  const minYear = currentYear - 100

  if (year > currentYear) return `${fieldName} no puede ser un año futuro`
  if (year < minYear) return `${fieldName} demasiada antigua`
  return null
}

export default function AltaAdminPage() {
  const router = useRouter()

  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    fechaNacimiento: '',
    email: '',
    telefono: '',
    contraseña: '',
    fechaRegistro: todayDateString(),
  })

  useEffect(() => {
    setFormData((f) => ({ ...f, fechaRegistro: todayDateString() }))
  }, [])

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido'
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.nombre)) {
      newErrors.nombre = 'El nombre solo debe contener letras'
    }

    if (!formData.dni.trim()) {
      newErrors.dni = 'El DNI es requerido'
    } else if (!/^\d{7,8}$/.test(formData.dni)) {
      newErrors.dni = 'El DNI debe tener 7 u 8 dígitos'
    }

    if (!formData.fechaNacimiento) {
      newErrors.fechaNacimiento = 'La fecha de nacimiento es requerida'
    }

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

    if (formData.contraseña.length < 8) {
      newErrors.contraseña = 'La contraseña debe tener al menos 8 caracteres'
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#\$%*?&._\-!]).+$/.test(formData.contraseña)) {
      newErrors.contraseña = 'La contraseña debe contener mayúscula, minúscula, número y carácter especial'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Validar campo en tiempo real
    validateField(field, value)
  }

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors }
    
    switch (field) {
      case 'nombre':
        if (!value.trim()) {
          newErrors.nombre = 'El nombre es requerido'
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
          newErrors.nombre = 'El nombre solo debe contener letras'
        } else {
          delete newErrors.nombre
        }
        break
      case 'dni':
        if (!value.trim()) {
          newErrors.dni = 'El DNI es requerido'
        } else if (!/^\d{7,8}$/.test(value)) {
          newErrors.dni = 'El DNI debe tener 7 u 8 dígitos'
        } else {
          delete newErrors.dni
        }
        break
      case 'fechaNacimiento':
        if (!value) {
          newErrors.fechaNacimiento = 'La fecha de nacimiento es requerida'
        } else {
          const yearError = validateYearRange(value, 'Fecha de nacimiento')
          if (yearError) {
            newErrors.fechaNacimiento = yearError
          } else {
            delete newErrors.fechaNacimiento
          }
        }
        break
      case 'email':
        if (!value.trim()) {
          newErrors.email = 'El correo electrónico es requerido'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'El correo electrónico no es válido'
        } else {
          delete newErrors.email
        }
        break
      case 'telefono':
        if (!value.trim()) {
          newErrors.telefono = 'El teléfono es requerido'
        } else if (!/^\d+$/.test(value)) {
          newErrors.telefono = 'El teléfono solo debe contener números'
        } else {
          delete newErrors.telefono
        }
        break
      case 'contraseña':
        if (value.length < 8) {
          newErrors.contraseña = 'La contraseña debe tener al menos 8 caracteres'
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#\$%*?&._\-!]).+$/.test(value)) {
          newErrors.contraseña = 'La contraseña debe contener mayúscula, minúscula, número y carácter especial'
        } else {
          delete newErrors.contraseña
        }
        break
    }
    
    setErrors(newErrors)
  }

  const isFormValid = () => {
    return Object.keys(errors).length === 0 &&
           formData.nombre.trim() !== '' &&
           formData.dni.trim() !== '' &&
           formData.fechaNacimiento !== '' &&
           formData.email.trim() !== '' &&
           formData.telefono.trim() !== '' &&
           formData.contraseña !== ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      const res = await fetch('/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        // Si el backend devolvió errores por campo, mapéalos al state para mostrarlos inline
        if (data?.errors && typeof data.errors === 'object') {
          setErrors(data.errors)
          return
        }

        // Mostrar error general
        setErrors({ general: data.error || data.message || 'Error al registrar administrador' })
        return
      }

      // Éxito - limpiar formulario
      setFormData({
        nombre: '',
        dni: '',
        fechaNacimiento: '',
        email: '',
        telefono: '',
        contraseña: '',
        fechaRegistro: todayDateString(),
      })
      setErrors({ general: '✓ Administrador registrado exitosamente' })
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setErrors({})
      }, 3000)
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Error al registrar administrador' })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Gestor Club Deportivo</h1>
            <div className="flex items-center gap-2 text-gray-600">Usuario Admin</div>
          </div>

          <nav className="text-sm text-gray-500 mb-6">
            Panel Principal &gt; Administrador &gt; Registrar Administrador
          </nav>

          <div className="bg-white rounded-lg shadow-md p-8 max-w-3xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Registrar Nuevo Administrador</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <div className={`p-3 rounded-md ${errors.general.includes('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {errors.general}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo <span className="text-gray-900">*</span></Label>
                <Input
                  id="nombre"
                  placeholder="Ingrese el nombre completo"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  className={errors.nombre ? 'border-red-500' : ''}
                />
                {errors.nombre && <p className="text-sm text-red-500">{errors.nombre}</p>}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dni">DNI <span className="text-gray-900">*</span></Label>
                  <Input
                    id="dni"
                    placeholder="12345678"
                    value={formData.dni}
                    onChange={(e) => handleInputChange('dni', e.target.value)}
                    className={errors.dni ? 'border-red-500' : ''}
                  />
                  {errors.dni && <p className="text-sm text-red-500">{errors.dni}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fechaNacimiento">Fecha de Nacimiento <span className="text-gray-900">*</span></Label>
                  <Input
                    id="fechaNacimiento"
                    type="date"
                    value={formData.fechaNacimiento}
                    onChange={(e) => handleInputChange('fechaNacimiento', e.target.value)}
                    className={errors.fechaNacimiento ? 'border-red-500' : ''}
                  />
                  {errors.fechaNacimiento && <p className="text-sm text-red-500">{errors.fechaNacimiento}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico <span className="text-gray-900">*</span></Label>
                <Input
                  id="email"
                  placeholder="admin@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono de Contacto <span className="text-gray-900">*</span></Label>
                  <Input
                    id="telefono"
                    placeholder="123456789"
                    value={formData.telefono}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                    className={errors.telefono ? 'border-red-500' : ''}
                  />
                  {errors.telefono && <p className="text-sm text-red-500">{errors.telefono}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fechaRegistro">Fecha de Registro</Label>
                  <Input
                    id="fechaRegistro"
                    type="date"
                    value={formData.fechaRegistro}
                    readOnly
                    onChange={() => {}}
                    className="bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contraseña">Contraseña <span className="text-gray-900">*</span></Label>
                <div className="relative">
                  <Input
                    id="contraseña"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Ingrese la contraseña"
                    value={formData.contraseña}
                    onChange={(e) => handleInputChange('contraseña', e.target.value)}
                    className={errors.contraseña ? 'border-red-500 pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-10-7-10-7a18.35 18.35 0 012.223-3.197M6.45 6.45A9.953 9.953 0 0112 5c7 0 10 7 10 7a18.48 18.48 0 01-2.646 3.63M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Mínimo 8 caracteres con mayúscula, minúscula, número y carácter especial
                </p>
                {errors.contraseña && <p className="text-sm text-red-500">{errors.contraseña}</p>}
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={handleCancel} disabled={loading} className="flex-1 bg-transparent">
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={loading || !isFormValid()}
                  className="flex-1 px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors justify-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Registrando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      Registrar
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}