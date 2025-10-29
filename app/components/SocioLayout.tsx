'use client'

import Header from './Header'
import SidebarSocio from './SidebarSocio'

interface SocioLayoutProps {
  children: React.ReactNode
  onLogout?: () => void
  userName?: string
}

export default function SocioLayout({ children, onLogout, userName }: SocioLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header userName={userName || 'Usuario'} />
      <div className="flex">
  <SidebarSocio />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
