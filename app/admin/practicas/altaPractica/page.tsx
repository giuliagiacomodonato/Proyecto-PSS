'use client'

import { useState } from 'react'
import Sidebar from '@/app/components/Sidebar'
import { Plus, User } from 'lucide-react'

type DiaSemana = 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO' | 'DOMINGO'

interface Horario {
  id: string
  dia: DiaSemana | ''
  horaInicio: string
  horaFin: string
}

interface FormData {
  nombre: string
  descripcion: string
  cupo: string
  precio: string
  horarios: Horario[]
}

interface FormErrors {
  nombre?: string
  descripcion?: string
  cupo?: string
  precio?: string
  horarios?: string
  general?: string
}

const diasSemana: { value: DiaSemana; label: string }[] = [
  { value: 'LUNES', label: 'Lunes' },
  { value: 'MARTES', label: 'Martes' },
  { value: 'MIERCOLES', label: 'Miércoles' },
  { value: 'JUEVES', label: 'Jueves' },
  { value: 'VIERNES', label: 'Viernes' },
  { value: 'SABADO', label: 'Sábado' },
  { value: 'DOMINGO', label: 'Domingo' }
]

const horasDisponibles = [
 '08:00', '09:00',
  '10:00',  '11:00', '12:00',  '13:00',
  '14:00',  '15:00',  '16:00',  '17:00', 
  '18:00',  '19:00',  '20:00',  '21:00', '22:00'
]

export default function AltaPracticaPage() {
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    descripcion: '',
    cupo: '',
    precio: '',
    horarios: [{
      id: '1',
      dia: '',
      horaInicio: '',
      horaFin: ''
    }]
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validaciones en tiempo real
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'nombre':
        if (!value.trim()) return 'El nombre es obligatorio'
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
          return 'El nombre solo debe contener caracteres'
        }
        return ''
      
      case 'descripcion':
        if (value && value.length > 150) return 'La descripción no debe exceder 150 caracteres'
        return ''
      
      case 'cupo':
        if (!value.trim()) return 'El cupo máximo es obligatorio'
        if (!/^\d+$/.test(value)) return 'El cupo debe ser un número'
        if (parseInt(value) <= 0) return 'El cupo debe ser mayor a 0'
        return ''
      
      case 'precio':
        if (!value.trim()) return 'El precio es obligatorio'
        if (!/^\d+$/.test(value)) return 'El precio solo debe contener dígitos'
        if (parseInt(value) <= 0) return 'El precio debe ser mayor a 0'
        return ''
      
      default:
        return ''
    }
  }

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Validar campo y limpiar error si es válido
    const error = validateField(name, value)
    setErrors(prev => ({ ...prev, [name]: error || undefined }))
  }

  const handleHorarioChange = (id: string, field: keyof Horario, value: string) => {
    const nuevosHorarios = formData.horarios.map(horario =>
      horario.id === id ? { ...horario, [field]: value } : horario
    )
    
    setFormData(prev => ({
      ...prev,
      horarios: nuevosHorarios
    }))
    
    // Validar horarios en tiempo real
    validarHorariosEnTiempoReal(nuevosHorarios)
  }

  const validarHorariosEnTiempoReal = (horarios: Horario[]) => {
    // Verificar que al menos un horario esté completo
    const horariosCompletos = horarios.filter(h => h.dia && h.horaInicio && h.horaFin)
    
    if (horariosCompletos.length === 0) {
      // Limpiar error si no hay horarios completos aún
      setErrors(prev => ({ ...prev, horarios: undefined }))
      return
    }

    // Validar que horaInicio < horaFin para cada horario completo
    for (const horario of horariosCompletos) {
      const [horaInicioH, horaInicioM] = horario.horaInicio.split(':').map(Number)
      const [horaFinH, horaFinM] = horario.horaFin.split(':').map(Number)
      const inicioMinutos = horaInicioH * 60 + horaInicioM
      const finMinutos = horaFinH * 60 + horaFinM

      if (inicioMinutos >= finMinutos) {
        setErrors(prev => ({ ...prev, horarios: `La hora de inicio (${horario.horaInicio}) debe ser menor que la hora de fin (${horario.horaFin})` }))
        return
      }
    }

    // Si todo está bien, limpiar errores
    setErrors(prev => ({ ...prev, horarios: undefined }))
  }

  const agregarHorario = () => {
    const newId = Date.now().toString()
    setFormData(prev => ({
      ...prev,
      horarios: [...prev.horarios, {
        id: newId,
        dia: '',
        horaInicio: '',
        horaFin: ''
      }]
    }))
  }

  const eliminarHorario = (id: string) => {
    if (formData.horarios.length > 1) {
      setFormData(prev => ({
        ...prev,
        horarios: prev.horarios.filter(horario => horario.id !== id)
      }))
    }
  }

  const validateHorarios = (): string => {
    const horariosValidos = formData.horarios.filter(h => h.dia && h.horaInicio && h.horaFin)
    
    if (horariosValidos.length === 0) {
      return 'Debe agregar al menos un horario completo'
    }

    // Validar que horaInicio < horaFin para cada horario
    for (const horario of horariosValidos) {
      const [horaInicioH, horaInicioM] = horario.horaInicio.split(':').map(Number)
      const [horaFinH, horaFinM] = horario.horaFin.split(':').map(Number)
      const inicioMinutos = horaInicioH * 60 + horaInicioM
      const finMinutos = horaFinH * 60 + horaFinM

      if (inicioMinutos >= finMinutos) {
        return `La hora de inicio (${horario.horaInicio}) debe ser menor que la hora de fin (${horario.horaFin})`
      }
    }

    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    // Validar todos los campos
    const newErrors: FormErrors = {}
    
    newErrors.nombre = validateField('nombre', formData.nombre)
    // Descripción es opcional, solo validar si tiene contenido
    if (formData.descripcion.trim()) {
      newErrors.descripcion = validateField('descripcion', formData.descripcion)
    }
    newErrors.cupo = validateField('cupo', formData.cupo)
    newErrors.precio = validateField('precio', formData.precio)
    newErrors.horarios = validateHorarios()

    // Filtrar errores vacíos
    const filteredErrors = Object.fromEntries(
      Object.entries(newErrors).filter(([, value]) => value)
    )

    if (Object.keys(filteredErrors).length > 0) {
      setErrors(filteredErrors)
      setIsSubmitting(false)
      return
    }

    try {
      // Preparar horarios válidos para envío
      const horariosValidos = formData.horarios
        .filter(h => h.dia && h.horaInicio && h.horaFin)
        .map(h => ({
          dia: h.dia,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin
        }))

      const response = await fetch('/api/practicas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim(),
          cupo: parseInt(formData.cupo),
          precio: parseInt(formData.precio),
          horarios: horariosValidos
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ general: data.error || 'Error al registrar la práctica' })
        return
      }

      // Mostrar mensaje de éxito
      setErrors({ general: '✓ Práctica registrada exitosamente' })
      
      // Limpiar formulario
      setFormData({
        nombre: '',
        descripcion: '',
        cupo: '',
        precio: '',
        horarios: [{
          id: '1',
          dia: '',
          horaInicio: '',
          horaFin: ''
        }]
      })
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setErrors({})
      }, 3000)

    } catch (error) {
      setErrors({ 
        general: error instanceof Error ? error.message : 'Error al registrar la práctica'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    // Verificar que todos los campos requeridos estén llenos
    const camposLlenos = formData.nombre.trim() !== '' &&
                         formData.cupo.trim() !== '' &&
                         formData.precio.trim() !== ''
    
    // Verificar que cupo sea válido
    const cupoValido = /^\d+$/.test(formData.cupo) && parseInt(formData.cupo) > 0
    
    // Verificar que precio sea válido
    const precioValido = /^\d+$/.test(formData.precio) && parseInt(formData.precio) > 0
    
    // Validar que al menos un horario esté completo
    const horariosValidos = formData.horarios.some(h => h.dia && h.horaInicio && h.horaFin) &&
                            formData.horarios.every(h => {
                              if (!h.dia || !h.horaInicio || !h.horaFin) return true // Ignorar horarios incompletos
                              const [horaInicioH, horaInicioM] = h.horaInicio.split(':').map(Number)
                              const [horaFinH, horaFinM] = h.horaFin.split(':').map(Number)
                              const inicioMinutos = horaInicioH * 60 + horaInicioM
                              const finMinutos = horaFinH * 60 + horaFinM
                              return inicioMinutos < finMinutos
                            })
    
    // Verificar que no haya errores
    const noHayErrores = !errors.nombre && !errors.descripcion && !errors.cupo && !errors.precio && !errors.horarios
    
    return camposLlenos && cupoValido && precioValido && horariosValidos && noHayErrores
  }

  const handleCancel = () => {
    setFormData({
      nombre: '',
      descripcion: '',
      cupo: '',
      precio: '',
      horarios: [{
        id: '1',
        dia: '',
        horaInicio: '',
        horaFin: ''
      }]
    })
    setErrors({})
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
            Panel Principal &gt; Prácticas Deportivas &gt; Registrar Práctica
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-800">Registrar Práctica</h2>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className={`p-3 rounded-md ${errors.general.includes('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {errors.general}
              </div>
            )}
            
            {/* Fila 1: Nombre y Descripción */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-900 mb-2">
                  Nombre de la Práctica *
                </label>
                <input
                  type="text"
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.nombre ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ingrese el nombre"
                />
                {errors.nombre && (
                  <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
                )}
              </div>

              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-900 mb-2">
                  Descripción
                </label>
                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => handleInputChange('descripcion', e.target.value)}
                  maxLength={150}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.descripcion ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ingrese la descripción"
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.descripcion && (
                    <p className="text-sm text-red-600">{errors.descripcion}</p>
                  )}
                  <p className="text-sm text-gray-500 ml-auto">
                    {formData.descripcion.length}/150 caracteres
                  </p>
                </div>
              </div>
            </div>

            {/* Fila 2: Cupo y Precio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="cupo" className="block text-sm font-medium text-gray-900 mb-2">
                  Cupo máximo *
                </label>
                <input
                  type="text"
                  id="cupo"
                  value={formData.cupo}
                  onChange={(e) => handleInputChange('cupo', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.cupo ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ingrese el cupo máximo"
                />
                {errors.cupo && (
                  <p className="mt-1 text-sm text-red-600">{errors.cupo}</p>
                )}
              </div>

              <div>
                <label htmlFor="precio" className="block text-sm font-medium text-gray-900 mb-2">
                  Precio *
                </label>
                <input
                  type="text"
                  id="precio"
                  value={formData.precio}
                  onChange={(e) => handleInputChange('precio', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.precio ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Ingrese el precio"
                />
                {errors.precio && (
                  <p className="mt-1 text-sm text-red-600">{errors.precio}</p>
                )}
              </div>
            </div>

            {/* Horarios disponibles */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-4">
                Horarios disponibles *
              </label>
              
              {formData.horarios.map((horario, index) => (
                <div key={horario.id} className="flex items-center gap-4 mb-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <select
                      value={horario.dia}
                      onChange={(e) => handleHorarioChange(horario.id, 'dia', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="" className="text-gray-500">Seleccione día</option>
                      {diasSemana.map(dia => (
                        <option key={dia.value} value={dia.value} className="text-gray-900">{dia.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1">
                    <select
                      value={horario.horaInicio}
                      onChange={(e) => handleHorarioChange(horario.id, 'horaInicio', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="" className="text-gray-500">Hora Inicio</option>
                      {horasDisponibles.map(hora => (
                        <option key={hora} value={hora} className="text-gray-900">{hora}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex-1">
                    <select
                      value={horario.horaFin}
                      onChange={(e) => handleHorarioChange(horario.id, 'horaFin', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="" className="text-gray-500">Hora Fin</option>
                      {horasDisponibles.map(hora => (
                        <option key={hora} value={hora} className="text-gray-900">{hora}</option>
                      ))}
                    </select>
                  </div>

                  {formData.horarios.length > 1 && (
                    <button
                      type="button"
                      onClick={() => eliminarHorario(horario.id)}
                      className="px-3 py-2 text-red-600 hover:text-red-800 font-medium"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={agregarHorario}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Agregar horario
              </button>

              {errors.horarios && (
                <p className="mt-2 text-sm text-red-600">{errors.horarios}</p>
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-4 pt-6">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Registrando...' : 'Registrar'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
