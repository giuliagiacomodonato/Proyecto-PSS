import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

async function main() {
  console.log('🌱 Seed: crear socio con cuotas, inscripciones, turnos y pagos (algunos pagados, otros pendientes)')

  // 1) Crear o obtener socio
  const dni = '32323232'
  const socio = await prisma.usuario.upsert({
    where: { dni },
    update: {
      nombre: 'Socio De Prueba Deudas',
      email: 'socio.deudas@test.local'
    },
    create: {
      rol: 'SOCIO',
      nombre: 'Socio De Prueba Deudas',
      dni,
      fechaNacimiento: new Date('1995-01-01'),
      email: 'socio.deudas@test.local',
      telefono: '3000000000',
      contraseña: await hashPassword('Prueba123!'),
      tipoSocio: 'INDIVIDUAL',
      direccion: 'Calle Prueba 123'
    }
  })

  console.log(`✅ Socio creado/obtenido id=${socio.id} dni=${socio.dni}`)

  // 2) Crear una práctica y una cancha de prueba
  const practica = await prisma.practicaDeportiva.upsert({
    where: { nombre: 'Práctica Test Deudas' },
    update: {},
    create: {
      nombre: 'Práctica Test Deudas',
      descripcion: 'Práctica para testing de deudas',
      precio: 5000,
      cupo: 20
    }
  })

  const cancha = await prisma.cancha.upsert({
    where: { nombre: 'Cancha Test Deudas' },
    update: {},
    create: {
      nombre: 'Cancha Test Deudas',
      tipo: 'FUTBOL_5',
      ubicacion: 'Sede Principal',
      precio: 2000
    }
  })

  console.log(`✅ Practica id=${practica.id} cancha id=${cancha.id}`)

  // 3) Crear cuotas: una pagada, dos pendientes
  const today = new Date()
  const month = today.getMonth() + 1 // 1-12
  const year = today.getFullYear()

  // helper to safe-create cuota
  async function safeCreateCuota(usuarioId: number, mes: number, anio: number, monto: number, fechaVenc: Date) {
    try {
      const c = await prisma.cuota.create({
        data: {
          usuarioSocioId: usuarioId,
          mes,
          anio,
          monto,
          fechaVencimiento: fechaVenc
        }
      })
      return c
    } catch (e: any) {
      // Si ya existe, intentar leerla
      const existent = await prisma.cuota.findFirst({ where: { usuarioSocioId: usuarioId, mes, anio } })
      if (existent) return existent
      throw e
    }
  }

  const cuotaPagada = await safeCreateCuota(socio.id, month - 1 <= 0 ? 12 : month - 1, month - 1 <= 0 ? year - 1 : year, 3000, new Date(year, (month - 2 + 12) % 12, 10))
  const cuotaPendiente1 = await safeCreateCuota(socio.id, month, year, 3000, new Date(year, month - 1, 10))
  const cuotaPendiente2 = await safeCreateCuota(socio.id, month + 1 > 12 ? 1 : month + 1, month + 1 > 12 ? year + 1 : year, 3000, new Date(year, month, 10))

  console.log(`✅ Cuotas creadas: pagada id=${cuotaPagada.id}, pendientes ids=${cuotaPendiente1.id},${cuotaPendiente2.id}`)

  // 4) Marcar la primera cuota como pagada creando un Pago vinculado a cuota
  const pagoCuota = await prisma.pago.create({
    data: {
      usuarioSocioId: socio.id,
      tipoPago: 'CUOTA_MENSUAL',
      cuotaId: cuotaPagada.id,
      monto: cuotaPagada.monto,
      metodoPago: 'EFECTIVO',
      estado: 'PAGADO',
      comprobante: `CMP-CUOTA-${Date.now()}`
    }
  })

  console.log(`✅ Pago creado y vinculado a cuota id=${pagoCuota.id}`)

  // 5) Crear inscripcion activa (una pagada, otra pendiente)
  const inscPendiente = await prisma.inscripcion.upsert({
    where: { usuarioSocioId_practicaDeportivaId: { usuarioSocioId: socio.id, practicaDeportivaId: practica.id } },
    update: { activa: true },
    create: {
      usuarioSocioId: socio.id,
      practicaDeportivaId: practica.id,
      activa: true
    }
  })

  console.log(`✅ Inscripcion creada id=${inscPendiente.id}`)

  // Crear un pago marcado como pagado para la inscripcion (simula que pagó la inscripción)
  const pagoInsc = await prisma.pago.create({
    data: {
      usuarioSocioId: socio.id,
      tipoPago: 'PRACTICA_DEPORTIVA',
      inscripcionId: inscPendiente.id,
      monto: practica.precio,
      metodoPago: 'TRANSFERENCIA',
      estado: 'PAGADO',
      comprobante: `CMP-INSC-${Date.now()}`
    }
  })

  console.log(`✅ Pago de inscripción creado id=${pagoInsc.id}`)

  // 6) Crear turnos (una reserva pagada y otra pendiente)
  const turnoPendiente = await prisma.turno.create({
    data: {
      canchaId: cancha.id,
      horaInicio: '18:00',
      fecha: new Date(year, month - 1, 20),
      reservado: true,
      usuarioSocioId: socio.id
    }
  })

  const turnoPagado = await prisma.turno.create({
    data: {
      canchaId: cancha.id,
      horaInicio: '20:00',
      fecha: new Date(year, month - 1, 15),
      reservado: true,
      usuarioSocioId: socio.id
    }
  })

  const pagoTurno = await prisma.pago.create({
    data: {
      usuarioSocioId: socio.id,
      tipoPago: 'RESERVA_CANCHA',
      turnoId: turnoPagado.id,
      monto: cancha.precio,
      metodoPago: 'EFECTIVO',
      estado: 'PAGADO',
      comprobante: `CMP-TURNO-${Date.now()}`
    }
  })

  console.log(`✅ Turnos creados ids=${turnoPendiente.id},${turnoPagado.id} y pago vinculado id=${pagoTurno.id}`)

  console.log('\n🎉 Seed finalizada!')
  console.log(`- Socio DNI: ${socio.dni} (id=${socio.id})`)
  console.log(`- Cuotas: pagada id=${cuotaPagada.id}, pendientes ids=${cuotaPendiente1.id}, ${cuotaPendiente2.id}`)
  console.log(`- Inscripción: id=${inscPendiente.id} (pagada)`)
  console.log(`- Turnos: pendiente id=${turnoPendiente.id}, pagado id=${turnoPagado.id}`)
}

if (require.main === module) {
  main()
    .then(async () => {
      await prisma.$disconnect()
      process.exit(0)
    })
    .catch(async (err) => {
      console.error('Error en seed-deudas:', err)
      await prisma.$disconnect()
      process.exit(1)
    })
}

export default main
