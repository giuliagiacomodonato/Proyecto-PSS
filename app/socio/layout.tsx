'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '../components/Header'
import SidebarSocio from '../components/SidebarSocio'

interface SocioLayoutProps {
  children: React.ReactNode
}

interface Usuario {
  id: number
  nombre: string
  email: string
  tipoSocio?: 'INDIVIDUAL' | 'FAMILIAR'
  familiarId?: number | null
}

export default function SocioLayout({ children }: SocioLayoutProps) {
  const router = useRouter()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const usuarioGuardado = localStorage.getItem('usuario')
    if (!usuarioGuardado) {
      router.push('/')
      return
    }

    const usuarioData = JSON.parse(usuarioGuardado)
    setUsuario(usuarioData)
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!usuario) {
    return null
  }

  // Determinar si es cabeza de familia (familiarId es null para cabeza de familia)
  const esCabezaDeFamilia = usuario.tipoSocio === 'FAMILIAR' && usuario.familiarId === null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        userName={usuario.nombre} 
        tipoSocio={usuario.tipoSocio}
        esCabezaDeFamilia={esCabezaDeFamilia}
      />
      <div className="flex">
  <SidebarSocio />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
