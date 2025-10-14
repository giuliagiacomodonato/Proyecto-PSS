'use client';

import { useState } from 'react';
import Toast from '../../components/Toast';
import AdminLayout from '../../components/AdminLayout';

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
}

export default function AltaSocioPage() {
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
    contraseña: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{
      message: string;
      type: 'success' | 'error' | 'info';
      isOpen: boolean;
    }>({
      message: '',
      type: 'info',
      isOpen: false
    });

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
    setFormData(prev => ({ ...prev, [name]: value }));
    
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
    setShowModalFamiliar(true);
    setFamiliarForm({
      nombre: '',
      dni: '',
      fechaNacimiento: '',
      email: '',
      telefono: '',
      contraseña: ''
    });
  };

  const handleFamiliarInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFamiliarForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveFamiliar = () => {
    // Validar familiar
    const familiarErrors: Record<string, string> = {};
    Object.keys(familiarForm).forEach(key => {
      const error = validateField(key, familiarForm[key as keyof FamiliarData]);
      if (error) familiarErrors[key] = error;
    });

    if (Object.keys(familiarErrors).length > 0) {
      setToast({
        message: 'Por favor, complete todos los campos correctamente',
        type: 'error',
        isOpen: true
      });
      return; // No guardar si hay errores
    }

    // Verificar que no se duplique DNI o email
    const dniDuplicado = familiares.some(f => f.dni === familiarForm.dni);
    const emailDuplicado = familiares.some(f => f.email === familiarForm.email);
    
    if (dniDuplicado) {
      setToast({
        message: 'El DNI ya fue agregado a otro familiar',
        type: 'error',
        isOpen: true
      });
      return;
    }
    
    if (emailDuplicado) {
      setToast({
        message: 'El email ya fue agregado a otro familiar',
        type: 'error',
        isOpen: true
      });
      return;
    }

    setFamiliares(prev => [...prev, familiarForm]);
    setShowModalFamiliar(false);
    setToast({
      message: 'Familiar agregado exitosamente',
      type: 'success',
      isOpen: true
    });
  };

  const isFormValid = () => {
    const requiredFields = ['nombre', 'dni', 'fechaNacimiento', 'email', 'telefono', 'direccion', 'contraseña'];
    const hasErrors = requiredFields.some(field => errors[field]);
    const hasEmptyFields = requiredFields.some(field => !formData[field as keyof SocioFormData]);
    
    if (formData.tipoSocio === 'FAMILIAR') {
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
        setToast({
          message: `¡Registro exitoso! ${result.socio.tipoSocio === 'FAMILIAR' ? `Se registraron ${result.socio.familiares + 1} socios` : 'Socio registrado correctamente'}`,
          type: 'success',
          isOpen: true
        });
        
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
        setToast({
          message: `Error: ${error.message}`,
          type: 'error',
          isOpen: true
        });
      }
    } catch (error) {
      setToast({
        message: 'Error al registrar el socio. Intente nuevamente.',
        type: 'error',
        isOpen: true
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className={`bg-white rounded-lg shadow-md p-6 transition-all duration-300 ${showModalFamiliar ? 'opacity-50 blur-sm' : 'opacity-100'}`}>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">
            Registrar Nuevo Socio
          </h1>

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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
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
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                  Se requieren al menos 3 integrantes adicionales para el plan familiar
                </p>
                {familiares.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">
                      Integrantes agregados: {familiares.length}
                    </p>
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
        <div className="fixed inset-0 bg-gray-500 bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Registrar Familiar</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={familiarForm.nombre}
                  onChange={handleFamiliarInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DNI *
                </label>
                <input
                  type="text"
                  name="dni"
                  value={familiarForm.dni}
                  onChange={handleFamiliarInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Nacimiento *
                </label>
                <input
                  type="date"
                  name="fechaNacimiento"
                  value={familiarForm.fechaNacimiento}
                  onChange={handleFamiliarInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  name="email"
                  value={familiarForm.email}
                  onChange={handleFamiliarInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono de Contacto *
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={familiarForm.telefono}
                  onChange={handleFamiliarInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Registro
                </label>
                <input
                  type="text"
                  value={new Date().toLocaleDateString('es-ES')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                  readOnly
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña *
                </label>
                <input
                  type="password"
                  name="contraseña"
                  value={familiarForm.contraseña}
                  onChange={handleFamiliarInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mínimo 8 caracteres con mayúscula, minúscula, número y carácter especial"
                />
              </div>
            </div>

            <div className="flex space-x-4 mt-6">
              <button
                type="button"
                onClick={() => setShowModalFamiliar(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveFamiliar}
                className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                ✓ Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast para mensajes */}
      <Toast
        message={toast.message}
        type={toast.type}
        isOpen={toast.isOpen}
        onClose={() => setToast(prev => ({ ...prev, isOpen: false }))}
        />
    </AdminLayout>
  );
}
