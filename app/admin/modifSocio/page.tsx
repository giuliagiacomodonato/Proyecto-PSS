"use client";
import { useState } from "react";
import AdminLayout from "../../components/AdminLayout";

type Socio = {
  nombre: string;
  dni: string;
  fechaNacimiento: string;
  correo: string;
  telefono: string;
  direccion: string;
  tipo: "Individual" | "Familiar";
};

const initialSocio: Socio = {
  nombre: "",
  dni: "",
  fechaNacimiento: "",
  correo: "",
  telefono: "",
  direccion: "",
  tipo: "Individual",
};

export default function ModificarSocio() {
  const [dniBusqueda, setDniBusqueda] = useState("");
  const [socio, setSocio] = useState<Socio | null>(null);
  const [editSocio, setEditSocio] = useState<Socio | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [errores, setErrores] = useState<{ [key: string]: string }>({});

  // Simulación de búsqueda (reemplazar por fetch real)
  const buscarSocio = async () => {
    if (dniBusqueda === "12345678") {
      const socioEncontrado: Socio = {
        nombre: "Juan Pérez",
        dni: "12345678",
        fechaNacimiento: "1990-01-01",
        correo: "juan@mail.com",
        telefono: "123456789",
        direccion: "Calle 123, Ciudad",
        tipo: "Familiar",
      };
      setSocio(socioEncontrado);
      setEditSocio({ ...socioEncontrado });
      setMensaje("");
    } else {
      setSocio(null);
      setEditSocio(null);
      setMensaje("Socio no encontrado.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editSocio) return;
    setEditSocio({ ...editSocio, [e.target.name]: e.target.value });
  };

  const handleTipoChange = (tipo: "Individual" | "Familiar") => {
    if (!editSocio) return;
    setEditSocio({ ...editSocio, tipo });
  };

  const validar = () => {
    const errs: { [key: string]: string } = {};
    if (editSocio) {
      if (!editSocio.correo.includes("@")) errs.correo = "Correo inválido";
      if (!/^\d+$/.test(editSocio.telefono)) errs.telefono = "Teléfono inválido";
      if (!editSocio.direccion) errs.direccion = "Dirección requerida";
    }
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  const handleGuardar = async () => {
    if (!validar() || !editSocio) return;
    setMensaje("Datos del socio modificados exitosamente.");
    setSocio(editSocio);
  };

  const handleCancelar = () => {
    setEditSocio(socio);
    setMensaje("");
    setErrores({});
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 mt-8">Modificar Socio</h2>
        <div className="mb-6 flex gap-2">
          <input
            type="text"
            placeholder="Buscar Socio por DNI"
            value={dniBusqueda}
            onChange={(e) => setDniBusqueda(e.target.value)}
            className="border px-3 py-2 rounded w-64"
          />
          <button
            onClick={buscarSocio}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Buscar
          </button>
        </div>
        {mensaje && <div className="mb-2 text-blue-600">{mensaje}</div>}
        {editSocio && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleGuardar();
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="correo"
                  value={editSocio.correo}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
                {errores.correo && (
                  <span className="text-red-500 text-sm">{errores.correo}</span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono de Contacto
                </label>
                <input
                  type="text"
                  name="telefono"
                  value={editSocio.telefono}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
                {errores.telefono && (
                  <span className="text-red-500 text-sm">{errores.telefono}</span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  name="direccion"
                  value={editSocio.direccion}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
                {errores.direccion && (
                  <span className="text-red-500 text-sm">{errores.direccion}</span>
                )}
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Socio
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="tipo"
                    value="Individual"
                    checked={editSocio.tipo === "Individual"}
                    onChange={() => handleTipoChange("Individual")}
                    className="mr-2"
                  />
                  Individual
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="tipo"
                    value="Familiar"
                    checked={editSocio.tipo === "Familiar"}
                    onChange={() => handleTipoChange("Familiar")}
                    className="mr-2"
                  />
                  Familiar
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
                className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                disabled={Object.keys(errores).length > 0}
              >
                Guardar
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminLayout>
  );
}