"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/app/components/button"
import { Input } from "@/app/components/input"
import { Label } from "@/app/components/label"
import SidebarEntrenador from "@/app/components/SidebarEntrenador"

interface Alumno {
  id: number
  nombre: string
  dni: string
  asistencias: number
  totalClases: number
  porcentajeAsistencia: number
}

export default function ReportesEntrenadorPage() {
  const router = useRouter()

  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [alumnosFiltrados, setAlumnosFiltrados] = useState<Alumno[]>([])
  const [loading, setLoading] = useState(true)
  const [hayAlumnos, setHayAlumnos] = useState(false)

  const [filterNombre, setFilterNombre] = useState("")
  const [filterDni, setFilterDni] = useState("")

  const [mensaje, setMensaje] = useState<string | null>(null)
  const [mensajeTipo, setMensajeTipo] = useState<'success' | 'error' | 'info' | 'warning'>('info')

  // Verificar que sea entrenador y cargar alumnos
  useEffect(() => {
    const usuario = localStorage.getItem("usuario")

    if (!usuario) {
      router.replace("/")
      return
    }

    try {
      const usuarioObj = JSON.parse(usuario)

      if (usuarioObj.rol !== "ENTRENADOR") {
        router.replace(`/${usuarioObj.rol.toLowerCase()}`)
        return
      }

      // Cargar alumnos
      fetchAlumnos(usuarioObj.dni)
    } catch (error) {
      console.error("Error parsing usuario:", error)
      router.replace("/")
    }
  }, [router])

  const fetchAlumnos = async (entrenadorDni: string) => {
    try {
      setLoading(true)
      const response = await fetch("/api/reportes/alumnos", {
        headers: {
          "x-entrenador-dni": entrenadorDni,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Error al cargar los alumnos")
      }

      const data = await response.json()

      if (data.hayAlumnos) {
        setAlumnos(data.alumnos)
        setAlumnosFiltrados(data.alumnos)
        setHayAlumnos(true)
      } else {
        setHayAlumnos(false)
        setAlumnos([])
        setAlumnosFiltrados([])
      }
    } catch (error) {
  setMensaje(error instanceof Error ? error.message : "Error al cargar los alumnos")
  setMensajeTipo("error")
      setHayAlumnos(false)
    } finally {
      setLoading(false)
    }
  }

  // Aplicar filtros
  useEffect(() => {
    let filtrados = alumnos

    if (filterNombre.trim()) {
      filtrados = filtrados.filter((alumno) =>
        alumno.nombre.toLowerCase().includes(filterNombre.toLowerCase())
      )
    }

    if (filterDni.trim()) {
      filtrados = filtrados.filter((alumno) => alumno.dni.includes(filterDni))
    }

    setAlumnosFiltrados(filtrados)
  }, [filterNombre, filterDni, alumnos])

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterNombre(e.target.value)
  }

  const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterDni(e.target.value)
  }

  return (
    <div className="flex min-h-screen bg-white">
      <SidebarEntrenador />


      <div className="flex-1 p-8">
        <div className="mb-6 text-sm text-gray-800">Panel Principal {">"} Reportes</div>

        <div className="mx-auto max-w-5xl">
          <h1 className="mb-6 text-2xl font-semibold text-black">Reportes</h1>

          {loading ? (
            <div className="text-center py-8 text-gray-600">Cargando alumnos...</div>
          ) : !hayAlumnos ? (
            <div className="rounded-lg border border-gray-300 p-8 text-center">
              <p className="text-gray-600">No hay alumnos inscriptos</p>
            </div>
          ) : (
            <>
              {/* Mensaje inline de éxito/error arriba de la tabla */}
              {mensaje && (
                <div className="mb-4 flex justify-center">
                  <div className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${mensajeTipo === 'error' ? 'bg-red-100 text-red-800' : mensajeTipo === 'success' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                    {mensaje}
                  </div>
                </div>
              )}
              {/* Filtros */}
              <div className="mb-6 grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="nombre">Nombre</Label>
                  <Input
                    id="nombre"
                    placeholder="Buscar por nombre..."
                    value={filterNombre}
                    onChange={handleNombreChange}
                    disabled={!hayAlumnos}
                  />
                </div>
                <div>
                  <Label htmlFor="dni">DNI</Label>
                  <Input
                    id="dni"
                    placeholder="Buscar por DNI..."
                    value={filterDni}
                    onChange={handleDniChange}
                    disabled={!hayAlumnos}
                  />
                </div>
              </div>

              {/* Grilla de alumnos */}
              <div className="overflow-x-auto rounded-lg border border-gray-300">
                <table className="w-full" style={{ tableLayout: "fixed" }}>
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-black w-1/3">Nombre Completo</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-black w-1/3">DNI</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-black w-1/3">Asistencia</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alumnosFiltrados.length > 0 ? (
                      alumnosFiltrados.map((alumno) => (
                        <tr key={alumno.id} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-black w-1/3">{alumno.nombre}</td>
                          <td className="px-6 py-4 text-sm text-black w-1/3">{alumno.dni}</td>
                          <td className="px-6 py-4 text-sm text-black w-1/3">{alumno.porcentajeAsistencia}%</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-6 py-4 text-sm text-gray-600 w-1/3">No se encontraron coincidencias</td>
                        <td className="w-1/3"></td>
                        <td className="w-1/3"></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
