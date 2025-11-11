'use client'

import { useState, useEffect } from 'react'
import { User } from 'lucide-react'
import Sidebar from '@/app/components/Sidebar'

type DiaSemana = 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO' | 'DOMINGO'

interface Horario {
  id: string
  dia: DiaSemana | ''
  horaInicio: string
  horaFin: string
  esNuevo?: boolean // Para saber si es un horario nuevo o existente
}

interface Practica {
  id: number
  nombre: string
  descripcion: string
  cupo: number
  precio: number
  horarios: Array<{
    id: number
    dia: DiaSemana
    horaInicio: string
    horaFin: string
  }>
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
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00'
]

export default function ModifPracticaPage() {
  const [practicas, setPracticas] = useState<Practica[]>([])
  const [practicaSeleccionada, setPracticaSeleccionada] = useState<number | ''>('')
  const [datosOriginales, setDatosOriginales] = useState<FormData | null>(null)
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    descripcion: '',
    cupo: '',
    precio: '',
    horarios: [{
      id: '1',
      dia: '',
      horaInicio: '',
      horaFin: '',
      esNuevo: true
    }]
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hayCambios, setHayCambios] = useState(false)

  // Cargar prácticas deportivas al montar el componente
  useEffect(() => {
    cargarPracticas()
  }, [])

  // Detectar cambios en el formulario
  useEffect(() => {
    if (datosOriginales) {
      const cambiosDetectados = 
        formData.nombre !== datosOriginales.nombre ||
        formData.descripcion !== datosOriginales.descripcion ||
        formData.cupo !== datosOriginales.cupo ||
        formData.precio !== datosOriginales.precio ||
        JSON.stringify(formData.horarios) !== JSON.stringify(datosOriginales.horarios)
      
      setHayCambios(cambiosDetectados)
    }
  }, [formData, datosOriginales])

  const cargarPracticas = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/practicas')
      if (response.ok) {
        const data = await response.json()
        setPracticas(data)
      }
    } catch (error) {
      console.error('Error al cargar prácticas:', error)
      setErrors({ general: 'Error al cargar las prácticas deportivas' })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePracticaChange = (practicaId: string) => {
    if (!practicaId) {
      setPracticaSeleccionada('')
      setFormData({
        nombre: '',
        descripcion: '',
        cupo: '',
        precio: '',
        horarios: [{
          id: '1',
          dia: '',
          horaInicio: '',
          horaFin: '',
          esNuevo: true
        }]
      })
      setDatosOriginales(null)
      setErrors({})
      setHayCambios(false)
      return
    }

    const practica = practicas.find(p => p.id === parseInt(practicaId))
    if (practica) {
      setPracticaSeleccionada(practica.id)
      
      const horariosFormateados: Horario[] = practica.horarios.map((h, index) => ({
        id: `existing-${h.id}`,
        dia: h.dia,
        horaInicio: h.horaInicio,
        horaFin: h.horaFin,
        esNuevo: false
      }))

      const nuevosFormData = {
        nombre: practica.nombre,
        descripcion: practica.descripcion || '',
        cupo: practica.cupo.toString(),
        precio: practica.precio.toString(),
        horarios: horariosFormateados
      }

      setFormData(nuevosFormData)
      setDatosOriginales(JSON.parse(JSON.stringify(nuevosFormData))) // Copia profunda
      setErrors({})
      setHayCambios(false)
    }
  }

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'nombre':
        if (!value.trim()) return 'El nombre es obligatorio'
        // El nombre puede contener letras, números y espacios
        if (!/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
          return 'El nombre solo debe contener caracteres alfanuméricos'
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

  const handleInputChange = async (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    const error = validateField(name, value)
    setErrors(prev => ({ ...prev, [name]: error || undefined }))

    // Validación adicional para el nombre: verificar si ya existe
    if (name === 'nombre' && value.trim() && !error && practicaSeleccionada) {
      const practicaActual = practicas.find(p => p.id === practicaSeleccionada)
      // Solo validar si el nombre es diferente al original
      if (practicaActual && value.trim() !== practicaActual.nombre) {
        const nombreExiste = practicas.some(p => 
          p.nombre.toLowerCase() === value.trim().toLowerCase() && p.id !== practicaSeleccionada
        )
        if (nombreExiste) {
          setErrors(prev => ({ ...prev, nombre: 'Ya existe una práctica con ese nombre' }))
        }
      }
    }
  }

  const handleHorarioChange = (id: string, field: keyof Horario, value: string) => {
    const nuevosHorarios = formData.horarios.map(horario =>
      horario.id === id ? { ...horario, [field]: value } : horario
    )
    
    setFormData(prev => ({
      ...prev,
      horarios: nuevosHorarios
    }))
    
    validarHorariosEnTiempoReal(nuevosHorarios)
  }

  const validarHorariosEnTiempoReal = (horarios: Horario[]) => {
    const horariosCompletos = horarios.filter(h => h.dia && h.horaInicio && h.horaFin)
    
    if (horariosCompletos.length === 0) {
      setErrors(prev => ({ ...prev, horarios: undefined }))
      return
    }

    // Validar que hora inicio < hora fin para cada horario
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

    // Validar que no haya superposición de horarios en el mismo día
    for (let i = 0; i < horariosCompletos.length; i++) {
      for (let j = i + 1; j < horariosCompletos.length; j++) {
        const horario1 = horariosCompletos[i]
        const horario2 = horariosCompletos[j]

        // Solo comparar si son del mismo día
        if (horario1.dia === horario2.dia) {
          const [h1InicioH, h1InicioM] = horario1.horaInicio.split(':').map(Number)
          const [h1FinH, h1FinM] = horario1.horaFin.split(':').map(Number)
          const [h2InicioH, h2InicioM] = horario2.horaInicio.split(':').map(Number)
          const [h2FinH, h2FinM] = horario2.horaFin.split(':').map(Number)

          const h1Inicio = h1InicioH * 60 + h1InicioM
          const h1Fin = h1FinH * 60 + h1FinM
          const h2Inicio = h2InicioH * 60 + h2InicioM
          const h2Fin = h2FinH * 60 + h2FinM

          // Verificar superposición: horario1 se superpone con horario2 si:
          // - El inicio de h1 está entre el inicio y fin de h2, o
          // - El fin de h1 está entre el inicio y fin de h2, o
          // - h1 contiene completamente a h2
          if ((h1Inicio >= h2Inicio && h1Inicio < h2Fin) ||
              (h1Fin > h2Inicio && h1Fin <= h2Fin) ||
              (h1Inicio <= h2Inicio && h1Fin >= h2Fin)) {
            const diaLabel = diasSemana.find(d => d.value === horario1.dia)?.label || horario1.dia
            setErrors(prev => ({ 
              ...prev, 
              horarios: `Los horarios del día ${diaLabel} se superponen: ${horario1.horaInicio}-${horario1.horaFin} y ${horario2.horaInicio}-${horario2.horaFin}` 
            }))
            return
          }
        }
      }
    }

    setErrors(prev => ({ ...prev, horarios: undefined }))
  }

  const agregarHorario = () => {
    const newId = `new-${Date.now()}`
    setFormData(prev => ({
      ...prev,
      horarios: [...prev.horarios, {
        id: newId,
        dia: '',
        horaInicio: '',
        horaFin: '',
        esNuevo: true
      }]
    }))
  }

  const eliminarHorario = (id: string) => {
    if (formData.horarios.length > 1) {
      setFormData(prev => ({
        ...prev,
        horarios: prev.horarios.filter(horario => horario.id !== id)
      }))
    } else {
      setErrors(prev => ({ ...prev, horarios: 'Debe mantener al menos un horario' }))
    }
  }

  const validateHorarios = (): string => {
    const horariosValidos = formData.horarios.filter(h => h.dia && h.horaInicio && h.horaFin)
    
    if (horariosValidos.length === 0) {
      return 'Debe mantener al menos un horario completo'
    }

    // Validar que hora inicio < hora fin
    for (const horario of horariosValidos) {
      const [horaInicioH, horaInicioM] = horario.horaInicio.split(':').map(Number)
      const [horaFinH, horaFinM] = horario.horaFin.split(':').map(Number)
      const inicioMinutos = horaInicioH * 60 + horaInicioM
      const finMinutos = horaFinH * 60 + horaFinM

      if (inicioMinutos >= finMinutos) {
        return `La hora de inicio (${horario.horaInicio}) debe ser menor que la hora de fin (${horario.horaFin})`
      }
    }

    // Validar que no haya superposición de horarios en el mismo día
    for (let i = 0; i < horariosValidos.length; i++) {
      for (let j = i + 1; j < horariosValidos.length; j++) {
        const horario1 = horariosValidos[i]
        const horario2 = horariosValidos[j]

        if (horario1.dia === horario2.dia) {
          const [h1InicioH, h1InicioM] = horario1.horaInicio.split(':').map(Number)
          const [h1FinH, h1FinM] = horario1.horaFin.split(':').map(Number)
          const [h2InicioH, h2InicioM] = horario2.horaInicio.split(':').map(Number)
          const [h2FinH, h2FinM] = horario2.horaFin.split(':').map(Number)

          const h1Inicio = h1InicioH * 60 + h1InicioM
          const h1Fin = h1FinH * 60 + h1FinM
          const h2Inicio = h2InicioH * 60 + h2InicioM
          const h2Fin = h2FinH * 60 + h2FinM

          if ((h1Inicio >= h2Inicio && h1Inicio < h2Fin) ||
              (h1Fin > h2Inicio && h1Fin <= h2Fin) ||
              (h1Inicio <= h2Inicio && h1Fin >= h2Fin)) {
            const diaLabel = diasSemana.find(d => d.value === horario1.dia)?.label || horario1.dia
            return `Los horarios del día ${diaLabel} se superponen: ${horario1.horaInicio}-${horario1.horaFin} y ${horario2.horaInicio}-${horario2.horaFin}`
          }
        }
      }
    }

    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!hayCambios) {
      setErrors({ general: 'No se han detectado cambios para guardar' })
      return
    }

    setIsSubmitting(true)
    setErrors({})

    // Validar todos los campos
    const newErrors: FormErrors = {}
    
    newErrors.nombre = validateField('nombre', formData.nombre)
    if (formData.descripcion.trim()) {
      newErrors.descripcion = validateField('descripcion', formData.descripcion)
    }
    newErrors.cupo = validateField('cupo', formData.cupo)
    newErrors.precio = validateField('precio', formData.precio)
    newErrors.horarios = validateHorarios()

    const filteredErrors = Object.fromEntries(
      Object.entries(newErrors).filter(([, value]) => value)
    )

    if (Object.keys(filteredErrors).length > 0) {
      setErrors(filteredErrors)
      setIsSubmitting(false)
      return
    }

    try {
      const horariosValidos = formData.horarios
        .filter(h => h.dia && h.horaInicio && h.horaFin)
        .map(h => ({
          dia: h.dia,
          horaInicio: h.horaInicio,
          horaFin: h.horaFin
        }))

      const response = await fetch('/api/practicas', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: practicaSeleccionada,
          nombre: formData.nombre.trim(),
          descripcion: formData.descripcion.trim(),
          cupo: parseInt(formData.cupo),
          precio: parseInt(formData.precio),
          horarios: horariosValidos
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ general: data.error || 'Error al modificar la práctica' })
        return
      }

      // Mostrar mensaje de éxito
      setErrors({ general: '✓ Práctica deportiva modificada exitosamente!' })
      
      // Recargar las prácticas
      await cargarPracticas()
      
      // Limpiar formulario y selección
      setPracticaSeleccionada('')
      setFormData({
        nombre: '',
        descripcion: '',
        cupo: '',
        precio: '',
        horarios: []
      })
      setDatosOriginales(null)
      setHayCambios(false)
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setErrors({})
      }, 3000)

    } catch (error) {
      setErrors({ 
        general: error instanceof Error ? error.message : 'Error al modificar la práctica'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (datosOriginales) {
      setFormData(JSON.parse(JSON.stringify(datosOriginales)))
      setErrors({})
      setHayCambios(false)
    }
  }

  const isFormValid = () => {
    if (!hayCambios) return false
    
    const camposLlenos = formData.nombre.trim() !== '' &&
                         formData.cupo.trim() !== '' &&
                         formData.precio.trim() !== ''
    
    const cupoValido = /^\d+$/.test(formData.cupo) && parseInt(formData.cupo) > 0
    const precioValido = /^\d+$/.test(formData.precio) && parseInt(formData.precio) > 0
    
    // Validar que TODOS los horarios estén completos (no permitir horarios parcialmente llenos)
    const todosHorariosCompletos = formData.horarios.every(h => 
      h.dia !== '' && h.horaInicio !== '' && h.horaFin !== ''
    )
    
    // Validar que todos los horarios completos tengan hora inicio < hora fin
    const horariosValidos = todosHorariosCompletos &&
                            formData.horarios.every(h => {
                              const [horaInicioH, horaInicioM] = h.horaInicio.split(':').map(Number)
                              const [horaFinH, horaFinM] = h.horaFin.split(':').map(Number)
                              const inicioMinutos = horaInicioH * 60 + horaInicioM
                              const finMinutos = horaFinH * 60 + horaFinM
                              return inicioMinutos < finMinutos
                            })
    
    const noHayErrores = !errors.nombre && !errors.descripcion && !errors.cupo && !errors.precio && !errors.horarios
    
    return camposLlenos && cupoValido && precioValido && horariosValidos && noHayErrores
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Gestor Club Deportivo</h1>
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-5 h-5" />
              <span>Usuario Admin</span>
            </div>
          </div>
          
          {/* Breadcrumb */}
          <div className="text-sm text-gray-500 mb-6">
            Panel Principal &gt; Prácticas Deportivas &gt; Modificar Práctica
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-800">Modificar Práctica</h2>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-lg shadow-md p-8 max-w-4xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && !errors.general.includes('✓') && (
              <div className="p-3 rounded-md bg-red-50 text-red-700">
                {errors.general}
              </div>
            )}
            
            {/* Selector de Práctica */}
            <div>
              <label htmlFor="practicaSelect" className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Práctica por Nombre <span className="text-red-500">*</span>
              </label>
              <select
                id="practicaSelect"
                value={practicaSeleccionada}
                onChange={(e) => handlePracticaChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              >
                <option value="">Seleccione la práctica</option>
                {practicas.map(practica => (
                  <option key={practica.id} value={practica.id}>
                    {practica.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Campos editables */}
            {/* Fila 1: Nombre y Descripción */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.nombre ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="[Nombre]"
                  disabled={!practicaSeleccionada}
                />
                {errors.nombre && (
                  <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
                )}
              </div>

              <div>
                <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <input
                  type="text"
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => handleInputChange('descripcion', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.descripcion ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="[Descripción]"
                  maxLength={150}
                  disabled={!practicaSeleccionada}
                />
                {errors.descripcion && (
                  <p className="mt-1 text-sm text-red-600">{errors.descripcion}</p>
                )}
              </div>
            </div>

            {/* Fila 2: Cupo y Precio */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="cupo" className="block text-sm font-medium text-gray-700 mb-2">
                  Cupo máximo <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="cupo"
                  value={formData.cupo}
                  onChange={(e) => handleInputChange('cupo', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.cupo ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="[Cupo máximo]"
                  disabled={!practicaSeleccionada}
                  min="1"
                />
                {errors.cupo && (
                  <p className="mt-1 text-sm text-red-600">{errors.cupo}</p>
                )}
              </div>

              <div>
                <label htmlFor="precio" className="block text-sm font-medium text-gray-700 mb-2">
                  Precio <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="precio"
                  value={formData.precio}
                  onChange={(e) => handleInputChange('precio', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.precio ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="[Precio]"
                  disabled={!practicaSeleccionada}
                  min="1"
                />
                {errors.precio && (
                  <p className="mt-1 text-sm text-red-600">{errors.precio}</p>
                )}
              </div>
            </div>

            {/* Horarios actuales */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Horarios actuales (editable)
              </label>
              
              {formData.horarios.map((horario, index) => (
                <div key={horario.id} className="mb-4 p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">
                      {horario.esNuevo ? 'Nuevo horario' : `Horario ${index + 1}`} (editable)
                    </span>
                    {formData.horarios.length > 1 && practicaSeleccionada && (
                      <button
                        type="button"
                        onClick={() => eliminarHorario(horario.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Día</label>
                      <select
                        value={horario.dia}
                        onChange={(e) => handleHorarioChange(horario.id, 'dia', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!practicaSeleccionada}
                      >
                        <option value="">Seleccione día</option>
                        {diasSemana.map(dia => (
                          <option key={dia.value} value={dia.value}>{dia.label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Hora Inicio</label>
                      <select
                        value={horario.horaInicio}
                        onChange={(e) => handleHorarioChange(horario.id, 'horaInicio', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!practicaSeleccionada}
                      >
                        <option value="">Hora inicio</option>
                        {horasDisponibles.map(hora => (
                          <option key={hora} value={hora}>{hora}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Hora Fin</label>
                      <select
                        value={horario.horaFin}
                        onChange={(e) => handleHorarioChange(horario.id, 'horaFin', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={!practicaSeleccionada}
                      >
                        <option value="">Hora Fin</option>
                        {horasDisponibles.map(hora => (
                          <option key={hora} value={hora}>{hora}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              {errors.horarios && (
                <p className="mt-1 text-sm text-red-600">{errors.horarios}</p>
              )}

              {/* Botón Añadir horarios */}
              <button
                type="button"
                onClick={agregarHorario}
                className="mt-2 px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!practicaSeleccionada}
              >
                +
              </button>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center gap-4 pt-6">
              <button
                type="button"
                onClick={handleCancel}
                disabled={!hayCambios}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!isFormValid() || isSubmitting}
                className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </button>
              {/* Mensaje de éxito al lado del botón guardar */}
              {errors.general && errors.general.includes('✓') && (
                <span className="text-green-700 font-medium">
                  {errors.general}
                </span>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
