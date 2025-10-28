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

    // Obtener el socio
    const socio = await prisma.usuario.findUnique({
      where: { id: parseInt(usuarioSocioId) },
      select: {
        id: true,
        tipoSocio: true,
        planFamiliarId: true,
        familiarId: true
      }
    })

    if (!socio) {
      return NextResponse.json(
        { message: 'Socio no encontrado' },
        { status: 404 }
      )
    }

    // Obtener el precio base de la cuota desde la configuración
    const configResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/config/cuota`)
    const configData = await configResponse.json()
    const precioBase = configData.cuota?.precio || 10000

    let precioTotal = precioBase
    let cantidadFamiliares = 1
    let descuento = 0

    // Si es familiar, calcular el total con descuento
    if (socio.tipoSocio === 'FAMILIAR' && socio.planFamiliarId) {
      // Obtener todos los familiares del mismo plan
      const familiares = await prisma.usuario.findMany({
        where: {
          planFamiliarId: socio.planFamiliarId,
          rol: 'SOCIO'
        },
        select: { id: true }
      })

      cantidadFamiliares = familiares.length
      const precioOriginal = precioBase * cantidadFamiliares
      descuento = Math.round(precioOriginal * 0.30) // 30% de descuento
      precioTotal = precioOriginal - descuento
    }

    return NextResponse.json({
      cuota: {
        precio: precioTotal,
        precioBase: precioBase,
        cantidadFamiliares,
        descuento,
        precioOriginal: precioBase * cantidadFamiliares
      }
    })
  } catch (error) {
    console.error('Error al obtener cuota:', error)
    return NextResponse.json(
      { message: 'Error al obtener la cuota' },
      { status: 500 }
    )
  }
}
