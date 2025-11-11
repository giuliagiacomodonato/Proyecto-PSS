'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { 
  Home, 
  Volleyball,
  Trophy,
  CreditCard,
  CheckSquare,
  User,
  ChevronDown,
  ChevronRight,
  LogOut
} from 'lucide-react'

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href?: string;
  subItems?: { label: string; href: string }[];
}

export default function SidebarSocio() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/';
    }
  };

  const toggleMenu = (label: string) => {
    setOpenMenus(prev =>
      prev.includes(label)
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const menuItems: MenuItem[] = [
    {
      icon: <Home size={24} />,
      label: 'Panel Principal',
      href: '/socio'
    },
    {
      icon: <Volleyball size={24} />,
      label: 'Inscripciones',
      href: '/socio/inscripciones'
    },
    {
      icon: <Trophy size={24} />,
      label: 'Reservas',
      href: '/socio/reservaCancha'
    },
    {
      icon: <CreditCard size={24} />,
      label: 'Pagos',
      subItems: [
        { label: 'Cuota Socio', href: '/socio/pagoCuotaSocio' },
        { label: 'Cuota Practica', href: '/socio/pagoSocio?tipo=practica' }
      ]
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
  ];

  return (
    <aside className="w-80 bg-white min-h-screen p-6 border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900">Panel Principal</h2>
      </div>
      {/* Menu Items */}
      <nav className="space-y-3 flex-1">
        {menuItems.map((item) => (
          <div key={item.label}>
            {item.href && !item.subItems ? (
              // Link directo sin submenú
              <Link
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
            ) : (
              // Item con submenú
              <>
                <button
                  onClick={() => toggleMenu(item.label)}
                  className={`w-full flex items-center gap-4 px-6 py-3 rounded-2xl transition-all font-medium ${
                    openMenus.includes(item.label) || pathname.includes(item.label.toLowerCase())
                      ? 'bg-blue-100 text-blue-900 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className={openMenus.includes(item.label) || pathname.includes(item.label.toLowerCase()) ? 'text-blue-600' : 'text-gray-600'}>
                    {item.icon}
                  </div>
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
                        className="flex items-center gap-2 p-2 pl-4 rounded-lg transition-colors text-sm text-gray-700 hover:bg-gray-100"
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
      {/* Logout Button unified */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-auto border-t border-gray-200 pt-4"
      >
        <LogOut size={20} />
        <span>Cerrar sesión</span>
      </button>
    </aside>
  );
//
}
