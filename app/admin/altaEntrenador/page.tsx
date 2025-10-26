"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/app/components/button"
import { Input } from "@/app/components/input"
import { Label } from "@/app/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/select"
import { Eye, EyeOff, User } from "lucide-react"
import { useRouter } from "next/navigation"
import Sidebar from "@/app/components/Sidebar"
import { useAdminProtection } from "@/app/hooks/useAdminProtection"

interface PracticaDeportiva {
  id: number
  nombre: string
}

export default function AltaEntrenadorPage() {
  const router = useRouter()
  // ✅ Verificar que sea admin ANTES de renderizar
  const { isAuthorized, isChecking } = useAdminProtection()

  const [showPassword, setShowPassword] = useState(false)
  const [practicasDeportivas, setPracticasDeportivas] = useState<PracticaDeportiva[]>([])
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    nombre: "",
    dni: "",
    fechaNacimiento: "",
    email: "",
    telefono: "",
    practicaDeportivaId: "",
    contraseña: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    async function fetchPracticas() {
      try {
        const response = await fetch("/api/practicas")
        if (response.ok) {
          const data = await response.json()
          setPracticasDeportivas(data)
        }
      } catch (error) {
        console.error("[v0] Error loading practicas deportivas:", error)
      }
    }
    fetchPracticas()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
          delete newErrors.fechaNacimiento
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
      case 'practicaDeportivaId':
        if (!value) {
          newErrors.practicaDeportivaId = 'Debe seleccionar una práctica deportiva'
        } else {
          delete newErrors.practicaDeportivaId
        }
        break
      case 'contraseña':
        if (!value) {
          newErrors.contraseña = 'La contraseña es requerida'
        } else if (value.length < 8) {
          newErrors.contraseña = 'La contraseña debe tener al menos 8 caracteres'
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@\$%*?&._\-!]).+$/.test(value)) {
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
           formData.practicaDeportivaId !== '' &&
           formData.contraseña !== ''
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido"
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.nombre)) {
      newErrors.nombre = "El nombre solo debe contener letras"
    }

    if (!formData.dni.trim()) {
      newErrors.dni = "El DNI es requerido"
    } else if (!/^\d{7,8}$/.test(formData.dni)) {
      newErrors.dni = "El DNI debe tener 7 u 8 dígitos"
    }

    if (!formData.fechaNacimiento) {
      newErrors.fechaNacimiento = "La fecha de nacimiento es requerida"
    }

    if (!formData.email.trim()) {
      newErrors.email = "El correo electrónico es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "El correo electrónico no es válido"
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es requerido"
    } else if (!/^\d+$/.test(formData.telefono)) {
      newErrors.telefono = "El teléfono solo debe contener números"
    }

    if (!formData.practicaDeportivaId) {
      newErrors.practicaDeportivaId = "Debe seleccionar una práctica deportiva"
    }

    if (!formData.contraseña) {
      newErrors.contraseña = "La contraseña es requerida"
    } else if (formData.contraseña.length < 8) {
      newErrors.contraseña = "La contraseña debe tener al menos 8 caracteres"
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@\$%*?&._\-!]).+$/.test(formData.contraseña)) {
      newErrors.contraseña = "La contraseña debe contener mayúscula, minúscula, número y carácter especial"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/entrenadores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          practicaDeportivaId: Number.parseInt(formData.practicaDeportivaId),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data?.errors && typeof data.errors === 'object') {
          setErrors(data.errors)
          return
        }
        throw new Error(data.error || "Error al registrar el entrenador")
      }

      // Limpiar formulario y mostrar éxito
      setFormData({
        nombre: "",
        dni: "",
        fechaNacimiento: "",
        email: "",
        telefono: "",
        practicaDeportivaId: "",
        contraseña: "",
      })
      setErrors({ general: '✓ Entrenador registrado exitosamente' })
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setErrors({})
      }, 3000)
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : "Error al registrar el entrenador" })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
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
            Panel Principal &gt; Entrenadores &gt; Registrar Entrenador
          </div>

          <h2 className="text-2xl font-semibold text-gray-800">Registrar Nuevo Entrenador</h2>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-3xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className={`p-3 rounded-md ${errors.general.includes('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {errors.general}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="nombre">
                Nombre Completo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombre"
                placeholder="Ingrese el nombre completo"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                className={errors.nombre ? "border-red-500" : ""}
              />
              {errors.nombre && <p className="text-sm text-red-500">{errors.nombre}</p>}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dni">
                  DNI <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dni"
                  placeholder="12345678"
                  value={formData.dni}
                  onChange={(e) => handleInputChange('dni', e.target.value)}
                  className={errors.dni ? "border-red-500" : ""}
                />
                {errors.dni && <p className="text-sm text-red-500">{errors.dni}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaNacimiento">
                  Fecha de Nacimiento <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fechaNacimiento"
                  type="date"
                  value={formData.fechaNacimiento}
                  onChange={(e) => handleInputChange('fechaNacimiento', e.target.value)}
                  className={errors.fechaNacimiento ? "border-red-500" : ""}
                />
                {errors.fechaNacimiento && <p className="text-sm text-red-500">{errors.fechaNacimiento}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Correo Electrónico <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@ejemplo.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="telefono">
                  Teléfono de Contacto <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="telefono"
                  placeholder="123456789"
                  value={formData.telefono}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  className={errors.telefono ? "border-red-500" : ""}
                />
                {errors.telefono && <p className="text-sm text-red-500">{errors.telefono}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="practicaDeportiva">
                  Práctica Deportiva <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.practicaDeportivaId}
                  onValueChange={(value) => handleInputChange('practicaDeportivaId', value)}
                >
                  <SelectTrigger className={errors.practicaDeportivaId ? "border-red-500" : ""}>
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
                {errors.practicaDeportivaId && <p className="text-sm text-red-500">{errors.practicaDeportivaId}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contraseña">
                Contraseña <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="contraseña"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingrese la contraseña"
                  value={formData.contraseña}
                  onChange={(e) => handleInputChange('contraseña', e.target.value)}
                  className={errors.contraseña ? "border-red-500 pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Mínimo 8 caracteres con mayúscula, minúscula, número y carácter especial
              </p>
              {errors.contraseña && <p className="text-sm text-red-500">{errors.contraseña}</p>}
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 bg-transparent"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !isFormValid()} className="flex-1 bg-gray-800 hover:bg-gray-900">
                {loading ? "Registrando..." : "Registrar"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
