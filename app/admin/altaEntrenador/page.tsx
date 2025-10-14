"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/app/components/button"
import { Input } from "@/app/components/input"
import { Label } from "@/app/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/select"
import { Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import Sidebar from "@/app/components/Sidebar"
import Toast from "@/app/components/Toast"

interface PracticaDeportiva {
  id: number
  nombre: string
}

export default function AltaEntrenadorPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [practicasDeportivas, setPracticasDeportivas] = useState<PracticaDeportiva[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [toastOpen, setToastOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState("")
  const [toastType, setToastType] = useState<"success" | "error" | "info" | "warning">("success")

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
    setError("")

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
        throw new Error(data.error || "Error al registrar el entrenador")
      }

      // Mostrar toast, limpiar formulario y errores. No redirigimos para que el usuario vea el toast.
      setToastMessage("Entrenador registrado exitosamente")
      setToastType("success")
      setToastOpen(true)
      setFormData({
        nombre: "",
        dni: "",
        fechaNacimiento: "",
        email: "",
        telefono: "",
        practicaDeportivaId: "",
        contraseña: "",
      })
      setErrors({})
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al registrar el entrenador")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <Toast message={toastMessage} type={toastType} isOpen={toastOpen} onClose={() => setToastOpen(false)} />

      <div className="flex-1 p-8">
        <div className="mb-6 text-sm text-gray-800">
          Panel Principal {">"} Entrenadores {">"} Registrar Entrenador
        </div>

        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 text-2xl font-semibold text-black">Registrar Nuevo Entrenador</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>}

            <div className="space-y-2">
              <Label htmlFor="nombre">
                Nombre Completo <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nombre"
                placeholder="Ingrese el nombre completo"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
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
                  onValueChange={(value) => setFormData({ ...formData, practicaDeportivaId: value })}
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
                  onChange={(e) => setFormData({ ...formData, contraseña: e.target.value })}
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
              <Button type="submit" disabled={loading} className="flex-1 bg-gray-800 hover:bg-gray-900">
                {loading ? "Registrando..." : "Registrar"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
