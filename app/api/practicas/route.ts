import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { enviarCorreoBajaPractica } from '@/lib/email'

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
    // Manejar errores de conexión de Prisma (p. ej. servidor cerró la conexión)
    const errAny = error as any
    if (errAny && (errAny.code === 'P1017' || errAny.message?.includes('Server has closed the connection'))) {
      return NextResponse.json({ error: 'Conexión a la base de datos cerrada. Intente nuevamente.' }, { status: 503 })
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// NUEVO: handler PUT para actualizaciones parciales (permite actualizar solo precio)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, precio, nombre, descripcion, cupo, horarios } = body

    if (!id) {
      return NextResponse.json({ error: 'El id de la práctica es requerido' }, { status: 400 })
    }

    // Verificar que la práctica exista
    const practicaExistente = await prisma.practicaDeportiva.findUnique({ where: { id: Number(id) } })
    if (!practicaExistente) {
      return NextResponse.json({ error: 'Práctica no encontrada' }, { status: 404 })
    }

    const dataToUpdate: any = {}

    // Si se envía precio, validar y setear
    if (precio !== undefined) {
      const precioNum = Number(precio)
      if (!isFinite(precioNum) || precioNum <= 0) {
        return NextResponse.json({ error: 'Precio inválido. Debe ser un número positivo.' }, { status: 400 })
      }
      dataToUpdate.precio = Math.round(precioNum)
    }

    // Si se envía nombre, validar y setear
    if (nombre !== undefined) {
      if (!nombre || typeof nombre !== 'string' || !/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
        return NextResponse.json(
          { error: 'El nombre es obligatorio y solo debe contener caracteres alfanuméricos' },
          { status: 400 }
        )
      }
      dataToUpdate.nombre = nombre.trim()
    }

    // Si se envía descripcion
    if (descripcion !== undefined) {
      if (descripcion && (typeof descripcion !== 'string' || descripcion.length > 150)) {
        return NextResponse.json(
          { error: 'La descripción no debe exceder 150 caracteres' },
          { status: 400 }
        )
      }
      dataToUpdate.descripcion = descripcion ?? null
    }

    // Si se envía cupo
    if (cupo !== undefined) {
      const cupoNum = Number(cupo)
      if (!Number.isInteger(cupoNum) || cupoNum <= 0) {
        return NextResponse.json({ error: 'Cupo inválido. Debe ser entero y mayor a 0' }, { status: 400 })
      }
      dataToUpdate.cupo = cupoNum
    }

    // Si se envían horarios, validar formato mínimo (array de objetos con dia,horaInicio,horaFin)
    if (horarios !== undefined) {
      if (!Array.isArray(horarios)) {
        return NextResponse.json({ error: 'Horarios inválidos' }, { status: 400 })
      }
      // Para simplificar, sobrescribimos horarios: eliminar existentes y crear nuevas entradas
      // (si tu modelo los maneja de otra forma adapta esta parte)
    }

    // Si no hay campos para actualizar
    if (Object.keys(dataToUpdate).length === 0 && horarios === undefined) {
      return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    }

    // Actualizar la práctica
    let updatedPractica = await prisma.practicaDeportiva.update({
      where: { id: Number(id) },
      data: dataToUpdate
    })

    // Manejo opcional de horarios: si se envían, reemplazar horarios asociados
    if (horarios !== undefined) {
      // eliminar horarios anteriores
      await prisma.horario.deleteMany({ where: { practicaDeportivaId: Number(id) } })
      // crear los nuevos (suponer que cada horario tiene dia,horaInicio,horaFin)
      const horariosToCreate = horarios
        .filter((h: any) => h && h.dia && h.horaInicio && h.horaFin)
        .map((h: any) => ({ ...h, practicaDeportivaId: Number(id) }))

      if (horariosToCreate.length > 0) {
        await prisma.horario.createMany({ data: horariosToCreate })
      }

      // volver a leer la práctica con horarios
      updatedPractica = await prisma.practicaDeportiva.findUnique({
        where: { id: Number(id) },
        include: { horarios: true }
      }) as any
    }

    return NextResponse.json({ message: 'Práctica actualizada', practica: updatedPractica })
  } catch (error: any) {
    console.error('Error al actualizar práctica:', error)
    return NextResponse.json({ error: error?.message || 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const idParam = searchParams.get('id')

    if (!idParam) {
      return NextResponse.json({ error: 'Se requiere el ID de la práctica' }, { status: 400 })
    }

    const id = Number(idParam)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    // Consultar la práctica con entrenadores e inscripciones
    const practica = await prisma.practicaDeportiva.findUnique({
      where: { id },
      include: {
        entrenadores: { select: { id: true, nombre: true } },
        inscripciones: { include: { usuarioSocio: { select: { id: true, nombre: true, email: true, dni: true } } } }
      }
    })

    if (!practica) {
      return NextResponse.json({ error: 'La práctica no existe' }, { status: 404 })
    }

    // Si tiene entrenadores asociados, no permitir la baja
    if (practica.entrenadores && practica.entrenadores.length > 0) {
      // Devolver 409 Conflict para indicar que la operación no es aplicable
      return NextResponse.json(
        { error: 'No se puede eliminar la práctica porque tiene un entrenador asociado. Por favor, eliminar a los entrenadores asociados previamente o cambiarlos a otras prácticas.' },
        { status: 409 }
      )
    }

    // Número de inscripciones a procesar
    const cantidadInscripciones = practica.inscripciones ? practica.inscripciones.length : 0

    // Ejecutar en transacción: marcar inscripciones como inactivas, eliminar horarios y la práctica
    await prisma.$transaction(async (tx) => {
      if (cantidadInscripciones > 0) {
        await tx.inscripcion.updateMany({
          where: { practicaDeportivaId: id },
          data: { activa: false }
        })
      }

      // Eliminar horarios asociados
      await tx.horario.deleteMany({ where: { practicaDeportivaId: id } })

      // Finalmente eliminar la práctica
      await tx.practicaDeportiva.delete({ where: { id } })
    })

    // Notificar por email a los socios que estaban inscriptos (si tienen email)
    if (practica.inscripciones && practica.inscripciones.length > 0) {
      for (const ins of practica.inscripciones) {
        try {
          const usuario = (ins as any).usuarioSocio
          if (usuario && usuario.email) {
            // No await para no bloquear la respuesta; registrar logs internamente.
            enviarCorreoBajaPractica({ email: usuario.email, nombre: usuario.nombre ?? 'Socio', dni: usuario.dni ?? '', practicaNombre: practica.nombre })
          }
        } catch (e) {
          console.error('Error al iniciar notificación por email para inscripcion:', e)
        }
      }
    }

    return NextResponse.json({ message: 'Práctica eliminada exitosamente', procesadas: cantidadInscripciones }, { status: 200 })
  } catch (error) {
    console.error('Error al eliminar práctica deportiva:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}