import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Usuario {
  id: number;
  rol: string;
  nombre: string;
  email: string;
}

/**
 * Hook para proteger rutas admin
 * Solo permite acceso a usuarios con rol ADMIN
 * @returns { isAuthorized: boolean, usuario: Usuario | null, isChecking: boolean }
 */
export function useAdminProtection() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const verificarAcceso = () => {
      try {
        const token = localStorage.getItem('token');
        const usuarioGuardado = localStorage.getItem('usuario');

        // Validar que haya token y usuario
        if (!token || !usuarioGuardado) {
          console.warn('⚠️ No hay sesión activa');
          router.replace('/');
          setIsChecking(false);
          return;
        }

        const usuarioObj: Usuario = JSON.parse(usuarioGuardado);

        // Validar que sea ADMIN
        if (usuarioObj.rol !== 'ADMIN') {
          console.warn(
            `⚠️ Acceso denegado: Usuario con rol ${usuarioObj.rol} no es administrador`
          );
          // Redirigir al dashboard del usuario según su rol
          router.replace(`/${usuarioObj.rol.toLowerCase()}`);
          setIsChecking(false);
          return;
        }

        console.log('✅ Acceso permitido - Usuario ADMIN autenticado');
        setUsuario(usuarioObj);
        setIsAuthorized(true);
        setIsChecking(false);
      } catch (error) {
        console.error('❌ Error al verificar acceso:', error);
        router.replace('/');
        setIsChecking(false);
      }
    };

    verificarAcceso();
  }, [router]);

  return { isAuthorized, usuario, isChecking };
}
