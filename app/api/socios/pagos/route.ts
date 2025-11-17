import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams
    const usuarioIdParam = searchParams.get('usuarioId')
    if (!usuarioIdParam) return NextResponse.json({ error: 'usuarioId requerido' }, { status: 400 })
    const usuarioId = parseInt(usuarioIdParam, 10)
    if (isNaN(usuarioId)) return NextResponse.json({ error: 'usuarioId inválido' }, { status: 400 })

    const pagos = await prisma.pago.findMany({
      where: { usuarioSocioId: usuarioId },
      include: { usuarioSocio: true },
      orderBy: { fechaPago: 'desc' },
    })

    return NextResponse.json({ pagos })
  } catch (err) {
    console.error('Error en GET /api/socios/pagos:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
