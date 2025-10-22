// Contiene el formulario de Login (F2-1) y la lógica de redirección por rol.

"use client"; 

import React, { useState } from 'react';
// Simulación del router para evitar el error de compilación de next/navigation en Canvas.
const useRouter = () => {
    // Si estamos en un entorno Next.js real, usará el router normal.
    // Si estamos en Canvas, usará la función replace de window.location.
  if (typeof window !== 'undefined' && typeof window.location.replace === 'function') {
    return {
      replace: (path: string) => window.location.replace(path),
      push: (path: string) => window.location.assign(path),
    };
  }
  return {
    replace: (path: string) => console.log(`[Router Mock] Redirigiendo a: ${path}`),
    push: (path: string) => console.log(`[Router Mock] Redirigiendo a: ${path}`),
  };
}


// --- Componentes Mock (Para que el archivo sea autónomo) ---
type ButtonProps = {
  children: React.ReactNode
  onClick?: (e?: any) => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
}
const Button: React.FC<ButtonProps> = ({ children, onClick, type = 'button', disabled = false, className = '' }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-md font-medium transition-colors ${className} ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
)

type InputProps = {
  id?: string
  type?: string
  placeholder?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  className?: string
  required?: boolean
}
const Input: React.FC<InputProps> = ({ id, type = 'text', placeholder, value, onChange, onBlur, className = '', required = false }) => (
  <input
    id={id}
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    onBlur={onBlur}
    className={`w-full p-3 border rounded-md focus:ring-blue-600 focus:border-blue-600 transition duration-150 ease-in-out ${className}`}
    required={required}
  />
)

type LabelProps = { htmlFor?: string; children: React.ReactNode; className?: string }
const Label: React.FC<LabelProps> = ({ htmlFor, children, className = '' }) => (
  <label htmlFor={htmlFor} className={`block text-sm font-medium text-gray-700 ${className}`}>
    {children}
  </label>
)

type ToastProps = { message: string; type?: 'error' | 'success'; isOpen: boolean; onClose: () => void }
const Toast: React.FC<ToastProps> = ({ message, type = 'success', isOpen, onClose }) => {
  if (!isOpen) return null
  const bgColor = type === 'error' ? 'bg-red-600' : 'bg-green-600'
  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 rounded-xl shadow-2xl text-white max-w-sm" style={{ backgroundColor: bgColor }}>
      <div className="flex justify-between items-center">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 font-bold">×</button>
      </div>
    </div>
  )
}
// --- FIN Componentes Mock ---


// Mapeo de Rol a Ruta de Dashboard (Criterio: redirigir a su respectivo dashboard)
const REDIRECTION_MAP = {
  ADMIN: '/admin',
  ENTRENADOR: '/entrenador',
  SOCIO: '/socio',
};

// Criterio de Aceptación: Correo electrónico: Debe contener un '@' (no al inicio ni al final).
const validateEmailFormat = (email: string): boolean => {
  if (!email) return false
  const atIndex = email.indexOf('@')
  return atIndex > 0 && atIndex < email.length - 1
}


export default function Home() {
  // Nota: Si estás ejecutando esto en Next.js localmente, este mock no se usa, usa el router real.
  const router = useRouter(); 

  type Role = 'ADMIN' | 'ENTRENADOR' | 'SOCIO'
  type FormData = { email: string; contraseña: string }
  type Errors = Partial<Record<keyof FormData, string>>

  const [formData, setFormData] = useState<FormData>({
    email: '',
    contraseña: '',
  });

  const [touched, setTouched] = useState<{ email: boolean; contraseña: boolean }>({ email: false, contraseña: false })

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'error' | 'success'>('success');
  const [submitted, setSubmitted] = useState(false);

  const closeToast = () => setToastOpen(false);
  
  // Criterio de Aceptación: El botón debe estar deshabilitado hasta que todos los campos obligatorios se encuentren rellenos.

  const emailValid = validateEmailFormat(formData.email)
  const passwordValid = formData.contraseña.trim().length >= 8
  const isFormFilled = formData.email.trim() !== '' && formData.contraseña.trim() !== '' && emailValid && passwordValid;

  // Mensajes de error dinámicos por campo (se muestran si el campo fue tocado o ya se intentó enviar)
  const emailValidationError = (touched.email || submitted) ? (
    !formData.email.trim() ? 'El correo electrónico es requerido' :
    !emailValid ? 'El correo electrónico no es válido (debe contener "@")' : undefined
  ) : undefined

  const passwordValidationError = (touched.contraseña || submitted) ? (
    !formData.contraseña.trim() ? 'La contraseña es requerida' :
    formData.contraseña.trim().length < 8 ? 'La contraseña debe tener al menos 8 caracteres' : undefined
  ) : undefined

  // Mostrar primero errores provenientes del servidor (errors state), si no existen mostrar errores de validación cliente
  const emailError = errors.email ?? emailValidationError
  const passwordError = errors.contraseña ?? passwordValidationError

  const validateAndSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true)
    const newErrors: Errors = {};

    // 1. Validar Email (Formato)
    if (!formData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!validateEmailFormat(formData.email)) {
      newErrors.email = 'El correo electrónico no es válido (debe contener "@")';
    }

    // 2. Validar Contraseña (Solo campo vacío)
    if (!formData.contraseña.trim()) {
      newErrors.contraseña = 'La contraseña es requerida';
    } else if (formData.contraseña.trim().length < 8) {
      newErrors.contraseña = 'La contraseña debe tener al menos 8 caracteres';
    }

  setErrors(newErrors);
    
    // Si hay errores de validación, detenemos el submit.
    if (Object.keys(newErrors).length > 0) {
      setToastMessage('Por favor, rellena y corrige todos los campos.');
      setToastType('error');
      setToastOpen(true);
      return;
    }

    // Solo proceder a enviar si no hay errores
    if (Object.keys(newErrors).length === 0) {
      handleLogin();
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setErrors({});
    
    // Llamada al backend /api/login para autenticar
  try {
      // El frontend llama al backend donde está la lógica de Mocks/Prisma.
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

        if (!res.ok) {
        // Loguear para debug: status y body recibido
        try {
          console.debug('[FRONTEND LOGIN] response status:', res.status, 'body:', data)
        } catch (e) {
          console.debug('[FRONTEND LOGIN] response status:', res.status, 'body: (no-json)')
        }

        if (res.status === 403) {
          // Asegurarnos de que el error del servidor llegue al field
          console.debug('[FRONTEND LOGIN] Mapeando 403 a error de email:', data.error)
        }

        // Ser rechazado por credenciales incorrectas o error.
        const errorMessage = data.error || 'Credenciales inválidas o error de red.';
        // Mapear errores específicos del servidor a errores por campo
        if (res.status === 404 && errorMessage.toLowerCase().includes('usuario')) {
          setErrors((prev) => ({ ...prev, email: errorMessage }))
        } else if (res.status === 401 && errorMessage.toLowerCase().includes('contraseña')) {
          setErrors((prev) => ({ ...prev, contraseña: errorMessage }))
        } else if (res.status === 403) {
          // Acceso denegado específico: mapear a error de email
          const msg = data.error || 'No tenés acceso con esa cuenta.'
          setErrors((prev) => ({ ...prev, email: msg }))
          // Mostrar además un toast para que sea visible aunque no veas el campo
          setToastMessage(msg)
          setToastType('error')
          setToastOpen(true)
        } else {
          setToastMessage(errorMessage);
          setToastType('error');
          setToastOpen(true);
        }
        return;
      }

      // La respuesta del backend nos da el rol, el token y el usuario.
  const { rol, token, usuario } = data as { rol: Role; token?: string; usuario?: any }
      
      // Guardar token y usuario para la sesión futura (simulación, para prod usar cookies seguras)
      if (typeof window !== 'undefined') {
        if (typeof token === 'string') {
          localStorage.setItem('token', token as string)
        }
        if (usuario) {
          localStorage.setItem('usuario', JSON.stringify(usuario))
        }
      }
      
      // Redirigir según el rol (Criterio F2-1: redirigir a su respectivo dashboard)
  const redirectionPath = REDIRECTION_MAP[rol as Role];

      if (redirectionPath) {
        setToastMessage(`Inicio de sesión exitoso. Redirigiendo a ${rol}...`);
        setToastType('success');
        setToastOpen(true);
        router.replace(redirectionPath)
      } else {
        setToastMessage('Error: Rol de usuario no reconocido.');
        setToastType('error');
        setToastOpen(true);
      }
      
    } catch (err) {
      setToastMessage('Error de conexión o servidor no disponible.');
      setToastType('error');
      setToastOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-transparent">
  <div className="w-full max-w-md bg-white/90 rounded-xl shadow-2xl p-8 m-4 backdrop-blur-sm">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">Iniciar Sesión</h1>
        <p className="text-center text-gray-500 mb-8">
          Accede a tu cuenta para la gestión del club
        </p>

        <form onSubmit={validateAndSubmit} className="space-y-6">
          
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico <span className="text-red-500">*</span></Label>
            <Input
              id="email"
              type="email"
              placeholder="Ingrese su correo"
              value={formData.email}
              onChange={(e) => { setFormData({ ...formData, email: e.target.value }); setErrors((p) => ({ ...p, email: undefined })); }}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              className={emailError ? 'border-red-500' : 'border-gray-300'}
              aria-invalid={!!emailError}
            />
            {emailError && <p className="text-sm text-red-500">{emailError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contraseña">Contraseña <span className="text-red-500">*</span></Label>
            <Input
              id="contraseña"
              type="password"
              placeholder="Ingrese su contraseña"
              value={formData.contraseña}
              onChange={(e) => { setFormData({ ...formData, contraseña: e.target.value }); setErrors((p) => ({ ...p, contraseña: undefined })); }}
              onBlur={() => setTouched((t) => ({ ...t, contraseña: true }))}
              className={passwordError ? 'border-red-500' : 'border-gray-300'}
              aria-invalid={!!passwordError}
            />
            {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
            <div className="text-right text-sm">
                <a href="#" className="text-blue-600 hover:text-blue-700">¿Olvidaste tu contraseña?</a>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <input id="recordarme" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
            <Label htmlFor="recordarme" className="font-normal">Recordarme</Label>
          </div>


          <Button
            type="submit"
            disabled={loading || !isFormFilled}
            className="w-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4h5a2 2 0 002-2v-6a2 2 0 00-2-2h-5"></path>
                </svg>
                Iniciar Sesión
              </>
            )}
          </Button>
        </form>
      </div>
      <Toast message={toastMessage} type={toastType} isOpen={toastOpen} onClose={closeToast} />
    </div>
  );
}
