import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number(searchParams.get('limit') || 50)
    const offset = Number(searchParams.get('offset') || 0)
    const tipo = searchParams.get('tipo') || undefined
    const status = searchParams.get('status') || undefined

    const where: any = {}
    if (tipo) where.tipo = tipo
    if (status) where.status = status

    const logs = await prisma.emailLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        toAddress: true,
        subject: true,
        messageId: true,
        previewUrl: true,
        status: true,
        tipo: true,
        error: true,
        createdAt: true,
      },
    })

    const total = await prisma.emailLog.count({ where })

    return NextResponse.json({ logs, total, limit, offset })
  } catch (error) {
    console.error('Error al listar email logs:', error)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}
