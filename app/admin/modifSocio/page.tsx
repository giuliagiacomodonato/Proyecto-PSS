"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from 'next/navigation'
import { useAdminProtection } from "@/app/hooks/useAdminProtection";
import Sidebar from "@/app/components/Sidebar";
import { User } from "lucide-react";

import AdminLayout from "../../components/AdminLayout";

type Socio = {
  id: number
  nombre: string
  dni: string
  fechaNacimiento: string
  email: string
  telefono: string
  direccion: string
  tipoSocio: 'INDIVIDUAL' | 'FAMILIAR'
  esMenorDe12: boolean
}

export default function ModificarSocio() {
  // ✅ Verificar que sea admin ANTES de renderizar
  const { isAuthorized, isChecking } = useAdminProtection();
  const router = useRouter()

  const [dniBusqueda, setDniBusqueda] = useState("");
  const [socio, setSocio] = useState<Socio | null>(null);
  const [editSocio, setEditSocio] = useState<Socio | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [errores, setErrores] = useState<{ [key: string]: string }>({});

 const buscarSocio = async (dniArg?: string) => {
  try {
    setMensaje('')
    setErrores({})
    const dniToSearch = ((dniArg ?? dniBusqueda) || '').trim()
    if (!dniToSearch) {
      setMensaje('Ingrese el DNI del socio a buscar.')
      setSocio(null)
      setEditSocio(null)
      return
    }

    const res = await fetch(`/api/socios?dni=${encodeURIComponent(dniToSearch)}`, { cache: 'no-store' })

    if (!res.ok) {
      setSocio(null)
      setEditSocio(null)
      setMensaje('Socio no encontrado.')
      return
    }

    const data = await res.json()
    const socioEncontrado = data.socio

    if (!socioEncontrado) {
      setSocio(null)
      setEditSocio(null)
      setMensaje('Socio no encontrado.')
      return
    }

    const normalizado: Socio = {
      ...socioEncontrado,
      fechaNacimiento: socioEncontrado.fechaNacimiento?.slice(0, 10) ?? '',
      telefono: socioEncontrado.telefono ?? '',
      direccion: socioEncontrado.direccion ?? '',
      esMenorDe12: socioEncontrado.esMenorDe12 ?? false,
    }

    setSocio(normalizado)
    setEditSocio(normalizado)
  
  } catch (error) {
    console.error('Error al buscar socio:', error)
    setMensaje('Error al buscar el socio.')
  }
}
// Auto-buscar si la URL tiene ?dni=...
const searchParams = useSearchParams()
useEffect(() => {
  if (isChecking) return
  if (!isAuthorized) return
  const dniParam = searchParams.get('dni')
  if (dniParam && dniParam.trim()) {
    setDniBusqueda(dniParam)
    buscarSocio(dniParam)
  }
}, [isChecking, isAuthorized, searchParams])
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editSocio) return;
    setEditSocio({ ...editSocio, [e.target.name]: e.target.value });
  };

  const handleTipoChange = (tipo: "Individual" | "Familiar") => {
    if (!editSocio) return;
    setEditSocio({ ...editSocio, tipoSocio: tipo === "Individual" ? "INDIVIDUAL" : "FAMILIAR" });
  };

  const validar = () => {
  const errs: { [key: string]: string } = {}
  if (editSocio) {
    // Email es requerido y debe ser válido
    if (!editSocio.email || !editSocio.email.includes('@')) {
      errs.email = 'Correo inválido o requerido'
    }
    // Teléfono no es requerido, pero si se proporciona debe ser válido
    if (editSocio.telefono && !/^\d*$/.test(editSocio.telefono)) {
      errs.telefono = 'Teléfono debe contener solo números'
    }
    // Dirección no es requerida
  }
  setErrores(errs)
  return Object.keys(errs).length === 0
}

 const handleGuardar = async () => {
  if (!validar() || !editSocio) return
  try {
    const res = await fetch('/api/socios', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editSocio.id,
        email: editSocio.email,
        telefono: editSocio.telefono,
        direccion: editSocio.direccion,
        tipoSocio: editSocio.tipoSocio,
      }),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'Error desconocido' }))
      console.error('Error del servidor:', errorData)
      setMensaje(errorData.message || 'No se pudo actualizar el socio.')
      return
    }
    
    const result = await res.json()
    
    // Construir el mensaje con información de socios convertidos si aplica
    let mensajeFinal = result.message
    if (result.sociosConvertidos && result.sociosConvertidos.length > 0) {
      mensajeFinal += `\n\nSocios convertidos a INDIVIDUAL:\n${result.sociosConvertidos.join('\n')}`
    }
    
    setMensaje(mensajeFinal)
    setSocio(editSocio)
    // Si venimos desde la grilla, redirigir de vuelta
    try {
      if (typeof window !== 'undefined') {
        const returnTo = sessionStorage.getItem('returnTo')
        if (returnTo === '/admin/grillaUsuarios') {
          sessionStorage.removeItem('returnTo')
          router.push(returnTo)
        }
      }
    } catch (e) {
      // ignore
    }
  } catch (error) {
    console.error('Error al actualizar socio:', error)
    setMensaje('Error de conexión. No se pudo actualizar el socio.')
  }
}
  const handleCancelar = () => {
    setEditSocio(socio);
    setMensaje("");
    setErrores({});
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
            Panel Principal &gt; Socios &gt; Modificar Socio
          </div>

          <h2 className="text-2xl font-semibold text-gray-800">Modificar Socio</h2>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex gap-2">
            <input
              type="text"
              placeholder="Buscar Socio por DNI"
              value={dniBusqueda}
              onChange={(e) => setDniBusqueda(e.target.value)}
              className="border px-3 py-2 rounded w-64 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <button
              onClick={() => buscarSocio()}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Buscar
            </button>
          </div>
          {mensaje && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800 whitespace-pre-line">{mensaje}</p>
            </div>
          )}
          {editSocio && (
            <>
              {editSocio.esMenorDe12 && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-800">
                    <strong>⚠️ Menor de 12 años:</strong> Este socio no puede ser modificado. Los menores de 12 años no tienen cuenta en el sistema y sus datos solo pueden ser gestionados por el cabeza de familia.
                  </p>
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!editSocio.esMenorDe12) {
                    handleGuardar();
                  }
                }}
                className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={editSocio.nombre}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      DNI
                    </label>
                    <input
                      type="text"
                      name="dni"
                      value={editSocio.dni}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="text"
                      name="fechaNacimiento"
                      value={editSocio.fechaNacimiento}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={editSocio.email}
                      onChange={handleChange}
                      disabled={editSocio.esMenorDe12}
                      className={`w-full px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                        editSocio.esMenorDe12 ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                    />
                    {editSocio.esMenorDe12 && (
                      <span className="text-xs text-gray-500">Email del cabeza de familia</span>
                    )}
                    {errores.email && !editSocio.esMenorDe12 && (
                      <span className="text-red-500 text-sm">{errores.email}</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Teléfono de Contacto <span className="text-gray-400 text-xs">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      name="telefono"
                      value={editSocio.telefono}
                      onChange={handleChange}
                      disabled={editSocio.esMenorDe12}
                      className={`w-full px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                        editSocio.esMenorDe12 ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                    />
                    {editSocio.esMenorDe12 && (
                      <span className="text-xs text-gray-500">Teléfono del cabeza de familia</span>
                    )}
                    {errores.telefono && !editSocio.esMenorDe12 && (
                      <span className="text-red-500 text-sm">{errores.telefono}</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dirección <span className="text-gray-400 text-xs">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      name="direccion"
                      value={editSocio.direccion}
                      onChange={handleChange}
                      disabled={editSocio.esMenorDe12}
                      className={`w-full px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                        editSocio.esMenorDe12 ? 'bg-gray-100 cursor-not-allowed' : ''
                      }`}
                    />
                    {errores.direccion && !editSocio.esMenorDe12 && (
                      <span className="text-red-500 text-sm">{errores.direccion}</span>
                    )}
                  </div>
                </div>
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Socio
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center text-gray-900">
                      <input
                        type="radio"
                        name="tipo"
                        value="Individual"
                        checked={editSocio.tipoSocio === "INDIVIDUAL"}
                        onChange={() => handleTipoChange("Individual")}
                        disabled={editSocio.esMenorDe12}
                        className="mr-2 text-blue-600 focus:ring-2 focus:ring-blue-200"
                      />
                      <span className="text-sm">Individual</span>
                    </label>
                    <label className="flex items-center text-gray-900">
                      <input
                        type="radio"
                        name="tipo"
                        value="Familiar"
                        checked={editSocio.tipoSocio === "FAMILIAR"}
                        onChange={() => handleTipoChange("Familiar")}
                        disabled={editSocio.esMenorDe12}
                        className="mr-2 text-blue-600 focus:ring-2 focus:ring-blue-200"
                      />
                      <span className="text-sm">Familiar</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-4 mt-8">
                  <button
                    type="button"
                    onClick={handleCancelar}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`px-6 py-2 rounded-md ${
                      editSocio.esMenorDe12
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                    disabled={Object.keys(errores).length > 0 || editSocio.esMenorDe12}
                  >
                    Guardar
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}