import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Obtener el DNI del entrenador desde headers o query params
    const entrenadorDni = request.headers.get("x-entrenador-dni")

    if (!entrenadorDni) {
      return NextResponse.json(
        { error: "DNI del entrenador requerido" },
        { status: 400 }
      )
    }

    // Obtener el entrenador y su práctica deportiva
    const entrenador = await prisma.usuario.findUnique({
      where: { dni: entrenadorDni },
      include: {
        practicaDeportiva: true,
      },
    })

    if (!entrenador || !entrenador.practicaDeportivaId) {
      return NextResponse.json(
        { error: "Entrenador no encontrado o sin práctica asignada" },
        { status: 404 }
      )
    }

    // Obtener todos los alumnos inscritos en la práctica del entrenador
    const inscripciones = await prisma.inscripcion.findMany({
      where: {
        practicaDeportivaId: entrenador.practicaDeportivaId,
        activa: true,
      },
      include: {
        usuarioSocio: true,
        asistencias: true, // Traer todas las asistencias (presentes y ausentes)
      },
    })

    // Si no hay alumnos inscriptos
    if (inscripciones.length === 0) {
      return NextResponse.json({
        alumnos: [],
        hayAlumnos: false,
      })
    }

    // Obtener todas las fechas únicas de clases para esta práctica
    const todasLasAsistencias = await prisma.asistencia.findMany({
      where: {
        practicaDeportivaId: entrenador.practicaDeportivaId,
      },
      select: {
        fecha: true,
      },
      distinct: ["fecha"],
    })

    const totalClases = todasLasAsistencias.length

    // Calcular porcentaje de asistencia para cada alumno
    const alumnos = inscripciones
      .map((inscripcion) => {
        // Contar solo asistencias donde presente es true
        const asistenciasPresentes = inscripcion.asistencias.filter(
          (a) => a.presente === true
        ).length

        const porcentajeAsistencia =
          totalClases > 0
            ? Math.round((asistenciasPresentes * 100) / totalClases)
            : 0

        return {
          id: inscripcion.usuarioSocio.id,
          nombre: inscripcion.usuarioSocio.nombre,
          dni: inscripcion.usuarioSocio.dni,
          asistencias: asistenciasPresentes,
          totalClases: totalClases,
          porcentajeAsistencia: porcentajeAsistencia,
        }
      })
      // Ordenar alfabéticamente por nombre
      .sort((a, b) => a.nombre.localeCompare(b.nombre))

    return NextResponse.json({
      alumnos,
      hayAlumnos: true,
    })
  } catch (error) {
    console.error("Error en GET /api/reportes/alumnos:", error)
    return NextResponse.json(
      { error: "Error al obtener los reportes" },
      { status: 500 }
    )
  }
}
