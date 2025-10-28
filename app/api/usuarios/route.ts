import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: /api/usuarios?role=&nombre=&dni=&excludeId=
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams
    const role = params.get('role')
    const nombre = params.get('nombre')
    const dni = params.get('dni')
    const excludeId = params.get('excludeId')

    const where: any = {}
    if (role) where.rol = role
    if (nombre) where.nombre = { contains: nombre, mode: 'insensitive' }
    if (dni) where.dni = dni
    if (excludeId) where.id = { not: Number(excludeId) }

    const usuarios = await prisma.usuario.findMany({
      where,
      select: { id: true, nombre: true, dni: true, rol: true },
      orderBy: { nombre: 'asc' }
    })

    return NextResponse.json({ usuarios })
  } catch (error) {
    console.error('GET /api/usuarios error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// DELETE: body { dni: string }
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { dni } = body

    if (!dni) return NextResponse.json({ error: 'DNI requerido' }, { status: 400 })

    // Buscar usuario por DNI
    const usuario = await prisma.usuario.findUnique({ where: { dni } })
    if (!usuario) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    // Eliminar usuario directamente (sin registro de auditoría)
    await prisma.usuario.delete({ where: { id: usuario.id } })

    return NextResponse.json({ message: 'Usuario eliminado', eliminadoId: usuario.id })
  } catch (error) {
    console.error('DELETE /api/usuarios error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
