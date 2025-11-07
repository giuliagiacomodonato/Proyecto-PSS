'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAdminProtection } from '@/app/hooks/useAdminProtection';
import Sidebar from '@/app/components/Sidebar';
import { User } from 'lucide-react';

type Socio = {
  id: number;
  nombre: string;
  dni: string;
  fechaNacimiento: string;
  email: string;
  telefono: string;
  direccion: string;
  tipoSocio: 'INDIVIDUAL' | 'FAMILIAR';
  esMenorDe12: boolean;
};

function ModificarSocioContent() {
  const { isAuthorized, isChecking } = useAdminProtection();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dniBusqueda, setDniBusqueda] = useState('');
  const [socio, setSocio] = useState<Socio | null>(null);
  const [editSocio, setEditSocio] = useState<Socio | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [errores, setErrores] = useState<{ [key: string]: string }>({});
  // Estado para la adición de familiares cuando se convierte INDIVIDUAL -> FAMILIAR
  const [familiaresInput, setFamiliaresInput] = useState<Array<any>>([]);
  // Estado para miembros guardados
  const [miembrosGuardados, setMiembrosGuardados] = useState<Array<any>>([]);
  // Guardar miembros familiares en estado aparte
  const handleGuardarMiembros = () => {
    // Solo guardar los miembros válidos
    const miembrosValidos = familiaresInput.filter((f) => f && !f.error && (f.existing || (f.dni && f.nombre && f.fechaNacimiento)));
    setMiembrosGuardados(miembrosValidos);
  };

  const buscarSocio = async (dniArg?: string) => {
    try {
      setMensaje('');
      setErrores({});
      const dniToSearch = ((dniArg ?? dniBusqueda) || '').trim();
      if (!dniToSearch) {
        setMensaje('Ingrese el DNI del socio a buscar.');
        setSocio(null);
        setEditSocio(null);
        return;
      }

      const res = await fetch(`/api/socios?dni=${encodeURIComponent(dniToSearch)}`, {
        cache: 'no-store',
      });

      if (!res.ok) {
        setSocio(null);
        setEditSocio(null);
        setMensaje('Socio no encontrado.');
        return;
      }

      const data = await res.json();
      const socioEncontrado = data.socio;

      if (!socioEncontrado) {
        setSocio(null);
        setEditSocio(null);
        setMensaje('Socio no encontrado.');
        return;
      }

      const normalizado: Socio = {
        ...socioEncontrado,
        fechaNacimiento: socioEncontrado.fechaNacimiento?.slice(0, 10) ?? '',
        telefono: socioEncontrado.telefono ?? '',
        direccion: socioEncontrado.direccion ?? '',
        esMenorDe12: socioEncontrado.esMenorDe12 ?? false,
      };

      setSocio(normalizado);
      setEditSocio(normalizado);
    } catch (error) {
      console.error('Error al buscar socio:', error);
      setMensaje('Error al buscar el socio.');
    }
  };

  // Auto-buscar si la URL tiene ?dni=...
  useEffect(() => {
    if (isChecking) return;
    if (!isAuthorized) return;
    const dniParam = searchParams.get('dni');
    if (dniParam && dniParam.trim()) {
      setDniBusqueda(dniParam);
      buscarSocio(dniParam);
    }
  }, [isChecking, isAuthorized, searchParams]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editSocio) return;
    setEditSocio({ ...editSocio, [e.target.name]: e.target.value });
  };

  const handleTipoChange = (tipo: 'Individual' | 'Familiar') => {
    if (!editSocio) return;
    const nuevoTipo = tipo === 'Individual' ? 'INDIVIDUAL' : 'FAMILIAR';
    setEditSocio({
      ...editSocio,
      tipoSocio: nuevoTipo,
    });

    // Si se selecciona FAMILIAR y el socio original era INDIVIDUAL, inicializar inputs de familiares
    if (nuevoTipo === 'FAMILIAR' && socio && socio.tipoSocio === 'INDIVIDUAL') {
      // inicializamos con 3 filas vacías por defecto
      setFamiliaresInput([{ dni: '' }, { dni: '' }, { dni: '' }]);
    }
  };

  const validar = () => {
    const errs: { [key: string]: string } = {};
    if (editSocio) {
      // Email es requerido y debe ser válido
      if (!editSocio.email || !editSocio.email.includes('@')) {
        errs.email = 'Correo inválido o requerido';
      }
      // Teléfono no es requerido, pero si se proporciona debe ser válido
      if (editSocio.telefono && !/^\d*$/.test(editSocio.telefono)) {
        errs.telefono = 'Teléfono debe contener solo números';
      }
      // Dirección no es requerida
    }
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const handleGuardar = async () => {
    if (!validar() || !editSocio) return;
    // Si estamos convirtiendo INDIVIDUAL -> FAMILIAR, validar que hay al menos 3 miembros válidos
    const convertingToFamiliar = socio && socio.tipoSocio === 'INDIVIDUAL' && editSocio.tipoSocio === 'FAMILIAR';
    if (convertingToFamiliar) {
      const validCount = familiaresInput.filter((f) => f && !f.error && (f.existing || (f.dni && f.nombre && f.fechaNacimiento))).length;
      if (validCount < 3) {
        setMensaje('Para convertir a FAMILIAR se requieren 3 integrantes válidos (buscados o nuevos).');
        return;
      }
    }
    try {
      const bodyToSend: any = {
        id: editSocio.id,
        email: editSocio.email,
        telefono: editSocio.telefono,
        direccion: editSocio.direccion,
        tipoSocio: editSocio.tipoSocio,
      };

      if (convertingToFamiliar) {
        // Mapear familiaresInput a la estructura esperada por el backend
        bodyToSend.familiares = familiaresInput.map((f) => {
          if (f.existing && f.id) return { existing: true, id: f.id };
          return {
            dni: f.dni,
            nombre: f.nombre || '',
            fechaNacimiento: f.fechaNacimiento || '',
            email: f.email || '',
            contraseña: f.contraseña || ''
          };
        });
      }

      const res = await fetch('/api/socios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyToSend),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Error desconocido' }));
        console.error('Error del servidor:', errorData);
        setMensaje(errorData.message || 'No se pudo actualizar el socio.');
        return;
      }

      const result = await res.json();

      // Construir el mensaje con información de socios convertidos si aplica
      let mensajeFinal = result.message;
      if (result.sociosConvertidos && result.sociosConvertidos.length > 0) {
        mensajeFinal += `\n\nSocios convertidos a INDIVIDUAL:\n${result.sociosConvertidos.join('\n')}`;
      }

      setMensaje(mensajeFinal);
      setSocio(editSocio);
      // Si venimos desde la grilla, redirigir de vuelta
      try {
        if (typeof window !== 'undefined') {
          const returnTo = sessionStorage.getItem('returnTo');
          if (returnTo === '/admin/grillaUsuarios') {
            sessionStorage.removeItem('returnTo');
            router.push(returnTo);
          }
        }
      } catch (e) {
        // ignore
      }
    } catch (error) {
      console.error('Error al actualizar socio:', error);
      setMensaje('Error de conexión. No se pudo actualizar el socio.');
    }
  };

  const handleCancelar = () => {
    setEditSocio(socio);
    setMensaje('');
    setErrores({});
  };

  // Helpers para gestionar inputs de familiares en la conversión a FAMILIAR
  const addFamiliar = () => setFamiliaresInput((prev) => [...prev, { dni: '' }]);
  const removeFamiliar = (index: number) => setFamiliaresInput((prev) => prev.filter((_, i) => i !== index));
  const updateFamiliarField = (index: number, field: string, value: any) => {
    setFamiliaresInput((prev) => {
      const copy = [...prev];
      copy[index] = { ...(copy[index] || {}), [field]: value };
      return copy;
    });
  };

  const buscarFamiliar = async (index: number) => {
    const dni = (familiaresInput[index]?.dni || '').trim();
    if (!dni) {
      updateFamiliarField(index, 'error', 'Ingrese DNI antes de buscar');
      return;
    }
    try {
      updateFamiliarField(index, 'error', undefined);
      const res = await fetch(`/api/socios?dni=${encodeURIComponent(dni)}`);
      const data = await res.json();
      if (!res.ok || !data) {
        // no existe -> permitir completar datos manualmente
        updateFamiliarField(index, 'existing', false);
        updateFamiliarField(index, 'nombre', '');
        updateFamiliarField(index, 'fechaNacimiento', '');
        updateFamiliarField(index, 'email', '');
        updateFamiliarField(index, 'error', undefined);
        return;
      }

      if (data.existe && data.socio) {
        const socioEncontrado = data.socio as any;
        if (socioEncontrado.tipoSocio === 'FAMILIAR') {
          updateFamiliarField(index, 'error', 'El DNI ingresado ya pertenece a un plan familiar');
          return;
        }
        // existente pero INDIVIDUAL -> marcar para conversión
        updateFamiliarField(index, 'existing', true);
        updateFamiliarField(index, 'id', socioEncontrado.id);
        updateFamiliarField(index, 'nombre', socioEncontrado.nombre || '');
        updateFamiliarField(index, 'fechaNacimiento', socioEncontrado.fechaNacimiento?.slice(0, 10) || '');
        updateFamiliarField(index, 'email', socioEncontrado.email || '');
        updateFamiliarField(index, 'error', undefined);
      } else {
        // no existe
        updateFamiliarField(index, 'existing', false);
        updateFamiliarField(index, 'nombre', '');
        updateFamiliarField(index, 'fechaNacimiento', '');
        updateFamiliarField(index, 'email', '');
        updateFamiliarField(index, 'error', undefined);
      }
    } catch (err) {
      console.error('Error buscando socio por DNI:', err);
      updateFamiliarField(index, 'error', 'Error al buscar DNI');
    }
  };

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

              {/* Si estamos convirtiendo de INDIVIDUAL a FAMILIAR, pedir los 3 DNIs (o más) */}
              {editSocio && socio && socio.tipoSocio === 'INDIVIDUAL' && editSocio.tipoSocio === 'FAMILIAR' && (
                <div className="mt-6 p-4 border rounded bg-gray-50">
                  <h3 className="text-sm font-medium mb-2">Miembros del grupo familiar (mínimo 3)</h3>
                  <p className="text-sm text-gray-600 mb-3">Para convertir este socio a plan familiar, ingrese al menos 3 miembros (DNI). Use Buscar para detectar si el socio ya existe.</p>

                  {familiaresInput.map((f, idx) => (
                    <div key={idx} className="mb-3 p-2 bg-white rounded border flex flex-col md:flex-row md:items-center gap-2">
                      <div className="flex items-center gap-2 w-full md:w-1/3">
                        <input
                          type="text"
                          placeholder="DNI"
                          value={f.dni || ''}
                          onChange={(e) => updateFamiliarField(idx, 'dni', e.target.value)}
                          className="w-full px-3 py-2 border rounded"
                        />
                        <button type="button" onClick={() => buscarFamiliar(idx)} className="px-3 py-2 bg-blue-500 text-white rounded">Buscar</button>
                        <button type="button" onClick={() => removeFamiliar(idx)} className="px-3 py-2 bg-red-100 text-red-700 rounded">Eliminar</button>
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 w-full">
                        {f.existing ? (
                          <div className="col-span-3 text-sm text-green-700">Existente: {f.nombre || 'Sin nombre'}</div>
                        ) : (
                          <>
                            <input
                              type="text"
                              placeholder="Nombre (si no existe)"
                              value={f.nombre || ''}
                              onChange={(e) => updateFamiliarField(idx, 'nombre', e.target.value)}
                              className="px-3 py-2 border rounded"
                            />
                            <input
                              type="date"
                              placeholder="Fecha de nacimiento"
                              value={f.fechaNacimiento || ''}
                              onChange={(e) => updateFamiliarField(idx, 'fechaNacimiento', e.target.value)}
                              className="px-3 py-2 border rounded"
                            />
                            <input
                              type="email"
                              placeholder="Email (si no es menor)"
                              value={f.email || ''}
                              onChange={(e) => updateFamiliarField(idx, 'email', e.target.value)}
                              className="px-3 py-2 border rounded"
                            />
                          </>
                        )}
                        {f.error && <div className="col-span-3 text-sm text-red-600">{f.error}</div>}
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center gap-2">
                    <button type="button" onClick={addFamiliar} className="px-3 py-2 bg-green-500 text-white rounded">Agregar miembro</button>
                    <button type="button" onClick={handleGuardarMiembros} className="px-3 py-2 bg-blue-600 text-white rounded">Guardar miembros</button>
                    <div className="text-sm text-gray-600">Miembros válidos: {familiaresInput.filter((f) => f && !f.error && (f.existing || (f.dni && f.nombre && f.fechaNacimiento))).length}</div>
                  </div>

                  {/* Mostrar miembros guardados debajo */}
                  {miembrosGuardados && miembrosGuardados.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold mb-2">Miembros guardados:</h4>
                      <ul className="list-disc pl-5">
                        {miembrosGuardados.map((m, i) => (
                          <li key={i} className="mb-1">
                            {m.dni} - {m.nombre} {m.existing ? '(existente)' : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
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
                {/* ...campos del formulario... */}
                {/* Los campos del formulario se mantienen, solo se asegura el cierre correcto del JSX. */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="telefono"
                    value={editSocio.telefono}
                    onChange={handleChange}
                    disabled={editSocio.esMenorDe12}
                    className="w-full px-3 py-2 border rounded-md text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
                        checked={editSocio.tipoSocio === 'INDIVIDUAL'}
                        onChange={() => handleTipoChange('Individual')}
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
                        checked={editSocio.tipoSocio === 'FAMILIAR'}
                        onChange={() => handleTipoChange('Familiar')}
                        disabled={editSocio.esMenorDe12}
                        className="mr-2 text-blue-600 focus:ring-2 focus:ring-blue-200"
                      />
                      <span className="text-sm">Familiar</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-4 mt-8 items-center">
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
                    disabled={Boolean(
                      Object.keys(errores).length > 0 ||
                      (editSocio && editSocio.esMenorDe12) ||
                      (socio && editSocio && socio.tipoSocio === 'INDIVIDUAL' && editSocio.tipoSocio === 'FAMILIAR' && miembrosGuardados.length < 3)
                    )}
                  >
                    Guardar
                  </button>
                  {mensaje && (
                    <div className={`px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap ${mensaje.toLowerCase().includes('error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                      {mensaje}
                    </div>
                  )}
                </div>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ModificarSocioPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div></div>}>
      <ModificarSocioContent />
    </Suspense>
  );
}
