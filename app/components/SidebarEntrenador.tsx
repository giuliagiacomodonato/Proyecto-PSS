'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  FileText,
  LogOut,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  DollarSign,
} from 'lucide-react'

interface MenuItem {
  icon: React.ReactNode
  label: string
  href?: string
  subItems?: { label: string; href: string }[]
}

export default function SidebarEntrenador() {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<string[]>([])

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    window.location.href = '/'
  }

  const menuItems: MenuItem[] = [
    {
      icon: <Home size={20} />,
      label: 'Panel Principal',
      href: '/entrenador'
    },
    {
      icon: <CheckSquare size={18} />,
      label: 'Registrar Asistencia',
      href: '/entrenador/asistencia'
    },
    {
      icon: <FileText size={20} />,
      label: 'Reportes',
      href: '/entrenador/reportes'
    }
    ,
    {
      icon: <DollarSign size={18} />,
      label: 'Modificar Precios',
      href: '/entrenador/modificar-precios'
    }
  ]

  return (
    <aside className="w-80 bg-white min-h-screen p-4 border-r border-gray-200 flex flex-col">
      {/* Menu Items */}
      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => (
          <div key={item.label}>
            {item.href && !item.subItems ? (
              // Link directo sin submenú
              <Link
                href={item.href}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  (pathname === item.href || pathname?.startsWith(item.href + '/'))
                    ? 'bg-gray-100 text-gray-900' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
              </Link>
            ) : (
              // Item con submenú
              <>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                >
                  {item.icon}
                  <span className="flex-1 text-left">{item.label}</span>
                  {openMenus.includes(item.label) ? (
                    <ChevronDown size={20} />
                  ) : (
                    <ChevronRight size={20} />
                  )}
                </button>
                
                {/* Submenú */}
                {openMenus.includes(item.label) && item.subItems && (
                  <div className="ml-9 mt-1 space-y-1">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.label}
                        href={subItem.href}
                        className={`flex items-center gap-2 p-2 pl-4 rounded-lg transition-colors text-sm ${
                          pathname === subItem.href 
                            ? 'bg-gray-100 text-gray-900 font-medium' 
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </nav>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-auto border-t border-gray-200 pt-4"
      >
        <LogOut size={20} />
        <span>Cerrar Sesión</span>
      </button>
    </aside>
  )
}
