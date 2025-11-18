'use client';

import { useState } from 'react';
import { useAdminProtection } from '@/app/hooks/useAdminProtection';
import Sidebar from '../../components/Sidebar';
import { User } from 'lucide-react';

interface SocioFormData {
  nombre: string;
  dni: string;
  fechaNacimiento: string;
  email: string;
  telefono: string;
  direccion: string;
  contraseña: string;
  tipoSocio: 'INDIVIDUAL' | 'FAMILIAR';
}

interface FamiliarData {
  nombre: string;
  dni: string;
  fechaNacimiento: string;
  email: string;
  telefono: string;
  contraseña: string;
  esMenorDe12: boolean;
}

// Función auxiliar para calcular edad
function calcularEdad(fechaNacimiento: string): number {
  if (!fechaNacimiento) return 0;
  
  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }
  
  return edad;
}

export default function AltaSocioPage() {
  // ✅ Verificar que sea admin ANTES de renderizar
  const { isAuthorized, isChecking } = useAdminProtection();

  const [formData, setFormData] = useState<SocioFormData>({
    nombre: '',
    dni: '',
    fechaNacimiento: '',
    email: '',
    telefono: '',
    direccion: '',
    contraseña: '',
    tipoSocio: 'INDIVIDUAL'
  });

  const [familiares, setFamiliares] = useState<FamiliarData[]>([]);
  const [showModalFamiliar, setShowModalFamiliar] = useState(false);
  const [familiarForm, setFamiliarForm] = useState<FamiliarData>({
    nombre: '',
    dni: '',
    fechaNacimiento: '',
    email: '',
    telefono: '',
    contraseña: '',
    esMenorDe12: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [familiarErrors, setFamiliarErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [mensajeTipo, setMensajeTipo] = useState<'success' | 'error' | 'info'>('info');
  // confirmation modal state to replace native confirm()
  const [showConversionConfirm, setShowConversionConfirm] = useState(false);
  const [pendingConversionEntry, setPendingConversionEntry] = useState<any | null>(null);

  // NUEVO: estado para búsqueda por DNI dentro del modal
  const [buscarDni, setBuscarDni] = useState('')
  const [buscandoDni, setBuscandoDni] = useState(false)
  const [resultadoBusqueda, setResultadoBusqueda] = useState<any | null>(null) // user obj or null if not existe
  const [busquedaRealizada, setBusquedaRealizada] = useState(false)

  // Validaciones
  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'nombre':
        if (!value.trim()) return 'El nombre es obligatorio';
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) return 'Solo se permiten caracteres';
        break;
      case 'dni':
        if (!value.trim()) return 'El DNI es obligatorio';
        if (!/^\d{7,8}$/.test(value)) return 'El DNI debe tener 7-8 dígitos';
        break;
      case 'fechaNacimiento':
        if (!value.trim()) return 'La fecha de nacimiento es obligatoria';
        const fechaNacimiento = new Date(value);
        const hoy = new Date();
        if (fechaNacimiento > hoy) return 'La fecha de nacimiento no puede ser futura';
        const edad = calcularEdad(value);
        // Validar edad mínima de 12 años para socio individual o cabeza de familia
        if (formData.tipoSocio === 'INDIVIDUAL' && edad < 12) {
          return 'El socio individual debe tener al menos 12 años';
        }
        break;
      case 'email':
        if (!value.trim()) return 'El email es obligatorio';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email inválido';
        break;
      case 'telefono':
        if (!value.trim()) return 'El teléfono es obligatorio';
        if (!/^\d+$/.test(value)) return 'Solo se permiten números';
        break;
      case 'contraseña':
        if (!value.trim()) return 'La contraseña es obligatoria';
        if (value.length < 8) return 'Mínimo 8 caracteres';
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(value)) {
          return 'Debe contener mayúscula, minúscula, número y carácter especial';
        }
        break;
      case 'direccion':
        if (!value.trim()) return 'La dirección es obligatoria';
        break;
    }
    return '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Si es DNI, permitir solo dígitos y máximo 8 caracteres
    const newValue = name === 'dni' ? value.replace(/\D/g, '').slice(0, 8) : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
    
    // Validar en tiempo real
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };
  
  const handleTipoSocioChange = (tipo: 'INDIVIDUAL' | 'FAMILIAR') => {
    setFormData(prev => ({ ...prev, tipoSocio: tipo }));
    if (tipo === 'INDIVIDUAL') {
      setFamiliares([]);
    }
  };

  const handleAddFamiliar = () => {
    // Validar que el socio principal tenga al menos 12 años
    const edadPrincipal = calcularEdad(formData.fechaNacimiento);
    if (edadPrincipal < 12) {
      setMensaje('El socio cabeza de familia debe tener al menos 12 años');
      setMensajeTipo('error');
      return;
    }
    
    setShowModalFamiliar(true);
    setFamiliarForm({
      nombre: '',
      dni: '',
      fechaNacimiento: '',
      email: '',
      telefono: '',
      contraseña: '',
      esMenorDe12: false
    });
    setFamiliarErrors({});
  };

  const handleRemoveFamiliar = (index: number) => {
    setFamiliares(prev => prev.filter((_, i) => i !== index));
    setMensaje('Familiar eliminado');
    setMensajeTipo('info');
  };

  const handleFamiliarInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    // Si estamos en la etapa de búsqueda por DNI y se edita el campo DNI, actualizar estado de búsqueda
    if (name === 'dni' && !busquedaRealizada) {
      const digits = value.replace(/\D/g, '').slice(0, 8)
      setBuscarDni(digits)
      setFamiliarForm(prev => ({ ...prev, dni: digits }))
      return
    }
    
    // mantener la lógica previa de actualización y cálculo de edad
    if (name === 'fechaNacimiento') {
      const edad = calcularEdad(value)
      const esMenor = edad < 12
      
      setFamiliarForm(prev => ({
        ...prev,
        [name]: value,
        esMenorDe12: esMenor,
        // Si es menor, copiar datos del socio principal
        email: esMenor ? formData.email : prev.email,
        telefono: esMenor ? formData.telefono : prev.telefono,
        contraseña: esMenor ? '' : prev.contraseña
      }));
      
      // Validar fecha de nacimiento
      validateFamiliarField('fechaNacimiento', value);
    } else {
      setFamiliarForm(prev => ({ ...prev, [name]: value }));
      // Validar campo en tiempo real (solo si no es un campo boolean)
      if (name !== 'esMenorDe12') {
        validateFamiliarField(name, value);
      }
    }
  };

  // NUEVO: buscar socio por DNI desde el modal
  const buscarSocioPorDni = async () => {
    // asegurarse que el dni usado para buscar solo tenga dígitos
    const dni = (buscarDni || familiarForm.dni || '').replace(/\D/g, '').slice(0,8).trim()
    if (!dni) {
      setFamiliarErrors(prev => ({ ...prev, dni: 'Ingrese un DNI para buscar' }))
      return
    }
    setBuscandoDni(true)
    setResultadoBusqueda(null)
    setBusquedaRealizada(false)
    // Eliminar claves previas 'dni' y 'general' en lugar de asignar undefined
    setFamiliarErrors(prev => {
      const { dni, general, ...rest } = prev
      return rest
    })
    try {
      const res = await fetch(`/api/socios?dni=${encodeURIComponent(dni)}`)
      const data = await res.json()
      if (res.ok && data.existe && data.socio) {
        setResultadoBusqueda(data.socio) // socio encontrado
      } else {
        setResultadoBusqueda(null) // no existe en DB
      }
      setBusquedaRealizada(true)
    } catch (err) {
      setFamiliarErrors(prev => ({ ...prev, general: 'Error al consultar DNI' }))
    } finally {
      setBuscandoDni(false)
    }
  }

  // Validar todos los campos
  const validateFamiliarField = (field: string, value: string) => {
    const newErrors = { ...familiarErrors };
    
    switch (field) {
      case 'nombre':
        if (!value.trim()) {
          newErrors.nombre = 'El nombre es obligatorio';
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
          newErrors.nombre = 'Solo se permiten caracteres';
        } else {
          delete newErrors.nombre;
        }
        break;
      case 'dni':
        if (!value.trim()) {
          newErrors.dni = 'El DNI es obligatorio';
        } else if (!/^\d{7,8}$/.test(value)) {
          newErrors.dni = 'El DNI debe tener 7-8 dígitos';
        } else if (value === formData.dni) {
          newErrors.dni = 'El DNI no puede ser igual al del socio principal';
        } else if (familiares.some(f => f.dni === value)) {
          newErrors.dni = 'El DNI ya fue agregado a otro familiar';
        } else {
          delete newErrors.dni;
        }
        break;
      case 'fechaNacimiento':
        if (!value.trim()) {
          newErrors.fechaNacimiento = 'La fecha de nacimiento es obligatoria';
        } else {
          const fechaNacimiento = new Date(value);
          const hoy = new Date();
          if (fechaNacimiento > hoy) {
            newErrors.fechaNacimiento = 'La fecha de nacimiento no puede ser futura';
          } else {
            delete newErrors.fechaNacimiento;
          }
        }
        break;
      case 'email':
        // Solo validar si NO es menor
        if (!familiarForm.esMenorDe12) {
          if (!value.trim()) {
            newErrors.email = 'El email es obligatorio';
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            newErrors.email = 'Email inválido';
          } else if (value === formData.email) {
            newErrors.email = 'El email no puede ser igual al del socio principal';
          } else if (familiares.some(f => !f.esMenorDe12 && f.email === value)) {
            newErrors.email = 'El email ya fue agregado a otro familiar';
          } else {
            delete newErrors.email;
          }
        } else {
          delete newErrors.email;
        }
        break;
      case 'telefono':
        // Solo validar si NO es menor
        if (!familiarForm.esMenorDe12) {
          if (!value.trim()) {
            newErrors.telefono = 'El teléfono es obligatorio';
          } else if (!/^\d+$/.test(value)) {
            newErrors.telefono = 'Solo se permiten números';
          } else {
            delete newErrors.telefono;
          }
        } else {
          delete newErrors.telefono;
        }
        break;
      case 'contraseña':
        // Solo validar si NO es menor
        if (!familiarForm.esMenorDe12) {
          if (!value.trim()) {
            newErrors.contraseña = 'La contraseña es obligatoria';
          } else if (value.length < 8) {
            newErrors.contraseña = 'Mínimo 8 caracteres';
          } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(value)) {
            newErrors.contraseña = 'Debe contener mayúscula, minúscula, número y carácter especial';
          } else {
            delete newErrors.contraseña;
          }
        } else {
          delete newErrors.contraseña;
        }
        break;
    }
    
    setFamiliarErrors(newErrors);
  };

  const isFamiliarFormValid = () => {
    // Validar que no haya errores
    if (Object.keys(familiarErrors).length > 0) return false;
    
    // Campos siempre requeridos
    if (!familiarForm.nombre.trim() || !familiarForm.dni.trim() || !familiarForm.fechaNacimiento) {
      return false;
    }
    
    // Si NO es menor, validar email, telefono y contraseña
    if (!familiarForm.esMenorDe12) {
      if (!familiarForm.email.trim() || !familiarForm.telefono.trim() || !familiarForm.contraseña.trim()) {
        return false;
      }
    }
    
    return true;
  };

  // Ajustar guardado de familiar según resultado de la búsqueda
  const handleSaveFamiliar = async () => {
    // Validación adicional: asegurar que el DNI tenga 7 u 8 dígitos antes de proceder
    const dniToCheck = busquedaRealizada && resultadoBusqueda
      ? String(resultadoBusqueda.dni || '').replace(/\D/g, '').slice(0,8)
      : String(familiarForm.dni || '').replace(/\D/g, '').slice(0,8)

    if (!/^\d{7,8}$/.test(dniToCheck)) {
      setFamiliarErrors(prev => ({ ...prev, dni: 'El DNI debe tener 7 u 8 dígitos' }))
      return
    }

    // Si búsqueda realizada y existe en DB
    if (busquedaRealizada && resultadoBusqueda) {
      // Si pertenece a otro plan familiar -> error
      if (resultadoBusqueda.tipoSocio === 'FAMILIAR') {
        setFamiliarErrors(prev => ({ ...prev, dni: 'El socio ingresado ya pertenece a un plan familiar' }));
        return;
      }
      // Si es INDIVIDUAL -> marcar conversión y agregar
      if (resultadoBusqueda.tipoSocio === 'INDIVIDUAL') {
        const existingEntry: any = {
          id: resultadoBusqueda.id,
          nombre: resultadoBusqueda.nombre,
          dni: String(resultadoBusqueda.dni).replace(/\D/g, '').slice(0,8),
          fechaNacimiento: resultadoBusqueda.fechaNacimiento,
          email: resultadoBusqueda.email,
          telefono: resultadoBusqueda.telefono,
          esMenorDe12: resultadoBusqueda.esMenorDe12 ?? false,
          existing: true
        }
        setFamiliares(prev => [...prev, existingEntry as unknown as FamiliarData])
        setShowModalFamiliar(false)
        setFamiliarErrors({})
        setResultadoBusqueda(null)
        setBusquedaRealizada(false)
        setBuscarDni('')
        setMensaje('Socio existente agregado y marcado para conversión')
        setMensajeTipo('success')
        return
      }
    }

    // Si no existe en DB -> validar formulario y agregar nuevo familiar
    validateFamiliarField('nombre', familiarForm.nombre)
    validateFamiliarField('dni', familiarForm.dni)
    validateFamiliarField('fechaNacimiento', familiarForm.fechaNacimiento)
    if (!familiarForm.esMenorDe12) {
      validateFamiliarField('email', familiarForm.email)
      validateFamiliarField('telefono', familiarForm.telefono)
      validateFamiliarField('contraseña', familiarForm.contraseña)
    }

    if (!isFamiliarFormValid()) return

    // Agregar al listado local
    setFamiliares(prev => [...prev, { ...familiarForm, dni: String(familiarForm.dni).replace(/\D/g, '').slice(0,8) }])
    setShowModalFamiliar(false)
    setFamiliarErrors({})
    setMensaje('Familiar agregado exitosamente')
    setMensajeTipo('success')
    setResultadoBusqueda(null)
    setBusquedaRealizada(false)
    setBuscarDni('')
  }

  const confirmConversion = () => {
    if (!pendingConversionEntry) return;
    const socioExistente = pendingConversionEntry;
    const existingEntry: any = {
      id: socioExistente.id,
      nombre: socioExistente.nombre,
      dni: socioExistente.dni,
      fechaNacimiento: socioExistente.fechaNacimiento,
      email: socioExistente.email,
      telefono: socioExistente.telefono,
      esMenorDe12: socioExistente.esMenorDe12,
      existing: true
    };

    setFamiliares(prev => [...prev, existingEntry as unknown as FamiliarData]);
    setShowModalFamiliar(false);
    setFamiliarErrors({});
    setMensaje('Socio existente agregado al grupo familiar y marcado para conversión');
    setMensajeTipo('success');
    setPendingConversionEntry(null);
    setShowConversionConfirm(false);
  };

  const cancelConversion = () => {
    setPendingConversionEntry(null);
    setShowConversionConfirm(false);
  };

  const isFormValid = () => {
    const requiredFields = ['nombre', 'dni', 'fechaNacimiento', 'email', 'telefono', 'direccion', 'contraseña'];
    const hasErrors = requiredFields.some(field => errors[field]);
    const hasEmptyFields = requiredFields.some(field => !formData[field as keyof SocioFormData]);
    
    if (formData.tipoSocio === 'FAMILIAR') {
      // Requerir al menos 3 familiares adicionales (4 en total con cabeza de familia)
      return !hasErrors && !hasEmptyFields && familiares.length >= 3;
    }
    
    return !hasErrors && !hasEmptyFields;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/socios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          socio: formData,
          familiares: formData.tipoSocio === 'FAMILIAR' ? familiares : []
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Mostrar mensaje de éxito
        setMensaje(`¡Registro exitoso! ${result.socio.tipoSocio === 'FAMILIAR' ? `Se registraron ${result.socio.familiares + 1} socios` : 'Socio registrado correctamente'}`);
        setMensajeTipo('success');
        
        // Limpiar formulario
        setFormData({
          nombre: '',
          dni: '',
          fechaNacimiento: '',
          email: '',
          telefono: '',
          direccion: '',
          contraseña: '',
          tipoSocio: 'INDIVIDUAL'
        });
        setFamiliares([]);
        setErrors({});
      } else {
        const error = await response.json();
        setMensaje(`Error: ${error.message}`);
        setMensajeTipo('error');
      }
    } catch (error) {
      setMensaje('Error al registrar el socio. Intente nuevamente.');
      setMensajeTipo('error');
    } finally {
      setIsLoading(false);
    }
  };

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
            Panel Principal &gt; Socios &gt; Registrar Socio
          </div>

          <h2 className="text-2xl font-semibold text-gray-800">Registrar Nuevo Socio</h2>
        </div>

        <div className="max-w-4xl">
          <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-300 ${showModalFamiliar ? 'opacity-50 blur-sm' : 'opacity-100'}`}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campos del formulario principal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.nombre ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ingrese nombre completo"
                  />
                  {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DNI *
                  </label>
                  <input
                    type="text"
                    name="dni"
                    value={formData.dni}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.dni ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="12345678"
                  />
                  {errors.dni && <p className="text-red-500 text-sm mt-1">{errors.dni}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Nacimiento *
                  </label>
                  <input
                    type="date"
                    name="fechaNacimiento"
                    value={formData.fechaNacimiento}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-2 border rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.fechaNacimiento ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.fechaNacimiento && <p className="text-red-500 text-sm mt-1">{errors.fechaNacimiento}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="usuario@ejemplo.com"
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.direccion ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ingrese dirección"
                  />
                  {errors.direccion && <p className="text-red-500 text-sm mt-1">{errors.direccion}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono de Contacto *
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.telefono ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="1234567890"
                  />
                  {errors.telefono && <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha de Registro
                  </label>
                  <input
                    type="text"
                    value={new Date().toLocaleDateString('es-ES')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña *
                  </label>
                  <input
                    type="password"
                    name="contraseña"
                    value={formData.contraseña}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.contraseña ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Mínimo 8 caracteres con mayúscula, minúscula, número y carácter especial"
                  />
                  {errors.contraseña && <p className="text-red-500 text-sm mt-1">{errors.contraseña}</p>}
                </div>
              </div>

              {/* Tipo de Socio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de Socio *
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tipoSocio"
                      value="INDIVIDUAL"
                      checked={formData.tipoSocio === 'INDIVIDUAL'}
                      onChange={() => handleTipoSocioChange('INDIVIDUAL')}
                      className="mr-2"
                    />
                    Individual
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="tipoSocio"
                      value="FAMILIAR"
                      checked={formData.tipoSocio === 'FAMILIAR'}
                      onChange={() => handleTipoSocioChange('FAMILIAR')}
                      className="mr-2"
                    />
                    Familiar
                  </label>
                </div>
              </div>

              {/* Agregar Familiar */}
              {formData.tipoSocio === 'FAMILIAR' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nuevo integrante
                  </label>
                  <div className="flex space-x-2">
                    <div className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 flex items-center">
                      Agregar nuevo integrante
                    </div>
                    <button
                      type="button"
                      onClick={handleAddFamiliar}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-1"
                    >
                      <span>+</span>
                      <span>Agregar nuevo integrante</span>
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Se requieren al menos 3 integrantes adicionales para el plan familiar (4 en total)
                  </p>
                  
                  {/* Lista de familiares agregados */}
                  {familiares.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm font-medium text-gray-700">
                        Integrantes agregados: {familiares.length}
                      </p>
                      {familiares.map((familiar, index) => (
                        <div 
                          key={index}
                          className="bg-gray-50 border border-gray-200 rounded-md p-4 flex justify-between items-start"
                        >
                          <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Nombre:</span>
                              <span className="ml-2 text-gray-600">{familiar.nombre}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">DNI:</span>
                              <span className="ml-2 text-gray-600">{familiar.dni}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Email:</span>
                              <span className="ml-2 text-gray-600">{familiar.email}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Teléfono:</span>
                              <span className="ml-2 text-gray-600">{familiar.telefono}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="font-medium text-gray-700">Fecha de Nacimiento:</span>
                              <span className="ml-2 text-gray-600">
                                {new Date(familiar.fechaNacimiento).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFamiliar(index)}
                            className="ml-4 px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            Eliminar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Botones */}
              <div className="flex space-x-4 pt-6">
                <button
                  type="button"
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid() || isLoading}
                  className={`px-6 py-2 rounded-md focus:outline-none focus:ring-2 ${
                    isFormValid() && !isLoading
                      ? 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isLoading ? 'Registrando...' : '✓ Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Modal para agregar familiar */}
        {showModalFamiliar && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-20 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Agregar miembro al grupo familiar</h2>

              {/* Paso 1: Buscar por DNI */}
              <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
                  <input
                    type="text"
                    name="dni"
                    value={buscarDni || familiarForm.dni}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0,8)
                      setBuscarDni(digits)
                      setFamiliarForm(prev => ({ ...prev, dni: digits }))
                      setResultadoBusqueda(null)
                      setBusquedaRealizada(false)
                    }}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Ingrese DNI y presione Buscar"
                  />
                  {familiarErrors.dni && <p className="text-sm text-red-500 mt-1">{familiarErrors.dni}</p>}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={buscarSocioPorDni}
                    disabled={buscandoDni}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {buscandoDni ? 'Buscando...' : 'Buscar DNI'}
                  </button>
                </div>
              </div>

              {/* Resultado de búsqueda */}
              {busquedaRealizada && (
                <div className="mb-4">
                  {resultadoBusqueda ? (
                    <div className="p-4 bg-gray-50 rounded border">
                      <p className="font-medium text-gray-900">Socio encontrado:</p>
                      <p className="text-sm text-gray-700">Nombre: {resultadoBusqueda.nombre}</p>
                      <p className="text-sm text-gray-700">DNI: {resultadoBusqueda.dni}</p>
                      <p className="text-sm text-gray-700">Tipo actual: {resultadoBusqueda.tipoSocio}</p>
                      {resultadoBusqueda.tipoSocio === 'FAMILIAR' ? (
                        <p className="mt-2 text-sm text-red-600">Este socio ya pertenece a un plan familiar y no puede agregarse.</p>
                      ) : (
                        <p className="mt-2 text-sm text-green-700">Puede convertir y agregar este socio al plan familiar.</p>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 bg-yellow-50 rounded border">
                      <p className="text-sm text-gray-700">No existe un socio con ese DNI. Complete los datos para crearlo y asignarlo al plan familiar.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Si no existe: mostrar inputs para crear nuevo familiar. 
                  Si existe e INDIVIDUAL: mostrar botón para convertir (handled in handleSaveFamiliar) */}
              {(!busquedaRealizada || !resultadoBusqueda) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                    <input type="text" name="nombre" value={familiarForm.nombre} onChange={handleFamiliarInputChange} className="w-full px-3 py-2 border rounded-md" />
                    {familiarErrors.nombre && <p className="text-sm text-red-500 mt-1">{familiarErrors.nombre}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
                    <input type="date" name="fechaNacimiento" value={familiarForm.fechaNacimiento} onChange={handleFamiliarInputChange} className="w-full px-3 py-2 border rounded-md" />
                    {familiarErrors.fechaNacimiento && <p className="text-sm text-red-500 mt-1">{familiarErrors.fechaNacimiento}</p>}
                    {familiarForm.fechaNacimiento && familiarForm.esMenorDe12 && <p className="text-xs text-blue-600 mt-1">Menor de 12 años: no se creará cuenta de acceso.</p>}
                  </div>

                  {!familiarForm.esMenorDe12 && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" name="email" value={familiarForm.email} onChange={handleFamiliarInputChange} className="w-full px-3 py-2 border rounded-md" />
                        {familiarErrors.email && <p className="text-sm text-red-500 mt-1">{familiarErrors.email}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input type="text" name="telefono" value={familiarForm.telefono} onChange={handleFamiliarInputChange} className="w-full px-3 py-2 border rounded-md" />
                        {familiarErrors.telefono && <p className="text-sm text-red-500 mt-1">{familiarErrors.telefono}</p>}
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                        <input type="password" name="contraseña" value={familiarForm.contraseña} onChange={handleFamiliarInputChange} className="w-full px-3 py-2 border rounded-md" />
                        {familiarErrors.contraseña && <p className="text-sm text-red-500 mt-1">{familiarErrors.contraseña}</p>}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Mensaje de error general */}
              {familiarErrors.general && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{familiarErrors.general}</div>}

              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => { setShowModalFamiliar(false); setResultadoBusqueda(null); setBusquedaRealizada(false); setBuscarDni(''); }} className="px-4 py-2 border rounded-md">Cancelar</button>

                {/* Si hubo búsqueda y el socio existe y es INDIVIDUAL -> permitir convertir y agregar */}
                {busquedaRealizada && resultadoBusqueda && resultadoBusqueda.tipoSocio === 'INDIVIDUAL' ? (
                  <button type="button" onClick={handleSaveFamiliar} className="px-4 py-2 bg-green-600 text-white rounded-md">Convertir y agregar</button>
                ) : (
                  // En los demás casos (no existe o búsqueda no realizada) permitir guardar nuevo familiar
                  <button type="button" onClick={handleSaveFamiliar} className="px-4 py-2 bg-blue-600 text-white rounded-md">Agregar Familiar</button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {/* Mensaje inline de éxito/error */}
        {mensaje && (
          <div className="mt-8 flex justify-center">
            <div className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${mensajeTipo === 'error' ? 'bg-red-100 text-red-800' : mensajeTipo === 'success' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
              {mensaje}
            </div>
          </div>
        )}

        {/* Inline confirmation modal to replace native confirm() */}
        {showConversionConfirm && pendingConversionEntry && (
          <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full p-6">
              <h3 className="text-lg font-semibold mb-2">Confirmar conversión de socio</h3>
              <p className="text-sm text-gray-700 mb-4">El socio con DNI <strong>{pendingConversionEntry.dni}</strong> está registrado como <strong>INDIVIDUAL</strong>. ¿Desea convertir su plan a <strong>FAMILIAR</strong> y agregarlo al grupo?</p>
              <div className="flex justify-end gap-2">
                <button onClick={cancelConversion} className="px-4 py-2 rounded border border-gray-300 text-gray-700">Cancelar</button>
                <button onClick={confirmConversion} className="px-4 py-2 rounded bg-green-600 text-white">Convertir y agregar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
