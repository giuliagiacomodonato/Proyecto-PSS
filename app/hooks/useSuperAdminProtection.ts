'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Hook para proteger rutas que solo pueden ser accedidas por SUPER_ADMIN
 * Redirige a /admin si el usuario no es super administrador
 */
export function useSuperAdminProtection() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === 'undefined') return

      const usuarioRaw = localStorage.getItem('usuario')
      
      if (!usuarioRaw) {
        // No hay usuario en localStorage, redirigir a login
        router.push('/')
        return
      }

      try {
        const usuario = JSON.parse(usuarioRaw)
        
        // Verificar que sea SUPER_ADMIN
        if (usuario.rol === 'SUPER_ADMIN') {
          setIsAuthorized(true)
        } else {
          // No es super admin, redirigir al dashboard
          router.push('/admin')
        }
      } catch (error) {
        console.error('Error al verificar autenticación:', error)
        router.push('/')
      } finally {
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [router])

  return { isAuthorized, isChecking }
}
