import { prisma } from './prisma'

async function crearReservas() {
  console.log('🌱 Creando canchas, horarios y turnos de prueba...')

  // Upsert canchas
  const canchaFut5 = await prisma.cancha.upsert({
    where: { nombre: 'Fútbol 5 - Cancha 1' },
    update: {},
    create: {
      nombre: 'Fútbol 5 - Cancha 1',
      precio: 2000,
      tipo: 'FUTBOL_5'
      ,ubicacion: 'Sede Central'
    }
  })

  const canchaBasquet = await prisma.cancha.upsert({
    where: { nombre: 'Básquet - Cancha 1' },
    update: {},
    create: {
      nombre: 'Básquet - Cancha 1',
      precio: 1500,
      tipo: 'BASQUET'
      ,ubicacion: 'Sede Central'
    }
  })

  console.log('✅ Canchas OK')

  // Horarios por cancha: 08:00 - 21:00 (bloques de 1 hora)
  const horas = Array.from({ length: 13 }, (_, i) => i + 8) // 8..20

  // Limpiar horarios anteriores y crear nuevos
  await prisma.horarioCancha.deleteMany({ where: { canchaId: canchaFut5.id } })
  await prisma.horarioCancha.deleteMany({ where: { canchaId: canchaBasquet.id } })

  const horariosFut5 = horas.map((h) => ({ canchaId: canchaFut5.id, horaInicio: `${String(h).padStart(2,'0')}:00`, horaFin: `${String(h + 1).padStart(2,'0')}:00` }))
  const horariosBasquet = horas.map((h) => ({ canchaId: canchaBasquet.id, horaInicio: `${String(h).padStart(2,'0')}:00`, horaFin: `${String(h + 1).padStart(2,'0')}:00` }))

  await prisma.horarioCancha.createMany({ data: horariosFut5 })
  await prisma.horarioCancha.createMany({ data: horariosBasquet })

  console.log('✅ Horarios creados')

  // Fecha de ejemplo para las reservas (ajustar si se desea)
  const fechaStr = '2025-11-20'
  const fecha = new Date(fechaStr + 'T00:00:00')

  // Buscar socios ya seed-eados por DNI
  const socio1 = await prisma.usuario.findUnique({ where: { dni: '45678901' } })
  const socio2 = await prisma.usuario.findUnique({ where: { dni: '56789012' } })
  const socio3 = await prisma.usuario.findUnique({ where: { dni: '67890123' } })

  const reservedHoursForFut5 = {
    '09:00': socio1?.id,
    '12:00': socio2?.id,
    '18:00': socio3?.id
  }

  // Eliminar turnos previos para esa fecha y canchas
  await prisma.turno.deleteMany({ where: { fecha: fecha } })

  // Crear turnos para cada horario
  const crearTurnosParaCancha = async (canchaId: number, horarios: { horaInicio: string }[], reservedMap: Record<string, number | undefined>) => {
    for (const h of horarios) {
      const usuarioId = reservedMap[h.horaInicio]
      await prisma.turno.create({ data: { canchaId, fecha: fecha, horaInicio: h.horaInicio, reservado: Boolean(usuarioId), usuarioSocioId: usuarioId ?? null } })
    }
  }

  await crearTurnosParaCancha(canchaFut5.id, horariosFut5, reservedHoursForFut5)
  await crearTurnosParaCancha(canchaBasquet.id, horariosBasquet, {})

  console.log(`✅ Turnos creados para fecha ${fechaStr}`)
  console.log('ℹ️ Reservas de ejemplo: 09:00, 12:00, 18:00 en Fútbol 5 - Cancha 1')

  await prisma.$disconnect()
}

if (require.main === module) {
  crearReservas()
    .then(() => {
      console.log('\n🎉 Seed de reservas completado')
      process.exit(0)
    })
    .catch(async (e) => {
      console.error('❌ Error en seed-reservas:', e)
      await prisma.$disconnect()
      process.exit(1)
    })
}

export { crearReservas }
