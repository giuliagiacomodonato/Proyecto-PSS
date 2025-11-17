import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple admin check using the same base64 token used by login
async function checkAdminRole(request: NextRequest) {
  const auth = request.headers.get('authorization') || ''
  if (!auth.startsWith('Bearer ')) return { ok: false, status: 401, message: 'Unauthorized' }
  const token = auth.replace('Bearer ', '')
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const parts = decoded.split(':')
    const userId = Number(parts[0])
    if (!userId) return { ok: false, status: 401, message: 'Unauthorized' }
    const usuario = await prisma.usuario.findUnique({ where: { id: userId } })
    if (!usuario) return { ok: false, status: 401, message: 'Unauthorized' }
    if (usuario.rol !== 'ADMIN' && usuario.rol !== 'SUPER_ADMIN') {
      return { ok: false, status: 403, message: 'Forbidden' }
    }
    return { ok: true, usuario }
  } catch (e) {
    return { ok: false, status: 401, message: 'Unauthorized' }
  }
}

export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkAdminRole(request)
    if (!authCheck.ok) return NextResponse.json({ message: authCheck.message }, { status: authCheck.status })

    const { searchParams } = new URL(request.url)
    const canchaIdParam = searchParams.get('canchaId')
    if (!canchaIdParam) return NextResponse.json({ horarios: [] })
    const canchaId = parseInt(canchaIdParam)
    if (Number.isNaN(canchaId)) return NextResponse.json({ horarios: [] })

    const horarios = await prisma.horarioCancha.findMany({ where: { canchaId }, orderBy: { horaInicio: 'asc' } })

    return NextResponse.json({ horarios })
  } catch (error) {
    console.error('Error en GET /api/horarios:', error)
    return NextResponse.json({ message: 'Error interno' }, { status: 500 })
  }
}
