'use client'

import Header from './Header'
import Sidebar from './Sidebar'
import SidebarSocio from './SidebarSocio'

interface AdminLayoutProps {
  children: React.ReactNode
  rol?: string
  userName?: string
  onLogout?: () => void
}

export default function AdminLayout({ children, rol, userName = 'Usuario', onLogout }: AdminLayoutProps) {
  const isSocio = rol === 'SOCIO';
  return (
    <div className="min-h-screen bg-gray-50">
      <Header userName={userName} rol={rol} />
      <div className="flex">
        {isSocio ? (
          <SidebarSocio />
        ) : (
          <Sidebar />
        )}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
