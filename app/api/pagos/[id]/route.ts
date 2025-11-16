import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const pagoId = parseInt(id, 10)
    if (isNaN(pagoId)) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })

    const pago = await prisma.pago.findUnique({
      where: { id: pagoId },
      include: {
        usuarioSocio: true,
        cuota: true,
      },
    })

    if (!pago) return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })

    const usuarioIdHeader = request.headers.get('x-usuario-id')
    if (usuarioIdHeader) {
      const usuarioId = parseInt(usuarioIdHeader, 10)
      if (pago.usuarioSocioId !== usuarioId) {
        return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
      }
    }

    return NextResponse.json({ pago })
  } catch (err) {
    console.error('Error en GET /api/pagos/[id]:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
