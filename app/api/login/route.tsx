import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

interface LoginRequest {
  email: string
  contraseña: string
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { email, contraseña } = body

    // Validar que se envíen los campos requeridos
    if (!email || !contraseña) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Buscar usuario por email en la base de datos
    const usuario = await prisma.usuario.findUnique({
      where: { email },
      select: {
        id: true,
        nombre: true,
        email: true,
        rol: true,
        contraseña: true,
        dni: true,
        telefono: true,
        fechaNacimiento: true,
        tipoSocio: true,
        practicaDeportivaId: true
      }
    })

    // Verificar si el usuario existe
    if (!usuario) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Verificar la contraseña usando bcrypt
    const contraseñaValida = await bcrypt.compare(contraseña, usuario.contraseña)

    if (!contraseñaValida) {
      return NextResponse.json(
        { error: 'Contraseña incorrecta' },
        { status: 401 }
      )
    }

    // Preparar datos del usuario para la respuesta (sin contraseña)
    const { contraseña: _, ...usuarioSinContraseña } = usuario

    // Generar un token simple (en producción usa JWT)
    const token = Buffer.from(`${usuario.id}:${Date.now()}`).toString('base64')

    // Retornar usuario autenticado con su rol
    return NextResponse.json({
      message: 'Login exitoso',
      rol: usuario.rol,
      token,
      usuario: usuarioSinContraseña
    })

  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { error: 'Error en el servidor' },
      { status: 500 }
    )
  }
}