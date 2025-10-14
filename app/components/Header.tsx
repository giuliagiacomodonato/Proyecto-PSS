'use client'

import { User } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-gray-800 text-white px-6 py-4 flex items-center justify-between">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold">Gestor Club Deportivo</h1>
      </div>
      
      <div className="flex items-center gap-3">
        <User size={20} />
        <span className="text-sm">Usuario Admin</span>
      </div>
    </header>
  )
}
