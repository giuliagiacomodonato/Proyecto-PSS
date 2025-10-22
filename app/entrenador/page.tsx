"use client"

import React from 'react'
import SidebarEntrenador from '@/app/components/SidebarEntrenador'

export default function EntrenadorPage() {
  return (
    <div className="flex min-h-screen bg-white">
      <SidebarEntrenador />
      <main className="flex-1 flex items-center justify-center bg-gray-50">
        <h1 className="text-3xl font-bold">Panel de Entrenador</h1>
      </main>
    </div>
  )
}
