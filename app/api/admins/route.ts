import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const prisma = global.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') global.prisma = prisma

function yearRangeErrorFor(dateStr: any, fieldName: string) {
  if (!dateStr) return `${fieldName} inválida`
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return `${fieldName} inválida`
  const year = d.getFullYear()
  const now = new Date()
  const currentYear = now.getFullYear()
  const minYear = currentYear - 100

  if (year > currentYear) return `${fieldName} no puede ser un año futuro`
  if (year < minYear) return `${fieldName} demasiada antigua`
  return null
}

function validatePayload(body: any) {
  const errors: Record<string, string> = {}

  if (!body?.nombre || typeof body.nombre !== 'string' || !body.nombre.trim()) {
    errors.nombre = 'Nombre requerido'
  }

  if (!body?.dni || !/^\d{7,8}$/.test(String(body.dni))) {
    errors.dni = 'DNI inválido (7 u 8 dígitos)'
  }

  if (!body?.fechaNacimiento || isNaN(Date.parse(body.fechaNacimiento))) {
    errors.fechaNacimiento = 'Fecha de nacimiento inválida'
  } else {
    const yrErr = yearRangeErrorFor(body.fechaNacimiento, 'Fecha de nacimiento')
    if (yrErr) errors.fechaNacimiento = yrErr
  }

  if (!body?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    errors.email = 'Email inválido'
  }

  if (!body?.telefono || !/^\d+$/.test(String(body.telefono))) {
    errors.telefono = 'Teléfono inválido'
  }

  if (!body?.fechaRegistro || isNaN(Date.parse(body.fechaRegistro))) {
    errors.fechaRegistro = 'Fecha de registro inválida'
  } else {
    const yrErr = yearRangeErrorFor(body.fechaRegistro, 'Fecha de registro')
    if (yrErr) errors.fechaRegistro = yrErr
  }

  if (!body?.contraseña || typeof body.contraseña !== 'string' || body.contraseña.length < 8) {
    errors.contraseña = 'Contraseña inválida (mínimo 8 caracteres)'
  } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#\$%*?&._\-!]).+$/.test(body.contraseña)) {
    errors.contraseña = 'Contraseña debe incluir mayúscula, minúscula, número y carácter especial'
  }

  return errors
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const validation = validatePayload(body)
    if (Object.keys(validation).length > 0) {
      return NextResponse.json({ errors: validation }, { status: 400 })
    }

    const { nombre, dni, fechaNacimiento, email, telefono, contraseña, fechaRegistro } = body

    // Buscar por email o dni en la tabla usuarios
    const existing = await prisma.usuario.findFirst({
      where: { OR: [{ email }, { dni }] },
    })

    if (existing) {
      return NextResponse.json({ error: 'Ya existe un usuario con ese email o DNI' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(contraseña, 10)

    const usuarioCreated = await prisma.usuario.create({
      data: {
        rol: 'ADMIN',
        nombre,
        dni,
        fechaNacimiento: new Date(fechaNacimiento),
        email,
        telefono,
        contraseña: hashed,
        fechaAlta: new Date(fechaRegistro),
      },
    })

    const { contraseña: _omit, ...safeUsuario } = usuarioCreated as any

    return NextResponse.json({ success: true, usuario: safeUsuario }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/admins error:', err)
    return NextResponse.json({ error: err?.message ?? 'Error interno del servidor' }, { status: 500 })
  }
}