"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAdminProtection } from '@/app/hooks/useAdminProtection'
import Sidebar from '@/app/components/Sidebar'
import { Button } from '@/app/components/button'
import { Input } from '@/app/components/input'
import { Label } from '@/app/components/label'
import { User } from 'lucide-react'

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

export default function ModifAdminPage() {
  const router = useRouter()
  const search = useSearchParams()
  const dniQuery = search?.get('dni') ?? ''

  const { isAuthorized, isChecking, isSuperAdmin } = useAdminProtection()

  useEffect(() => {
    if (!isChecking && isAuthorized && !isSuperAdmin) {
      router.replace('/admin')
    }
  }, [isChecking, isAuthorized, isSuperAdmin, router])

  const [dniBusqueda, setDniBusqueda] = useState(dniQuery)
  const [admin, setAdmin] = useState<any | null>(null)
  const [originalAdmin, setOriginalAdmin] = useState<any | null>(null)
  const [editAdmin, setEditAdmin] = useState<any | null>(null)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [mensaje, setMensaje] = useState('')

  const buscarAdmin = async () => {
    try {
      setMensaje('')
      setErrors({})
      setLoading(true)
      const res = await fetch(`/api/admins?dni=${dniBusqueda}`, { cache: 'no-store' })
      if (!res.ok) {
        setAdmin(null)
        setEditAdmin(null)
        setMensaje('Administrador no encontrado.')
        return
      }
      const data = await res.json()
      const found = data.admin
      if (!found) {
        setAdmin(null)
        setEditAdmin(null)
        setMensaje('Administrador no encontrado.')
        return
      }
      setAdmin(found)
      setOriginalAdmin(found)
      setEditAdmin({
        id: found.id,
        nombre: found.nombre ?? '',
        dni: found.dni ?? '',
        fechaNacimiento: found.fechaNacimiento?.slice(0,10) ?? '',
        email: found.email ?? '',
        telefono: found.telefono ?? '',
      })
    } catch (err) {
      console.error(err)
      setMensaje('Error al buscar administrador')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (dniQuery) buscarAdmin()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleChange = (field: string, value: string) => {
    if (!editAdmin) return
    const newValue = field === 'dni' ? value.replace(/\D/g, '').slice(0,8) : value
    setEditAdmin({ ...editAdmin, [field]: newValue })
    validateField(field, newValue)
  }

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors }
    switch (field) {
      case 'nombre':
        if (!value.trim()) newErrors.nombre = 'El nombre es requerido'
        else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) newErrors.nombre = 'El nombre solo debe contener letras'
        else delete newErrors.nombre
        break
      case 'dni':
        if (!value.trim()) newErrors.dni = 'El DNI es requerido'
        else if (!/^\d{7,8}$/.test(value)) newErrors.dni = 'El DNI debe tener 7 u 8 dígitos'
        else delete newErrors.dni
        break
      case 'fechaNacimiento':
        if (!value) newErrors.fechaNacimiento = 'La fecha de nacimiento es requerida'
        else {
          const yr = validateYearRange(value, 'Fecha de nacimiento')
          if (yr) newErrors.fechaNacimiento = yr
          else delete newErrors.fechaNacimiento
        }
        break
      case 'email':
        if (!value.trim()) newErrors.email = 'El correo electrónico es requerido'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) newErrors.email = 'El correo electrónico no es válido'
        else delete newErrors.email
        break
      case 'telefono':
        if (!value.trim()) newErrors.telefono = 'El teléfono es requerido'
        else if (!/^\d+$/.test(value)) newErrors.telefono = 'El teléfono solo debe contener números'
        else delete newErrors.telefono
        break
      case 'contraseña':
        if (value && value.length < 8) newErrors.contraseña = 'La contraseña debe tener al menos 8 caracteres'
        else if (value && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#\$%*?&._\-!]).+$/.test(value)) newErrors.contraseña = 'La contraseña debe contener mayúscula, minúscula, número y carácter especial'
        else delete newErrors.contraseña
        break
    }
    setErrors(newErrors)
  }

  const hasValidChanges = () => {
    if (!originalAdmin || !editAdmin) return false
    const emailChanged = (originalAdmin.email ?? '') !== (editAdmin.email ?? '')
    const telefonoChanged = (originalAdmin.telefono ?? '') !== (editAdmin.telefono ?? '')
    const contraseñaChanged = Boolean(editAdmin.contraseña && editAdmin.contraseña.length > 0)
    if (!emailChanged && !telefonoChanged && !contraseñaChanged) return false
    if (emailChanged && errors.email) return false
    if (telefonoChanged && errors.telefono) return false
    if (contraseñaChanged && errors.contraseña) return false
    return true
  }

  const handleGuardar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!editAdmin) return
    if (!hasValidChanges()) return
    try {
      setLoading(true)
      const body: any = {
        id: editAdmin.id,
        // Only send editable fields (email, telefono, contraseña)
        email: editAdmin.email,
        telefono: editAdmin.telefono,
      }
      if (editAdmin.contraseña) body.contraseña = editAdmin.contraseña

      const res = await fetch('/api/admins', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) {
        if (data?.errors) { setErrors(data.errors); return }
        setMensaje(data.error || data.message || 'No se pudo actualizar')
        return
      }
      setMensaje('Administrador modificado exitosamente!')
      // Clear form and keep user on page, ready to search another admin
      setAdmin(null)
      setOriginalAdmin(null)
      setEditAdmin(null)
      setDniBusqueda('')
    } catch (err) {
      console.error(err)
      setMensaje('Error al actualizar')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelar = () => {
    // Discard changes and keep user on the same page with form cleared
    setEditAdmin(null)
    setAdmin(null)
    setOriginalAdmin(null)
    setMensaje('')
    setErrors({})
  }

  if (isChecking) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Verificando acceso...</p>
      </div>
    </div>
  )

  if (!isAuthorized) return null
  if (!isSuperAdmin) { useEffect(()=>{ router.replace('/admin') }, [router]); return null }

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

          <div className="text-sm text-gray-500 mb-6">Panel Principal &gt; Administrador &gt; Modificar Administrador</div>
          <h2 className="text-2xl font-semibold text-gray-800">Modificar Administrador</h2>
        </div>

        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4 flex gap-2">
            <input type="text" placeholder="Buscar admin por DNI" value={dniBusqueda} onChange={(e)=>setDniBusqueda(e.target.value)} className="border px-3 py-2 rounded w-64" />
            <button onClick={buscarAdmin} className="bg-blue-500 text-white px-4 py-2 rounded">Buscar</button>
          </div>

          {mensaje && <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-800">{mensaje}</div>}

          {editAdmin && (
            <form onSubmit={handleGuardar} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input id="nombre" value={editAdmin.nombre} readOnly className="bg-gray-100 cursor-not-allowed" />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="dni">DNI</Label>
                  <Input id="dni" value={editAdmin.dni} readOnly className="bg-gray-100 cursor-not-allowed" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fechaNacimiento">Fecha de Nacimiento</Label>
                  <Input id="fechaNacimiento" type="date" value={editAdmin.fechaNacimiento} readOnly className="bg-gray-100 cursor-not-allowed" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" value={editAdmin.email} onChange={(e)=>handleChange('email', e.target.value)} />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono de Contacto</Label>
                  <Input id="telefono" value={editAdmin.telefono} onChange={(e)=>handleChange('telefono', e.target.value)} />
                  {errors.telefono && <p className="text-sm text-red-500">{errors.telefono}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fechaRegistro">Fecha de Registro</Label>
                  <Input id="fechaRegistro" type="date" value={admin?.fechaAlta?.slice(0,10) ?? ''} readOnly className="bg-gray-100 cursor-not-allowed" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contraseña">Contraseña <span className="text-gray-400 text-xs">(dejar en blanco para no cambiar)</span></Label>
                <div className="relative">
                  <Input id="contraseña" type={showPassword? 'text':'password'} value={editAdmin.contraseña ?? ''} onChange={(e)=>handleChange('contraseña', e.target.value)} className={errors.contraseña ? 'border-red-500 pr-10':'pr-10'} />
                  <button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">{showPassword? 'Ocultar':'Mostrar'}</button>
                </div>
                {errors.contraseña && <p className="text-sm text-red-500">{errors.contraseña}</p>}
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={handleCancelar} disabled={loading} className="flex-1 bg-transparent">Cancelar</Button>
                <Button type="submit" disabled={loading || !hasValidChanges()} className="flex-1 px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50">{loading? 'Guardando...':'Guardar'}</Button>
              </div>
            </form>
          )}

        </div>
      </main>
    </div>
  )
}
