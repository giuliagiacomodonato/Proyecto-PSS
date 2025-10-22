'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Users,
  Dumbbell,
  CreditCard,
  CheckSquare,
  User
} from 'lucide-react'

interface MenuItem {
  icon: React.ReactNode
  label: string
  href: string
}

interface SidebarSocioProps {
  onLogout?: () => void
}

export default function SidebarSocio({ onLogout }: SidebarSocioProps) {
  const pathname = usePathname()

  const menuItems: MenuItem[] = [
    {
      icon: <Home size={24} />,
      label: 'Panel Principal',
      href: '/socio'
    },
    {
      icon: <Users size={24} />,
      label: 'Inscripciones',
      href: '/socio/inscripciones'
    },
    {
      icon: <Dumbbell size={24} />,
      label: 'Reservas',
      href: '/socio/reservaCancha'
    },
    {
      icon: <CreditCard size={24} />,
      label: 'Pagos',
      href: '/socio/pagos'
    },
    {
      icon: <CheckSquare size={24} />,
      label: 'Asistencia',
      href: '/socio/asistencia'
    },
    {
      icon: <User size={24} />,
      label: 'Plan',
      href: '/socio/plan'
    }
  ]

  return (
    <aside className="w-80 bg-white min-h-screen p-6 border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900">Panel Principal</h2>
      </div>

      {/* Menu Items */}
      <nav className="space-y-3 flex-1">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-4 px-6 py-3 rounded-2xl transition-all font-medium ${
              pathname === item.href 
                ? 'bg-blue-100 text-blue-900 shadow-sm' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <div className={pathname === item.href ? 'text-blue-600' : 'text-gray-600'}>
              {item.icon}
            </div>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
      {onLogout && (
        <button
          onClick={onLogout}
          className="w-full px-6 py-3 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-medium border-t border-gray-200 pt-6 mt-6"
        >
          Contacto
        </button>
      )}
    </aside>
  )
}
