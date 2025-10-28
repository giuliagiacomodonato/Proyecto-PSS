'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Users, 
  UserCircle, 
  UsersRound,
  Dumbbell,
  CreditCard,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Check
} from 'lucide-react'

interface MenuItem {
  icon: React.ReactNode
  label: string
  href?: string
  subItems?: { label: string; href: string }[]
}

export default function Sidebar() {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<string[]>(['Socios'])

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    )
  }

  const menuItems: MenuItem[] = [
    {
      icon: <Home size={20} />,
      label: 'Panel Principal',
      href: '/admin'
    },
    {
      icon: <UserCircle size={20} />,
      label: 'Administrador',
      subItems: [
        { label: 'Registrar Administrador', href: '/admin/altaAdmin' },
        { label: 'Modificar Administrador', href: '/admin/modificarAdmin' },
        { label: 'Eliminar Administrador', href: '/admin/bajaAdmin' }
      ]
    },
    {
      icon: <Users size={20} />,
      label: 'Entrenadores',
      subItems: [
        { label: 'Registrar Entrenador', href: '/admin/altaEntrenador' },
        { label: 'Modificar Entrenador', href: '/admin/modifEntrenador' },
        { label: 'Eliminar Entrenador', href: '/admin/entrenadores/eliminar' }
      ]
    },
    {
      icon: <UsersRound size={20} />,
      label: 'Socios',
      subItems: [
        { label: 'Registrar Socio', href: '/admin/altaSocio' },
        { label: 'Modificar Socio', href: '/admin/modifSocio' },
        { label: 'Eliminar Socio', href: '/admin/bajaSocio' }
      ]
    },
    {
      icon: <Dumbbell size={20} />,
      label: 'Canchas',
      subItems: [
        { label: 'Registrar Cancha', href: '/admin/altaCancha' },
        { label: 'Modificar Cancha', href: '/admin/canchas/modificar' },
        { label: 'Eliminar Cancha', href: '/admin/bajaCancha' }
      ]
    },
    {
      icon: <Dumbbell size={20} />,
      label: 'Prácticas Deportivas',
      subItems: [
        { label: 'Registrar Práctica', href: '/admin/altaPractica' },
        { label: 'Modificar Práctica', href: '/admin/modifPractica' },
        { label: 'Eliminar Práctica', href: '/admin/practicas/eliminar' }
      ]
    },
    {
      icon: <CreditCard size={20} />,
      label: 'Pagos',
      subItems: [
        { label: 'Ver Pagos', href: '/admin/pagos' },
        { label: 'Registrar Pago', href: '/admin/pagos/registrar' }
      ]
    },
    {
      icon: <DollarSign size={20} />,
      label: 'Modificar Precios',
      subItems: [
        { label: 'Precios Canchas', href: '/admin/precios/canchas' },
        { label: 'Precios Prácticas', href: '/admin/precios/practicas' }
      ]
    },
     {
      icon: <UsersRound size={20} />,
      label: 'Usuarios',
      href: '/admin/grillaUsuarios'
    }
  ]

  return (
    <aside className="w-80 bg-white min-h-screen p-4 border-r border-gray-200">
      {/* Menu Items */}
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <div key={item.label}>
            {item.href && !item.subItems ? (
              // Link directo sin submenú
              <Link
                href={item.href}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  pathname === item.href 
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
                        {pathname === subItem.href && <Check size={16} />}
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
    </aside>
  )
}