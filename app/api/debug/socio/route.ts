import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/debug/socio?dni=32323232
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const dni = url.searchParams.get('dni')
    if (!dni) return NextResponse.json({ error: 'dni requerido' }, { status: 400 })

    const socio = await prisma.usuario.findFirst({
      where: { dni, rol: 'SOCIO' },
      select: {
        id: true,
        nombre: true,
        dni: true,
        tipoSocio: true,
        email: true,
        telefono: true,
        fechaAlta: true
      }
    })

    if (!socio) return NextResponse.json({ existe: false }, { status: 200 })

    const cuotas = await prisma.cuota.findMany({ where: { usuarioSocioId: socio.id }, include: { pagos: true } })
    const inscripciones = await prisma.inscripcion.findMany({ where: { usuarioSocioId: socio.id }, include: { pagos: true, practicaDeportiva: true } })
    const turnos = await prisma.turno.findMany({ where: { usuarioSocioId: socio.id }, include: { pagos: true, cancha: true } })
    const pagos = await prisma.pago.findMany({ where: { usuarioSocioId: socio.id } })

    return NextResponse.json({ existe: true, socio, cuotas, inscripciones, turnos, pagos })
  } catch (err) {
    console.error('Error en /api/debug/socio', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
