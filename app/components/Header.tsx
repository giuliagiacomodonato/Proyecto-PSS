'use client'

import { User, Users } from 'lucide-react'

interface HeaderProps {
  userName: string
  tipoSocio?: 'INDIVIDUAL' | 'FAMILIAR'
  esCabezaDeFamilia?: boolean
}

export default function Header({ userName, tipoSocio, esCabezaDeFamilia }: HeaderProps) {
  // Determinar el texto del badge según el tipo de socio
  const getBadgeText = () => {
    if (!tipoSocio) return 'Socio'

    if (tipoSocio === 'INDIVIDUAL') {
      return 'Socio Individual'
    }

    if (tipoSocio === 'FAMILIAR') {
      if (esCabezaDeFamilia) {
        return 'Socio Familiar (Cabeza de Familia)'
      }
      return 'Socio Familiar'
    }

    return 'Socio'
  }

  // Determinar el icono según el tipo
  const getIcon = () => {
    if (tipoSocio === 'FAMILIAR') {
      return <Users className="w-5 h-5 text-blue-600" />
    }
    return <User className="w-5 h-5 text-blue-600" />
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestor Club Deportivo</h1>
          <p className="text-sm text-gray-500 mt-1">Panel del Socio</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
            {getIcon()}
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium text-gray-900">{userName}</span>
              <span className="text-xs text-blue-700">{getBadgeText()}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
