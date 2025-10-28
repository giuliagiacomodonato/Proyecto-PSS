"use client"

import React, { useEffect, useState } from 'react'
import SidebarEntrenador from '@/app/components/SidebarEntrenador'
import { Users, BarChart2 } from 'lucide-react'

interface Alumno {
  id: number
  nombre: string
  dni: string
  asistencias: number
  totalClases: number
  porcentajeAsistencia: number
}

interface Practica {
  id: number
  nombre: string
  descripcion?: string
  cupo?: number
  precio?: number
  entrenadores?: { id: number; nombre: string }[]
}

export default function EntrenadorPage() {
  const [loading, setLoading] = useState(true)
  const [practica, setPractica] = useState<Practica | null>(null)
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // Obtener usuario desde localStorage (guardado en login)
      const usuarioRaw = typeof window !== 'undefined' ? localStorage.getItem('usuario') : null
      if (!usuarioRaw) {
        // No autenticado: redirigir al login
        if (typeof window !== 'undefined') window.location.href = '/'
        return
      }

      try {
        const usuario = JSON.parse(usuarioRaw)

        // 1) Obtener practicas y buscar la que tenga al entrenador (por id)
        const practicasRes = await fetch('/api/practicas')
        const practicasData: Practica[] = await practicasRes.json()

        const miPractica = practicasData.find((p) =>
          Array.isArray(p.entrenadores) && p.entrenadores.some((e) => e.id === usuario.id)
        ) || null

        setPractica(miPractica)

        // 2) Obtener alumnos y porcentaje de asistencias desde reportes API
        const reportesRes = await fetch('/api/reportes/alumnos', {
          headers: {
            'x-entrenador-dni': usuario.dni || ''
          }
        })

        if (!reportesRes.ok) {
          const err = await reportesRes.json().catch(() => ({ error: 'Error al obtener reportes' }))
          setError(err.error || 'No se pudieron obtener los datos')
          setAlumnos([])
          setLoading(false)
          return
        }

        const reportesJson = await reportesRes.json()
        setAlumnos(reportesJson.alumnos || [])

      } catch (e) {
        console.error('Error cargando dashboard de entrenador:', e)
        setError('Error al cargar datos del dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="flex min-h-screen bg-white">
      <SidebarEntrenador />

      <main className="flex-1 p-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Panel Principal</h1>
            <p className="text-sm text-gray-600">Métricas principales de la práctica deportiva a su cargo</p>
          </header>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Cargando métricas...</div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 rounded">{error}</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Un único panel grande que contiene práctica e inscriptos (formato wireframe) */}
              <section className="lg:col-span-3 bg-white rounded-lg shadow p-6">
                {/* Título pequeño con icono */}
                <div className="flex items-center gap-3 mb-3">
                  <BarChart2 className="text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-700">Práctica Deportiva a Cargo</h2>
                </div>

                {/* Fila con nombre de práctica y número de alumnos más juntos */}
                <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                  <p className="text-sm text-gray-500">{practica ? practica.nombre : '[Nombre Práctica]'}</p>
                  <span className="text-sm text-gray-500">·</span>
                  <p className="text-sm text-gray-500">{alumnos.length > 0 ? `${alumnos.length} alumnos` : '[número de alumnos]'}</p>
                </div>

                {/* Sección de Inscriptos: título e icono */}
                <div className="flex items-center gap-3 mt-6 mb-3">
                  <Users className="text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-700">Inscriptos</h3>
                </div>

                {/* Lista de inscriptos con porcentaje de asistencia (alineada a la derecha) */}
                {alumnos.length === 0 ? (
                  <p className="text-sm text-gray-600">No hay alumnos inscriptos.</p>
                ) : (
                  <ul className="space-y-3">
                    {alumnos.map((a) => (
                      <li key={a.id} className="flex items-center gap-3">
                        <p className="text-sm font-medium text-gray-900">{a.nombre}</p>
                        <span className="text-sm text-gray-500">·</span>
                        <p className="text-sm text-gray-500">{a.porcentajeAsistencia}%</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
