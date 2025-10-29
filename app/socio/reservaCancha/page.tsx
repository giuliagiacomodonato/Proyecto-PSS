"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ReservaCancha from '../../components/ReservaCancha'
import LoadingSpinner from '../../components/LoadingSpinner'
import Breadcrumb from '../../components/Breadcrumb'
import { LogOut } from 'lucide-react'


interface Usuario {
  id: number
  nombre: string
  email: string
  rol: string
}

export default function ReservaCanchaPage() {
  const router = useRouter()
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  const showMensaje = (texto: string, tipo: 'success' | 'error' = 'success') => {
    setMensaje({ tipo, texto })
  }

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === 'undefined') return

    const verificarUsuario = () => {
      try {
        const token = localStorage.getItem('token')
        const usuarioGuardado = localStorage.getItem('usuario')

        console.log('Token:', token)
        console.log('Usuario guardado:', usuarioGuardado)

        if (!token || !usuarioGuardado) {
          console.log('No hay token o usuario guardado')
          setLoading(false)
          return
        }

        const usuarioData = JSON.parse(usuarioGuardado)
        console.log('Usuario verificado:', usuarioData)

        // Verificar que sea un SOCIO
        if (usuarioData.rol !== 'SOCIO') {
          console.log('Usuario no es SOCIO:', usuarioData.rol)
          setMensaje({ tipo: 'error', texto: 'Solo los socios pueden hacer reservas' })
          setLoading(false)
          return
        }

        setUsuario(usuarioData)
        setLoading(false)
      } catch (error) {
        console.error('Error al verificar usuario:', error)
        setLoading(false)
      }
    }

    verificarUsuario()
  }, [])

  if (loading) {
    return (
      <>
        <div className="mb-8">
          <Breadcrumb items={[
            { label: 'Panel Principal', href: '/socio' },
            { label: 'Reserva de Canchas', active: true }
          ]} />
          <h1 className="text-3xl font-bold text-gray-900">Reserva de Canchas</h1>
          <p className="text-sm text-gray-500 mt-2">Reserve una cancha para sus partidos</p>
        </div>
        <LoadingSpinner />
      </>
    )
  }

  if (!usuario && !loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="text-red-600 text-lg font-semibold">No autorizado - Por favor, inicia sesión</div>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Volver al inicio
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Breadcrumb items={[
            { label: 'Panel Principal', href: '/socio' },
            { label: 'Reserva de Canchas', active: true }
          ]} />
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reserva de Canchas</h1>
              <p className="text-sm text-gray-500 mt-2">Reserva una cancha para tus partidos</p>
            </div>
          </div>
        </div>
        
        {usuario && (
          <ReservaCancha 
            usuarioSocioId={usuario.id}
            onSuccess={() => setMensaje({ tipo: 'success', texto: 'Reserva realizada exitosamente' })}
            onError={(message: string) => setMensaje({ tipo: 'error', texto: message })}
          />
        )}
      </div>

      {mensaje && (
        <div className={`fixed left-1/2 -translate-x-1/2 bottom-8 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap z-50 ${mensaje.tipo === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {mensaje.texto}
        </div>
      )}
    </>
  )
}
