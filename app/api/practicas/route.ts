import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, descripcion, cupo, precio, horarios } = body

    // Validaciones del lado del servidor
    if (!nombre || typeof nombre !== 'string' || !/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
      return NextResponse.json(
        { error: 'El nombre es obligatorio y solo debe contener caracteres alfanuméricos' },
        { status: 400 }
      )
    }

    if (descripcion && (typeof descripcion !== 'string' || descripcion.length > 150)) {
      return NextResponse.json(
        { error: 'La descripción no debe exceder 150 caracteres' },
        { status: 400 }
      )
    }

    if (!cupo || typeof cupo !== 'number' || cupo <= 0) {
      return NextResponse.json(
        { error: 'El cupo máximo es obligatorio y debe ser un número positivo' },
        { status: 400 }
      )
    }

    if (!precio || typeof precio !== 'number' || precio <= 0) {
      return NextResponse.json(
        { error: 'El precio es obligatorio y debe ser un número positivo' },
        { status: 400 }
      )
    }

    if (!horarios || !Array.isArray(horarios) || horarios.length === 0) {
      return NextResponse.json(
        { error: 'Debe seleccionar al menos un horario' },
        { status: 400 }
      )
    }

    // Validar formato de horarios
    for (const horario of horarios) {
      if (!horario.dia || !horario.horaInicio || !horario.horaFin) {
        return NextResponse.json(
          { error: 'Todos los horarios deben tener día, hora de inicio y hora de fin' },
          { status: 400 }
        )
      }

      // Validar formato de hora (HH:MM)
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(horario.horaInicio) || !timeRegex.test(horario.horaFin)) {
        return NextResponse.json(
          { error: 'El formato de hora debe ser HH:MM' },
          { status: 400 }
        )
      }

      // Validar que hora inicio sea menor que hora fin
      const [horaInicioH, horaInicioM] = horario.horaInicio.split(':').map(Number)
      const [horaFinH, horaFinM] = horario.horaFin.split(':').map(Number)
      const inicioMinutos = horaInicioH * 60 + horaInicioM
      const finMinutos = horaFinH * 60 + horaFinM

      if (inicioMinutos >= finMinutos) {
        return NextResponse.json(
          { error: 'La hora de inicio debe ser menor que la hora de fin' },
          { status: 400 }
        )
      }
    }

    // Validar que no haya superposición de horarios en el mismo día
    for (let i = 0; i < horarios.length; i++) {
      for (let j = i + 1; j < horarios.length; j++) {
        const h1 = horarios[i]
        const h2 = horarios[j]

        if (h1.dia === h2.dia) {
          const [h1InicioH, h1InicioM] = h1.horaInicio.split(':').map(Number)
          const [h1FinH, h1FinM] = h1.horaFin.split(':').map(Number)
          const [h2InicioH, h2InicioM] = h2.horaInicio.split(':').map(Number)
          const [h2FinH, h2FinM] = h2.horaFin.split(':').map(Number)

          const h1Inicio = h1InicioH * 60 + h1InicioM
          const h1Fin = h1FinH * 60 + h1FinM
          const h2Inicio = h2InicioH * 60 + h2InicioM
          const h2Fin = h2FinH * 60 + h2FinM

          if ((h1Inicio >= h2Inicio && h1Inicio < h2Fin) ||
              (h1Fin > h2Inicio && h1Fin <= h2Fin) ||
              (h1Inicio <= h2Inicio && h1Fin >= h2Fin)) {
            return NextResponse.json(
              { error: `Los horarios del día ${h1.dia} se superponen: ${h1.horaInicio}-${h1.horaFin} y ${h2.horaInicio}-${h2.horaFin}` },
              { status: 400 }
            )
          }
        }
      }
    }

    // Verificar que no exista una práctica con el mismo nombre
    const practicaExistente = await prisma.practicaDeportiva.findUnique({
      where: { nombre }
    })

    if (practicaExistente) {
      return NextResponse.json(
        { error: 'Ya existe una práctica deportiva con ese nombre' },
        { status: 400 }
      )
    }

    // Crear la práctica deportiva con sus horarios
    const nuevaPractica = await prisma.practicaDeportiva.create({
      data: {
        nombre,
        descripcion: descripcion || '',
        cupo,
        precio,
        horarios: {
          create: horarios.map((horario: any) => ({
            dia: horario.dia,
            horaInicio: horario.horaInicio,
            horaFin: horario.horaFin
          }))
        }
      },
      include: {
        horarios: true
      }
    })

    return NextResponse.json(
      {
        message: 'Práctica deportiva registrada correctamente',
        practica: nuevaPractica
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Error al crear práctica deportiva:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const practicas = await prisma.practicaDeportiva.findMany({
      include: {
        horarios: true,
        entrenadores: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    })

    return NextResponse.json(practicas)
  } catch (error) {
    console.error('Error al obtener prácticas deportivas:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Detectar si es actualización de precios en bulk o actualización completa
    if (body.actualizaciones && Array.isArray(body.actualizaciones)) {
      // Actualización en bulk de precios
      const actualizaciones = body.actualizaciones

      if (!Array.isArray(actualizaciones) || actualizaciones.length === 0) {
        return NextResponse.json(
          { error: 'Debe proporcionar al menos una actualización' },
          { status: 400 }
        )
      }

      // Validar cada actualización
      for (const act of actualizaciones) {
        if (!act.id || typeof act.id !== 'number') {
          return NextResponse.json(
            { error: 'Cada actualización debe tener un ID válido' },
            { status: 400 }
          )
        }
        if (act.precio === undefined || typeof act.precio !== 'number' || act.precio <= 0) {
          return NextResponse.json(
            { error: `El precio para la práctica ${act.id} debe ser un número positivo` },
            { status: 400 }
          )
        }
      }

      // Actualizar todos los precios
      const resultados = await Promise.all(
        actualizaciones.map(act =>
          prisma.practicaDeportiva.update({
            where: { id: act.id },
            data: { precio: act.precio }
          })
        )
      )

      return NextResponse.json(
        {
          message: 'Precios actualizados correctamente',
          practicas: resultados
        },
        { status: 200 }
      )
    }

    // Actualización completa de una práctica
    const { id, nombre, descripcion, cupo, precio, horarios } = body

    // Validar que se proporcione el ID
    if (!id || typeof id !== 'number') {
      return NextResponse.json(
        { error: 'El ID de la práctica es obligatorio' },
        { status: 400 }
      )
    }

    // Verificar que la práctica existe
    const practicaExistente = await prisma.practicaDeportiva.findUnique({
      where: { id },
      include: { horarios: true }
    })

    if (!practicaExistente) {
      return NextResponse.json(
        { error: 'La práctica deportiva no existe' },
        { status: 404 }
      )
    }

    // Validaciones del lado del servidor
    if (!nombre || typeof nombre !== 'string' || !/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
      return NextResponse.json(
        { error: 'El nombre es obligatorio y solo debe contener caracteres alfanuméricos' },
        { status: 400 }
      )
    }

    if (descripcion && (typeof descripcion !== 'string' || descripcion.length > 150)) {
      return NextResponse.json(
        { error: 'La descripción no debe exceder 150 caracteres' },
        { status: 400 }
      )
    }

    if (!cupo || typeof cupo !== 'number' || cupo <= 0) {
      return NextResponse.json(
        { error: 'El cupo máximo es obligatorio y debe ser un número positivo' },
        { status: 400 }
      )
    }

    if (!precio || typeof precio !== 'number' || precio <= 0) {
      return NextResponse.json(
        { error: 'El precio es obligatorio y debe ser un número positivo' },
        { status: 400 }
      )
    }

    if (!horarios || !Array.isArray(horarios) || horarios.length === 0) {
      return NextResponse.json(
        { error: 'Debe seleccionar al menos un horario' },
        { status: 400 }
      )
    }

    // Validar formato de horarios
    for (const horario of horarios) {
      if (!horario.dia || !horario.horaInicio || !horario.horaFin) {
        return NextResponse.json(
          { error: 'Todos los horarios deben tener día, hora de inicio y hora de fin' },
          { status: 400 }
        )
      }

      // Validar formato de hora (HH:MM)
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(horario.horaInicio) || !timeRegex.test(horario.horaFin)) {
        return NextResponse.json(
          { error: 'El formato de hora debe ser HH:MM' },
          { status: 400 }
        )
      }

      // Validar que hora inicio sea menor que hora fin
      const [horaInicioH, horaInicioM] = horario.horaInicio.split(':').map(Number)
      const [horaFinH, horaFinM] = horario.horaFin.split(':').map(Number)
      const inicioMinutos = horaInicioH * 60 + horaInicioM
      const finMinutos = horaFinH * 60 + horaFinM

      if (inicioMinutos >= finMinutos) {
        return NextResponse.json(
          { error: 'La hora de inicio debe ser menor que la hora de fin' },
          { status: 400 }
        )
      }
    }

    // Validar que no haya superposición de horarios en el mismo día
    for (let i = 0; i < horarios.length; i++) {
      for (let j = i + 1; j < horarios.length; j++) {
        const h1 = horarios[i]
        const h2 = horarios[j]

        if (h1.dia === h2.dia) {
          const [h1InicioH, h1InicioM] = h1.horaInicio.split(':').map(Number)
          const [h1FinH, h1FinM] = h1.horaFin.split(':').map(Number)
          const [h2InicioH, h2InicioM] = h2.horaInicio.split(':').map(Number)
          const [h2FinH, h2FinM] = h2.horaFin.split(':').map(Number)

          const h1Inicio = h1InicioH * 60 + h1InicioM
          const h1Fin = h1FinH * 60 + h1FinM
          const h2Inicio = h2InicioH * 60 + h2InicioM
          const h2Fin = h2FinH * 60 + h2FinM

          if ((h1Inicio >= h2Inicio && h1Inicio < h2Fin) ||
              (h1Fin > h2Inicio && h1Fin <= h2Fin) ||
              (h1Inicio <= h2Inicio && h1Fin >= h2Fin)) {
            return NextResponse.json(
              { error: `Los horarios del día ${h1.dia} se superponen: ${h1.horaInicio}-${h1.horaFin} y ${h2.horaInicio}-${h2.horaFin}` },
              { status: 400 }
            )
          }
        }
      }
    }

    // Verificar que no exista otra práctica con el mismo nombre (excepto la actual)
    if (nombre !== practicaExistente.nombre) {
      const practicaConMismoNombre = await prisma.practicaDeportiva.findUnique({
        where: { nombre }
      })

      if (practicaConMismoNombre) {
        return NextResponse.json(
          { error: 'Ya existe una práctica deportiva con ese nombre' },
          { status: 400 }
        )
      }
    }

    // Actualizar la práctica deportiva
    // Primero eliminamos los horarios antiguos
    await prisma.horario.deleteMany({
      where: { practicaDeportivaId: id }
    })

    // Luego actualizamos la práctica y creamos los nuevos horarios
    const practicaActualizada = await prisma.practicaDeportiva.update({
      where: { id },
      data: {
        nombre,
        descripcion: descripcion || '',
        cupo,
        precio,
        horarios: {
          create: horarios.map((horario: any) => ({
            dia: horario.dia,
            horaInicio: horario.horaInicio,
            horaFin: horario.horaFin
          }))
        }
      },
      include: {
        horarios: true
      }
    })

    return NextResponse.json(
      {
        message: 'Práctica deportiva modificada exitosamente',
        practica: practicaActualizada
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Error al modificar práctica deportiva:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}