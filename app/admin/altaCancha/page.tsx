'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAdminProtection } from '@/app/hooks/useAdminProtection'
import Sidebar from '@/app/components/Sidebar'
import { Plus, X } from 'lucide-react'

interface Horario {
  inicio: string
  fin: string
}

interface FormData {
  nombre: string
  tipo: string
  ubicacion: string
  precio: string
}

interface FormErrors {
  nombre?: string
  tipo?: string
  ubicacion?: string
  horarios?: string
  precio?: string
  general?: string
}

export default function AltaCanchaPage() {
  const router = useRouter()
  // ✅ Verificar que sea admin ANTES de renderizar
  const { isAuthorized, isChecking } = useAdminProtection()

  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    tipo: '',
    ubicacion: '',
    precio: ''
  })
  const [horarios, setHorarios] = useState<Horario[]>([{ inicio: '', fin: '' }])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [tiposCancha, setTiposCancha] = useState<string[]>([])
  const [loadingTipos, setLoadingTipos] = useState(true)

  // Cargar tipos de cancha desde la API
  useEffect(() => {
    const fetchTiposCancha = async () => {
      try {
        const response = await fetch('/api/tipos-cancha')
        if (!response.ok) throw new Error('Error al cargar tipos de cancha')
        const data = await response.json()
        setTiposCancha(data.tipos)
      } catch (error) {
        console.error('Error:', error)
        setErrors({ general: 'Error al cargar los tipos de cancha' })
      } finally {
        setLoadingTipos(false)
      }
    }
    fetchTiposCancha()
  }, [])

  // Función para formatear el nombre del tipo para mostrar (transforma FUTBOL_5 -> Futbol 5)
  const formatTipoLabel = (tipo: string) => {
    return tipo
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  // Generar opciones de horarios de 8:00 a 23:00
  const generarOpcionesHorarios = () => {
    const opciones = []
    for (let hora = 8; hora <= 23; hora++) {
      const horaStr = hora.toString().padStart(2, '0') + ':00'
      opciones.push({ value: horaStr, label: horaStr })
    }
    return opciones
  }

  const opcionesHorarios = generarOpcionesHorarios()

  // Agregar nuevo horario
  const agregarHorario = () => {
    setHorarios([...horarios, { inicio: '', fin: '' }])
  }

  // Eliminar horario
  const eliminarHorario = (index: number) => {
    if (horarios.length > 1) {
      const nuevosHorarios = horarios.filter((_, i) => i !== index)
      setHorarios(nuevosHorarios)
    }
  }

  // Actualizar horario específico
  const actualizarHorario = (index: number, campo: 'inicio' | 'fin', valor: string) => {
    const nuevosHorarios = [...horarios]
    nuevosHorarios[index][campo] = valor
    setHorarios(nuevosHorarios)
    
    // Validar en tiempo real
    validarHorariosEnTiempoReal(nuevosHorarios)
  }

  // Validar horarios en tiempo real
  const validarHorariosEnTiempoReal = (horariosActuales: Horario[]) => {
    // Verificar que todos los horarios tengan inicio y fin
    const todosCompletos = horariosActuales.every(h => h.inicio && h.fin)
    
    if (!todosCompletos) {
      // Limpiar error si no están todos completos aún
      if (errors.horarios) {
        setErrors(prev => ({ ...prev, horarios: undefined }))
      }
      return
    }

    // Validar que inicio < fin para cada horario
    for (let i = 0; i < horariosActuales.length; i++) {
      const horario = horariosActuales[i]
      if (horario.inicio === horario.fin) {
        setErrors(prev => ({ ...prev, horarios: 'El horario de inicio no puede ser igual al de fin' }))
        return
      }
      const horaInicio = parseInt(horario.inicio.split(':')[0])
      const horaFin = parseInt(horario.fin.split(':')[0])
      if (horaInicio >= horaFin) {
        setErrors(prev => ({ ...prev, horarios: 'El horario de inicio debe ser anterior al de fin' }))
        return
      }
    }

    // Validar superposiciones si hay más de un horario
    if (horariosActuales.length > 1) {
      for (let i = 0; i < horariosActuales.length; i++) {
        for (let j = i + 1; j < horariosActuales.length; j++) {
          const horario1 = horariosActuales[i]
          const horario2 = horariosActuales[j]
          
          // Solo validar si ambos horarios están completos
          if (!horario1.inicio || !horario1.fin || !horario2.inicio || !horario2.fin) {
            continue
          }
          
          const inicio1 = parseInt(horario1.inicio.split(':')[0])
          const fin1 = parseInt(horario1.fin.split(':')[0])
          const inicio2 = parseInt(horario2.inicio.split(':')[0])
          const fin2 = parseInt(horario2.fin.split(':')[0])
          
          // Verificar superposición
          if (inicio1 < fin2 && inicio2 < fin1) {
            setErrors(prev => ({ 
              ...prev, 
              horarios: `Los horarios no pueden superponerse. Conflicto entre ${horario1.inicio}-${horario1.fin} y ${horario2.inicio}-${horario2.fin}` 
            }))
            return
          }
        }
      }
    }

    // Si todo está bien, limpiar errores
    setErrors(prev => ({ ...prev, horarios: undefined }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    // Validar precio en tiempo real - solo permitir dígitos
    if (name === 'precio') {
      // Solo permitir números
      if (value !== '' && !/^\d+$/.test(value)) {
        return // No actualizar si contiene caracteres no numéricos
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Validar campo en tiempo real
    validateFieldInline(name, value)
  }

  const validateFieldInline = (name: string, value: string) => {
    const newErrors = { ...errors }
    
    switch (name) {
      case 'nombre':
        if (!value.trim()) {
          newErrors.nombre = 'El nombre de cancha es requerido'
        } else {
          delete newErrors.nombre
        }
        break
      case 'tipo':
        if (!value) {
          newErrors.tipo = 'Debe seleccionar un tipo de cancha'
        } else {
          delete newErrors.tipo
        }
        break
      case 'ubicacion':
        if (!value.trim()) {
          newErrors.ubicacion = 'La ubicación es requerida'
        } else if (value.length > 100) {
          newErrors.ubicacion = 'La ubicación no puede exceder 100 caracteres'
        } else {
          delete newErrors.ubicacion
        }
        break
      case 'precio':
        if (!value.trim()) {
          newErrors.precio = 'El precio es requerido'
        } else if (!/^\d+$/.test(value)) {
          newErrors.precio = 'El precio debe contener solo dígitos'
        } else if (parseInt(value) <= 0) {
          newErrors.precio = 'El precio debe ser mayor a 0'
        } else {
          delete newErrors.precio
        }
        break
    }
    
    setErrors(newErrors)
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre de cancha es requerido'
    }

    if (!formData.tipo) {
      newErrors.tipo = 'Debe seleccionar un tipo de cancha'
    }

    if (!formData.ubicacion.trim()) {
      newErrors.ubicacion = 'La ubicación es requerida'
    } else if (formData.ubicacion.length > 100) {
      newErrors.ubicacion = 'La ubicación no puede exceder 100 caracteres'
    }

    // Validar precio - solo dígitos
    if (!formData.precio.trim()) {
      newErrors.precio = 'El precio es requerido'
    } else if (!/^\d+$/.test(formData.precio)) {
      newErrors.precio = 'El precio debe contener solo dígitos'
    } else if (parseInt(formData.precio) <= 0) {
      newErrors.precio = 'El precio debe ser mayor a 0'
    }

    // Validar horarios
    let horariosValidos = true
    for (let i = 0; i < horarios.length; i++) {
      const horario = horarios[i]
      if (!horario.inicio || !horario.fin) {
        newErrors.horarios = 'Todos los horarios deben tener inicio y fin'
        horariosValidos = false
        break
      }
      if (horario.inicio === horario.fin) {
        newErrors.horarios = 'El horario de inicio no puede ser igual al de fin'
        horariosValidos = false
        break
      }
      const horaInicio = parseInt(horario.inicio.split(':')[0])
      const horaFin = parseInt(horario.fin.split(':')[0])
      if (horaInicio >= horaFin) {
        newErrors.horarios = 'El horario de inicio debe ser anterior al de fin'
        horariosValidos = false
        break
      }
    }

    // Validar que los horarios no se superpongan
    if (horariosValidos && horarios.length > 1) {
      for (let i = 0; i < horarios.length; i++) {
        for (let j = i + 1; j < horarios.length; j++) {
          const horario1 = horarios[i]
          const horario2 = horarios[j]
          
          const inicio1 = parseInt(horario1.inicio.split(':')[0])
          const fin1 = parseInt(horario1.fin.split(':')[0])
          const inicio2 = parseInt(horario2.inicio.split(':')[0])
          const fin2 = parseInt(horario2.fin.split(':')[0])
          
          // Verificar superposición
          // Horario 1: [inicio1, fin1), Horario 2: [inicio2, fin2)
          // Se superponen si: inicio1 < fin2 && inicio2 < fin1
          if (inicio1 < fin2 && inicio2 < fin1) {
            newErrors.horarios = `Los horarios no pueden superponerse. Conflicto entre ${horario1.inicio}-${horario1.fin} y ${horario2.inicio}-${horario2.fin}`
            horariosValidos = false
            break
          }
        }
        if (!horariosValidos) break
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isFormValid = () => {
    // Verificar que todos los campos requeridos estén llenos
    const camposLlenos = formData.nombre.trim() !== '' &&
                         formData.tipo !== '' &&
                         formData.ubicacion.trim() !== '' &&
                         formData.precio.trim() !== ''
    
    // Verificar que el precio sea válido
    const precioValido = /^\d+$/.test(formData.precio) && parseInt(formData.precio) > 0
    
    // Validar que todos los horarios estén completos y sean válidos
    const horariosValidos = horarios.length > 0 && horarios.every(h => {
      if (!h.inicio || !h.fin) return false
      const horaInicio = parseInt(h.inicio.split(':')[0])
      const horaFin = parseInt(h.fin.split(':')[0])
      return horaInicio < horaFin
    })
    
    // Verificar que no haya errores (excepto 'general')
    const noHayErrores = !errors.nombre && !errors.tipo && !errors.ubicacion && !errors.precio && !errors.horarios
    
    const esValido = camposLlenos && precioValido && horariosValidos && noHayErrores
    
    // Debug
    console.log('Validación formulario:', {
      camposLlenos,
      precioValido,
      horariosValidos,
      noHayErrores,
      esValido,
      formData,
      horarios,
      errors
    })
    
    return esValido
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/canchas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          tipo: formData.tipo,
          ubicacion: formData.ubicacion,
          horarios: horarios.map(h => ({ inicio: h.inicio, fin: h.fin })),
          precio: parseInt(formData.precio)
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al registrar la cancha')
      }

      // Limpiar formulario y mostrar éxito
      setFormData({
        nombre: '',
        tipo: '',
        ubicacion: '',
        precio: ''
      })
      setHorarios([{ inicio: '', fin: '' }])
      setErrors({ general: '✓ Cancha registrada exitosamente' })
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setErrors(prev => {
          const { general, ...rest } = prev
          return rest
        })
      }, 3000)
      
    } catch (error) {
      console.error('Error:', error)
      setErrors({ general: error instanceof Error ? error.message : 'Error al registrar la cancha' })
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
    );
  }

  // ✅ No renderizar nada si no está autorizado
  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-4">
          <span>Panel Principal</span>
          <span className="mx-2">&gt;</span>
          <span>Canchas</span>
          <span className="mx-2">&gt;</span>
          <span className="text-gray-700">Registrar Cancha</span>
        </nav>

        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Registrar Cancha</h1>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
          {errors.general && (
            <div className={`p-3 rounded-md ${errors.general.includes('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {errors.general}
            </div>
          )}
          
          {/* Primera fila: Nombre */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-600 mb-2">
                Nombre de Cancha <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Ingrese el nombre"
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.nombre ? 'border-red-500' : ''
                }`}
              />
              {errors.nombre && <p className="mt-1 text-sm text-red-500">{errors.nombre}</p>}
            </div>
          </div>

          {/* Segunda fila: Tipo y Ubicación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo */}
            <div>
              <label htmlFor="tipo" className="block text-sm font-medium text-gray-600 mb-2">
                Tipo <span className="text-red-500">*</span>
              </label>
              <select
                id="tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleInputChange}
                disabled={loadingTipos}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white ${
                  errors.tipo ? 'border-red-500' : ''
                }`}
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23333\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center' }}
              >
                <option value="">
                  {loadingTipos ? 'Cargando tipos...' : 'Seleccione un tipo'}
                </option>
                {tiposCancha.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {formatTipoLabel(tipo)}
                  </option>
                ))}
              </select>
              {errors.tipo && <p className="mt-1 text-sm text-red-500">{errors.tipo}</p>}
            </div>

            {/* Ubicación */}
            <div>
              <label htmlFor="ubicacion" className="block text-sm font-medium text-gray-600 mb-2">
                Ubicación <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="ubicacion"
                name="ubicacion"
                value={formData.ubicacion}
                onChange={handleInputChange}
                placeholder="Ingrese la ubicación"
                maxLength={100}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.ubicacion ? 'border-red-500' : ''
                }`}
              />
              {errors.ubicacion && <p className="mt-1 text-sm text-red-500">{errors.ubicacion}</p>}
            </div>
          </div>

          {/* Tercera fila: Precio */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="precio" className="block text-sm font-medium text-gray-600 mb-2">
                Precio (solo dígitos) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="precio"
                name="precio"
                value={formData.precio}
                onChange={handleInputChange}
                placeholder="Ingrese el precio (solo números)"
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.precio ? 'border-red-500' : ''
                }`}
              />
              {errors.precio && <p className="mt-1 text-sm text-red-500">{errors.precio}</p>}
              <p className="mt-1 text-xs text-gray-500">Solo se permiten números enteros positivos</p>
            </div>
          </div>

          {/* Cuarta fila: Horarios múltiples */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Horarios disponibles <span className="text-red-500">*</span>
            </label>
            <div className="space-y-4">
              {horarios.map((horario, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    {/* Horario Inicio */}
                    <select
                      value={horario.inicio}
                      onChange={(e) => actualizarHorario(index, 'inicio', e.target.value)}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white ${
                        errors.horarios ? 'border-red-500' : ''
                      }`}
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23333\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center' }}
                    >
                      <option value="">Hora Inicio</option>
                      {opcionesHorarios.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {/* Horario Fin */}
                    <select
                      value={horario.fin}
                      onChange={(e) => actualizarHorario(index, 'fin', e.target.value)}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white ${
                        errors.horarios ? 'border-red-500' : ''
                      }`}
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23333\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center' }}
                    >
                      <option value="">Hora Fin</option>
                      {opcionesHorarios.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Botón eliminar (solo si hay más de un horario) */}
                  {horarios.length > 1 && (
                    <button
                      type="button"
                      onClick={() => eliminarHorario(index)}
                      className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar horario"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              ))}

              {/* Botón agregar horario */}
              <button
                type="button"
                onClick={agregarHorario}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Agregar horario
              </button>
            </div>
            {errors.horarios && <p className="mt-1 text-sm text-red-500">{errors.horarios}</p>}
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !isFormValid()}
              className="px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
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
            </button>
          </div>
          </form>
        </div>
      </div>

  )
}