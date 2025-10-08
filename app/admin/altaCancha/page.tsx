'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/app/components/Sidebar'

interface FormData {
  numero: string
  tipo: string
  ubicacion: string
  horariosInicio: string
  horariosFin: string
  precio: string
}

interface FormErrors {
  numero?: string
  tipo?: string
  ubicacion?: string
  horariosInicio?: string
  horariosFin?: string
  precio?: string
}

export default function AltaCanchaPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>({
    numero: '',
    tipo: '',
    ubicacion: '',
    horariosInicio: '',
    horariosFin: '',
    precio: ''
  })
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
        alert('Error al cargar los tipos de cancha')
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.numero.trim()) {
      newErrors.numero = 'El número de cancha es requerido'
    } else if (!/^\d+$/.test(formData.numero)) {
      newErrors.numero = 'El número debe contener solo dígitos'
    }

    if (!formData.tipo) {
      newErrors.tipo = 'Debe seleccionar un tipo de cancha'
    }

    if (!formData.ubicacion.trim()) {
      newErrors.ubicacion = 'La ubicación es requerida'
    } else if (formData.ubicacion.length > 100) {
      newErrors.ubicacion = 'La ubicación no puede exceder 100 caracteres'
    }

    if (!formData.horariosInicio || !formData.horariosFin) {
      newErrors.horariosInicio = 'Debe seleccionar horario de inicio y fin'
    } else if (formData.horariosInicio === formData.horariosFin) {
      newErrors.horariosInicio = 'El horario de inicio no puede ser igual al horario de fin'
    } else {
      // Validar que el horario de inicio sea anterior al de fin
      const horaInicio = parseInt(formData.horariosInicio.split(':')[0])
      const horaFin = parseInt(formData.horariosFin.split(':')[0])
      if (horaInicio >= horaFin) {
        newErrors.horariosInicio = 'El horario de inicio debe ser anterior al horario de fin'
      }
    }

    if (!formData.precio.trim()) {
      newErrors.precio = 'El precio es requerido'
    } else if (!/^\d+$/.test(formData.precio)) {
      newErrors.precio = 'El precio debe contener solo números'
    } else if (parseInt(formData.precio) <= 0) {
      newErrors.precio = 'El precio debe ser mayor a 0'
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
      const response = await fetch('/api/canchas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          numero: parseInt(formData.numero),
          tipo: formData.tipo,
          ubicacion: formData.ubicacion,
          horariosInicio: formData.horariosInicio,
          horariosFin: formData.horariosFin,
          precio: parseInt(formData.precio)
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al registrar la cancha')
      }

      // Redirigir a una página de éxito o mostrar mensaje
      alert('¡Cancha registrada exitosamente!')
      
      // Limpiar formulario
      setFormData({
        numero: '',
        tipo: '',
        ubicacion: '',
        horariosInicio: '',
        horariosFin: '',
        precio: ''
      })
      
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Error al registrar la cancha')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
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
          {/* Primera fila: Nombre */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="numero" className="block text-sm font-medium text-gray-600 mb-2">
                Nombre de Cancha <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="numero"
                name="numero"
                value={formData.numero}
                onChange={handleInputChange}
                placeholder="Ingrese el nombre"
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.numero ? 'border-red-500' : ''
                }`}
              />
              {errors.numero && <p className="mt-1 text-sm text-red-500">{errors.numero}</p>}
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

          {/* Tercera fila: Horarios */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Horarios disponibles <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Horario Inicio */}
              <select
                id="horariosInicio"
                name="horariosInicio"
                value={formData.horariosInicio}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white ${
                  errors.horariosInicio ? 'border-red-500' : ''
                }`}
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23333\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center' }}
              >
                <option value="">Seleccione horario de inicio</option>
                {opcionesHorarios.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* Horario Fin */}
              <select
                id="horariosFin"
                name="horariosFin"
                value={formData.horariosFin}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white ${
                  errors.horariosFin ? 'border-red-500' : ''
                }`}
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%23333\' d=\'M6 9L1 4h10z\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center' }}
              >
                <option value="">Seleccione horario de fin</option>
                {opcionesHorarios.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {errors.horariosInicio && <p className="mt-1 text-sm text-red-500">{errors.horariosInicio}</p>}
          </div>

          {/* Cuarta fila: Precio */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="precio" className="block text-sm font-medium text-gray-600 mb-2">
                Precio <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="precio"
                name="precio"
                value={formData.precio}
                onChange={handleInputChange}
                placeholder="Ingrese el precio"
                className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.precio ? 'border-red-500' : ''
                }`}
              />
              {errors.precio && <p className="mt-1 text-sm text-red-500">{errors.precio}</p>}
            </div>
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
              disabled={loading}
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