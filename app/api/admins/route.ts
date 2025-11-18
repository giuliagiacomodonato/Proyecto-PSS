import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'


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

    // Verificar duplicados de forma más específica
    const existingEmail = await prisma.usuario.findFirst({
      where: { email },
    })

    const existingDni = await prisma.usuario.findFirst({
      where: { dni },
    })

    // Construir errores específicos
    const duplicateErrors: Record<string, string> = {}
    if (existingEmail) {
      duplicateErrors.email = 'Ya existe un usuario con ese email'
    }
    if (existingDni) {
      duplicateErrors.dni = 'Ya existe un usuario con ese DNI'
    }

    if (Object.keys(duplicateErrors).length > 0) {
      return NextResponse.json({ errors: duplicateErrors }, { status: 409 })
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

// Endpoint GET: obtener un admin por dni o id
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const dni = url.searchParams.get('dni')
    const id = url.searchParams.get('id')

    if (!dni && !id) {
      return NextResponse.json({ error: 'Se requiere id o dni para la búsqueda' }, { status: 400 })
    }

    const where: any = { rol: 'ADMIN' }
    if (dni) where.dni = dni
    if (id) where.id = Number(id)

    const admin = await prisma.usuario.findFirst({
      where,
      select: {
        id: true,
        nombre: true,
        dni: true,
        fechaNacimiento: true,
        email: true,
        telefono: true,
        fechaAlta: true
      }
    })

    if (!admin) return NextResponse.json({ error: 'Administrador no encontrado' }, { status: 404 })

    return NextResponse.json({ admin })
  } catch (err: any) {
    console.error('GET /api/admins error:', err)
    return NextResponse.json({ error: err?.message ?? 'Error interno' }, { status: 500 })
  }
}

// Endpoint PATCH: actualizar datos de un administrador
export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, nombre, dni, fechaNacimiento, email, telefono, contraseña } = body

    if (!id) return NextResponse.json({ error: 'Se requiere id del administrador' }, { status: 400 })

    // Validaciones parciales
    const errors: Record<string, string> = {}
    if (nombre !== undefined) {
      if (!nombre || typeof nombre !== 'string' || !nombre.trim()) errors.nombre = 'Nombre requerido'
    }
    if (dni !== undefined) {
      if (!/^[0-9]{7,8}$/.test(String(dni))) errors.dni = 'DNI inválido (7 u 8 dígitos)'
    }
    if (fechaNacimiento !== undefined) {
      if (isNaN(Date.parse(fechaNacimiento))) errors.fechaNacimiento = 'Fecha de nacimiento inválida'
      else {
        const yrErr = yearRangeErrorFor(fechaNacimiento, 'Fecha de nacimiento')
        if (yrErr) errors.fechaNacimiento = yrErr
      }
    }
    if (email !== undefined) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) errors.email = 'Email inválido'
    }
    if (telefono !== undefined) {
      if (!/^\d+$/.test(String(telefono))) errors.telefono = 'Teléfono inválido'
    }
    if (contraseña !== undefined) {
      if (typeof contraseña !== 'string' || contraseña.length < 8) errors.contraseña = 'Contraseña inválida (mínimo 8 caracteres)'
      else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#\$%*?&._\-!]).+$/.test(contraseña)) {
        errors.contraseña = 'Contraseña debe incluir mayúscula, minúscula, número y carácter especial'
      }
    }

    if (Object.keys(errors).length > 0) return NextResponse.json({ errors }, { status: 400 })

    // Comprobar colisiones de email/dni con otros usuarios
    if (dni || email) {
      const conflict = await prisma.usuario.findFirst({
        where: {
          OR: [{ dni: dia(dni) }, { email }].filter(Boolean),
          id: { not: Number(id) }
        }
      })
      if (conflict) return NextResponse.json({ error: 'El email o DNI ya está en uso por otro usuario' }, { status: 409 })
    }

    const updateData: any = {}
    if (nombre !== undefined) updateData.nombre = nombre
    if (dni !== undefined) updateData.dni = dni
    if (fechaNacimiento !== undefined) updateData.fechaNacimiento = new Date(fechaNacimiento)
    if (email !== undefined) updateData.email = email
    if (telefono !== undefined) updateData.telefono = telefono
    if (contraseña !== undefined) updateData.contraseña = await bcrypt.hash(contraseña, 10)

    const updated = await prisma.usuario.update({ where: { id: Number(id) }, data: updateData })
    const { contraseña: _omit, ...safe } = updated as any
    return NextResponse.json({ success: true, usuario: safe })
  } catch (err: any) {
    console.error('PATCH /api/admins error:', err)
    return NextResponse.json({ error: err?.message ?? 'Error interno del servidor' }, { status: 500 })
  }
}

// Helper para manejar posible undefined en la búsqueda OR
function dia(value: any) {
  return value === undefined ? undefined : String(value)
}