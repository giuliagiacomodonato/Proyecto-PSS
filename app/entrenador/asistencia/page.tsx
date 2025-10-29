'use client'

import React, { useEffect, useState } from 'react'
import SidebarEntrenador from '@/app/components/SidebarEntrenador'
import { CheckSquare } from 'lucide-react'

interface Socio {
  id: number
  nombre: string
  dni: string
  inscripcionId: number
}

interface AsistenciaRegistro {
  inscripcionId: number
  usuarioSocioId: number
  presente: boolean
}

interface Practica {
  id: number
  nombre: string
}

export default function RegistrarAsistenciaPage() {
  const [loading, setLoading] = useState(true)
  const [practica, setPractica] = useState<Practica | null>(null)
  const [socios, setSocios] = useState<Socio[]>([])
  const [asistencias, setAsistencias] = useState<Map<number, boolean>>(new Map())
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // Obtener usuario desde localStorage
      const usuarioRaw = typeof window !== 'undefined' ? localStorage.getItem('usuario') : null
      if (!usuarioRaw) {
        if (typeof window !== 'undefined') window.location.href = '/'
        return
      }

      try {
        const usuario = JSON.parse(usuarioRaw)

        // 1) Obtener la práctica del entrenador
        const practicasRes = await fetch('/api/practicas')
        const practicasData = await practicasRes.json()

        const miPractica = practicasData.find((p: any) =>
          Array.isArray(p.entrenadores) && p.entrenadores.some((e: any) => e.id === usuario.id)
        )

        if (!miPractica) {
          setMensaje({ tipo: 'error', texto: 'No tiene una práctica asignada' })
          setLoading(false)
          return
        }

        setPractica(miPractica)

        // 2) Obtener inscripciones de la práctica
        const inscripcionesRes = await fetch(`/api/practicas/inscripciones?practicaId=${miPractica.id}`)
        const inscripcionesData = await inscripcionesRes.json()

        if (inscripcionesData.inscripciones && inscripcionesData.inscripciones.length > 0) {
          const sociosInscritos: Socio[] = inscripcionesData.inscripciones.map((insc: any) => ({
            id: insc.usuarioSocio.id,
            nombre: insc.usuarioSocio.nombre,
            dni: insc.usuarioSocio.dni,
            inscripcionId: insc.id,
          }))

          setSocios(sociosInscritos)

          // 3) Obtener asistencias ya registradas para hoy
          const hoy = new Date().toISOString().split('T')[0]
          const asistenciasRes = await fetch(`/api/asistencias?practicaId=${miPractica.id}&fecha=${hoy}`)
          const asistenciasData = await asistenciasRes.json()

          console.log('Asistencias cargadas de la BD:', asistenciasData)

          // Crear mapa de asistencias existentes
          const asistenciasMap = new Map<number, boolean>()
          if (asistenciasData.asistencias) {
            asistenciasData.asistencias.forEach((asist: any) => {
              asistenciasMap.set(asist.usuarioSocio.id, asist.presente)
              console.log(`Socio ${asist.usuarioSocio.nombre} (ID: ${asist.usuarioSocio.id}): ${asist.presente ? 'PRESENTE' : 'AUSENTE'}`)
            })
          }

          console.log('Mapa de asistencias:', asistenciasMap)
          setAsistencias(asistenciasMap)
        } else {
          setMensaje({ tipo: 'error', texto: 'No hay socios inscriptos en esta práctica' })
        }
      } catch (error) {
        console.error('Error cargando datos:', error)
        setMensaje({ tipo: 'error', texto: 'Error al cargar los datos' })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const toggleAsistencia = (socioId: number) => {
    const nuevasAsistencias = new Map(asistencias)
    const valorActual = nuevasAsistencias.get(socioId)
    
    if (valorActual === undefined) {
      nuevasAsistencias.set(socioId, true)
    } else {
      nuevasAsistencias.set(socioId, !valorActual)
    }
    
    setAsistencias(nuevasAsistencias)
  }

  const guardarAsistencias = async () => {
    if (!practica) return

    setGuardando(true)
    setMensaje(null)

    try {
      // Preparar datos para enviar
      const asistenciasArray: AsistenciaRegistro[] = socios.map(socio => ({
        inscripcionId: socio.inscripcionId,
        usuarioSocioId: socio.id,
        presente: asistencias.get(socio.id) || false,
      }))

      console.log('Guardando asistencias:', asistenciasArray)

      const response = await fetch('/api/asistencias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          practicaId: practica.id,
          asistencias: asistenciasArray,
        }),
      })

      const data = await response.json()

      console.log('Respuesta del servidor:', data)

      if (response.ok) {
        setMensaje({ tipo: 'success', texto: 'Asistencia registrada con éxito' })
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => setMensaje(null), 3000)
      } else {
        setMensaje({ tipo: 'error', texto: data.error || 'Error al guardar asistencia' })
      }
    } catch (error) {
      console.error('Error al guardar asistencias:', error)
      setMensaje({ tipo: 'error', texto: 'Error al guardar asistencia' })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      <SidebarEntrenador />

      <main className="flex-1 p-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Registrar Asistencia</h1>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Práctica Deportiva
              </label>
              <select 
                className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled
                value={practica?.id || ''}
              >
                {practica ? (
                  <option value={practica.id}>{practica.nombre}</option>
                ) : (
                  <option value="">Seleccione la práctica</option>
                )}
              </select>
            </div>

            <p className="text-sm text-gray-600">
              Fecha: {new Date().toLocaleDateString('es-AR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </header>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Cargando lista de socios...</div>
            </div>
          ) : socios.length === 0 ? (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-8 text-center">
              <p className="text-xl text-gray-700 font-semibold">
                {mensaje?.texto || 'No hay socios inscriptos en esta práctica'}
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Listado de alumnos</h3>
                <div className="space-y-3">
                  {socios.map((socio) => {
                    const presente = asistencias.get(socio.id) || false
                    return (
                      <div key={socio.id} className="flex items-center gap-3">
                        <label className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors flex-1">
                          <input
                            type="checkbox"
                            checked={presente}
                            onChange={() => toggleAsistencia(socio.id)}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-sm text-gray-700">
                            {socio.nombre}
                          </span>
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="mt-6 flex items-center gap-4">
                <button
                  onClick={guardarAsistencias}
                  disabled={guardando}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  <CheckSquare size={20} />
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>

                {mensaje && (
                  <div
                    className={`px-4 py-2 rounded-lg font-medium ${
                      mensaje.tipo === 'success'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {mensaje.texto}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
