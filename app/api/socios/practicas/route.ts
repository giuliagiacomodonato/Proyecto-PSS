import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const usuarioSocioId = searchParams.get('usuarioSocioId')

    if (!usuarioSocioId) {
      return NextResponse.json(
        { message: 'usuarioSocioId es requerido' },
        { status: 400 }
      )
    }

    // Obtener las inscripciones activas del socio con información de la práctica
    const inscripciones = await prisma.inscripcion.findMany({
      where: {
        usuarioSocioId: parseInt(usuarioSocioId),
        activa: true
      },
      include: {
        practicaDeportiva: {
          select: {
            id: true,
            nombre: true,
            precio: true,
            descripcion: true
          }
        }
      }
    })

    // Formatear las prácticas
    const practicas = inscripciones.map(inscripcion => ({
      id: inscripcion.practicaDeportiva.id,
      nombre: inscripcion.practicaDeportiva.nombre,
      precio: inscripcion.practicaDeportiva.precio,
      descripcion: inscripcion.practicaDeportiva.descripcion
    }))

    // Calcular el total
    const total = practicas.reduce((sum, practica) => sum + practica.precio, 0)

    return NextResponse.json({
      practicas,
      total
    })
  } catch (error) {
    console.error('Error al obtener prácticas inscritas:', error)
    return NextResponse.json(
      { message: 'Error al obtener las prácticas inscritas' },
      { status: 500 }
    )
  }
}
