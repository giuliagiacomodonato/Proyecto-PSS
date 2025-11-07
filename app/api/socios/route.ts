import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { socio, familiares } = body;

    // Función para calcular la edad
    const calcularEdad = (fechaNacimiento: Date): number => {
      const hoy = new Date();
      const nacimiento = new Date(fechaNacimiento);
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const mes = hoy.getMonth() - nacimiento.getMonth();
      if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
      }
      return edad;
    };

    // Validar que el usuario sea administrador (esto se puede mejorar con autenticación)
    // Por ahora, asumimos que si llega aquí es porque es admin
    
    // Validar datos del socio principal
    if (!socio.nombre || !socio.dni || !socio.email || !socio.telefono || !socio.contraseña) {
      return NextResponse.json(
        { message: 'Faltan campos obligatorios del socio principal' },
        { status: 400 }
      );
    }

    // Validar edad del socio principal (mínimo 12 años)
    const edadSocioPrincipal = calcularEdad(new Date(socio.fechaNacimiento));
    if (edadSocioPrincipal < 12) {
      return NextResponse.json(
        { message: 'El socio debe tener al menos 12 años para crear una cuenta' },
        { status: 400 }
      );
    }

    // Verificar que el DNI no esté en uso
    const dniExistente = await prisma.usuario.findFirst({
      where: { dni: socio.dni }
    });

    if (dniExistente) {
      return NextResponse.json(
        { message: 'El DNI ya está registrado' },
        { status: 400 }
      );
    }

    // Verificar que el email no esté en uso (solo para usuarios mayores de 12 años)
    const emailExistente = await prisma.usuario.findFirst({
      where: { 
        email: socio.email,
        esMenorDe12: false // Solo verificar en usuarios que NO son menores
      }
    });

    if (emailExistente) {
      return NextResponse.json(
        { message: 'El email ya está registrado' },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(socio.contraseña, 10);

    // Generar ID único para plan familiar si es necesario
    const planFamiliarId = socio.tipoSocio === 'FAMILIAR' 
      ? `PF-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
      : null;

    console.log('🔑 Tipo de socio:', socio.tipoSocio);
    console.log('🔑 Plan Familiar ID generado:', planFamiliarId);

    if (socio.tipoSocio === 'FAMILIAR' && !planFamiliarId) {
      console.error('❌ ERROR: No se generó el planFamiliarId para un socio FAMILIAR');
      return NextResponse.json(
        { message: 'Error al generar el ID del plan familiar' },
        { status: 500 }
      );
    }

    // Crear el socio principal
    const nuevoSocio = await prisma.usuario.create({
      data: {
        rol: 'SOCIO',
        nombre: socio.nombre,
        dni: socio.dni,
        fechaNacimiento: new Date(socio.fechaNacimiento),
        email: socio.email,
        telefono: socio.telefono,
        direccion: socio.direccion,
        contraseña: hashedPassword,
        tipoSocio: socio.tipoSocio,
        planFamiliarId: planFamiliarId,
        esMenorDe12: false, // El socio principal siempre es mayor de 12
        fechaAlta: new Date()
      }
    });

    console.log('✅ Socio principal creado:', {
      id: nuevoSocio.id,
      nombre: nuevoSocio.nombre,
      tipoSocio: nuevoSocio.tipoSocio,
      planFamiliarId: nuevoSocio.planFamiliarId
    });

    // Si es plan familiar, crear los familiares
    if (socio.tipoSocio === 'FAMILIAR' && familiares && familiares.length > 0) {
      console.log(`👨‍👩‍👧‍👦 Procesando ${familiares.length} familiares para el plan ${nuevoSocio.planFamiliarId}`);
      
      // Verificar que se hayan agregado al menos 3 familiares (4 en total con el socio principal)
      if (familiares.length < 3) {
        return NextResponse.json(
          { message: 'El plan familiar requiere al menos 3 integrantes adicionales (4 en total)' },
          { status: 400 }
        );
      }

      // Validar y crear cada familiar
      let familiarCount = 0;
      for (const familiar of familiares) {
        familiarCount++;
        
        // Calcular edad del familiar
        const edadFamiliar = calcularEdad(new Date(familiar.fechaNacimiento));
        const esMenor = edadFamiliar < 12;

        console.log(`   ${familiarCount}. Procesando familiar: ${familiar.nombre} (Edad: ${edadFamiliar} años, Menor: ${esMenor})`);


        // Si el familiar proviene de un socio existente (marcado por el frontend con "existing" o trae un id),
        // entonces actualizamos ese registro para convertirlo a plan familiar y asociarlo al nuevo plan.
        if ((familiar as any).existing || (familiar as any).id) {
          const existingId = (familiar as any).id;
          console.log(`   Procesando socio existente (ID: ${existingId}) como familiar`);

          // Buscar el socio existente por id
          const socioParaConvertir = await prisma.usuario.findFirst({ where: { id: existingId } });

          if (!socioParaConvertir) {
            return NextResponse.json(
              { message: `No se encontró el socio existente con id ${existingId}` },
              { status: 400 }
            );
          }

          // Si ya pertenece a un plan familiar, rechazar
          if (socioParaConvertir.tipoSocio === 'FAMILIAR') {
            return NextResponse.json(
              { message: `El socio con DNI ${socioParaConvertir.dni} ya pertenece a un plan familiar` },
              { status: 400 }
            );
          }

          // Actualizar el socio existente para convertirlo a FAMILIAR y asociarlo al nuevo plan
          await prisma.usuario.update({
            where: { id: existingId },
            data: {
              tipoSocio: 'FAMILIAR',
              planFamiliarId: nuevoSocio.planFamiliarId,
              familiarId: nuevoSocio.id
            }
          });

          console.log(`   ✅ Socio existente (ID: ${existingId}) convertido y asociado al plan ${nuevoSocio.planFamiliarId}`);
          continue; // pasar al siguiente familiar
        }

        // Verificar que el DNI del familiar nuevo no esté en uso
        const dniFamiliarExistente = await prisma.usuario.findFirst({
          where: { dni: familiar.dni }
        });

        if (dniFamiliarExistente) {
          return NextResponse.json(
            { message: `El DNI ${familiar.dni} ya está registrado` },
            { status: 400 }
          );
        }

        // Si NO es menor, verificar que el email no esté en uso
        if (!esMenor) {
          const emailFamiliarExistente = await prisma.usuario.findFirst({
            where: { 
              email: familiar.email,
              esMenorDe12: false // Solo verificar en usuarios que NO son menores
            }
          });

          if (emailFamiliarExistente) {
            return NextResponse.json(
              { message: `El email ${familiar.email} ya está registrado` },
              { status: 400 }
            );
          }
        }

        // Preparar datos del familiar
        const familiarData: any = {
          rol: 'SOCIO',
          nombre: familiar.nombre,
          dni: familiar.dni,
          fechaNacimiento: new Date(familiar.fechaNacimiento),
          email: esMenor ? socio.email : familiar.email, // Si es menor, usar email del cabeza de familia
          telefono: esMenor ? socio.telefono : familiar.telefono, // Si es menor, usar teléfono del cabeza de familia
          tipoSocio: 'FAMILIAR',
          planFamiliarId: nuevoSocio.planFamiliarId, // Mismo ID del plan familiar
          familiarId: nuevoSocio.id, // Referencia al socio principal
          esMenorDe12: esMenor,
          fechaAlta: new Date()
        };

        // Solo agregar contraseña si NO es menor
        if (!esMenor && familiar.contraseña) {
          familiarData.contraseña = await bcrypt.hash(familiar.contraseña, 10);
        } else {
          familiarData.contraseña = null; // Los menores no tienen contraseña
        }

        console.log(`   ${familiarCount}. Creando familiar: ${familiar.nombre} con planFamiliarId: ${nuevoSocio.planFamiliarId} (esMenor: ${esMenor})`);

        // Crear el familiar
        const nuevoFamiliar = await prisma.usuario.create({
          data: familiarData
        });

        console.log(`   ✅ Familiar ${familiarCount} creado: ${nuevoFamiliar.nombre} (ID: ${nuevoFamiliar.id}, planFamiliarId: ${nuevoFamiliar.planFamiliarId}, esMenorDe12: ${nuevoFamiliar.esMenorDe12})`);
      }
      
      console.log(`✅ Plan familiar completo: ${familiares.length + 1} integrantes con ID ${nuevoSocio.planFamiliarId}`);
    }

    return NextResponse.json(
      { 
        message: 'Socio registrado exitosamente',
        socio: {
          id: nuevoSocio.id,
          nombre: nuevoSocio.nombre,
          tipoSocio: nuevoSocio.tipoSocio,
          familiares: socio.tipoSocio === 'FAMILIAR' ? familiares.length : 0
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error al registrar socio:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Endpoint para verificar si un socio ya existe (para validación de cambio de plan)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dni = searchParams.get('dni');
    const email = searchParams.get('email');

    if (!dni && !email) {
      return NextResponse.json(
        { message: 'Se requiere DNI o email para la búsqueda' },
        { status: 400 }
      );
    }

    const whereClause: any = {};
    if (dni) whereClause.dni = dni;
    if (email) whereClause.email = email;

    const socio = await prisma.usuario.findFirst({
      where: {
        ...whereClause,
        rol: 'SOCIO'
      },
      select: {
        id: true,
        nombre: true,
        dni: true,
        email: true,
        telefono: true,
        direccion: true,
        fechaNacimiento: true,
        tipoSocio: true,
        planFamiliarId: true,
        fechaAlta: true,
        esMenorDe12: true
      }
    });

    if (socio) {
      return NextResponse.json({
        existe: true,
        socio: socio
      });
    } else {
      return NextResponse.json({
        existe: false
      });
    }

  } catch (error) {
    console.error('Error al buscar socio:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Endpoint para actualizar un socio (PATCH - actualización parcial)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('PATCH body recibido:', body);
    const { id, email, telefono, direccion, tipoSocio } = body;

    if (!id) {
      return NextResponse.json(
        { message: 'Se requiere el ID del socio' },
        { status: 400 }
      );
    }

    // Buscar el socio
    const socioExistente = await prisma.usuario.findFirst({
      where: { id, rol: 'SOCIO' }
    });

    console.log('Socio existente encontrado:', socioExistente);

    if (!socioExistente) {
      return NextResponse.json(
        { message: 'No se encontró el socio' },
        { status: 404 }
      );
    }

    let mensaje = 'Socio actualizado exitosamente';
    let sociosConvertidos: string[] = [];

    console.log('Verificando cambio de plan:', {
      tipoSocioNuevo: tipoSocio,
      tipoSocioExistente: socioExistente.tipoSocio,
      planFamiliarId: socioExistente.planFamiliarId
    });

    // Si se está cambiando de INDIVIDUAL a FAMILIAR O si ya es FAMILIAR pero no tiene planFamiliarId
    // -> esperamos un campo 'familiares' en el body
    if (
      (tipoSocio === 'FAMILIAR' && socioExistente.tipoSocio === 'INDIVIDUAL') ||
      (tipoSocio === 'FAMILIAR' && socioExistente.tipoSocio === 'FAMILIAR' && !socioExistente.planFamiliarId)
    ) {
        const familiaresFromBody = (body as any).familiares as any[] | undefined;
        // Requerir al menos 3 familiares adicionales
        if (!familiaresFromBody || familiaresFromBody.length < 3) {
          return NextResponse.json(
            { message: 'Para convertir a un socio a FAMILIAR se requieren al menos 3 DNI de miembros adicionales' },
            { status: 400 }
          );
        }

        // Generar un planFamiliarId para todo el grupo
        const nuevoPlanFamiliarId = `PF-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // Actualizar el socio existente para convertirlo en cabeza de familia
        await prisma.usuario.update({
          where: { id },
          data: {
            tipoSocio: 'FAMILIAR',
            planFamiliarId: nuevoPlanFamiliarId,
            familiarId: null
          }
        });

        // Procesar cada familiar enviado
        const sociosConvertidosLocal: string[] = [];
        for (const fam of familiaresFromBody) {
          // Si el frontend marcó existing/id -> convertir
          if (fam.existing || fam.id) {
            const existingId = fam.id;
            const socioParaConvertir = await prisma.usuario.findFirst({ where: { id: existingId } });
            if (!socioParaConvertir) {
              return NextResponse.json({ message: `No se encontró el socio existente con id ${existingId}` }, { status: 400 });
            }
            if (socioParaConvertir.tipoSocio === 'FAMILIAR') {
              return NextResponse.json({ message: `El socio con DNI ${socioParaConvertir.dni} ya pertenece a un plan familiar` }, { status: 400 });
            }

            await prisma.usuario.update({
              where: { id: existingId },
              data: {
                tipoSocio: 'FAMILIAR',
                planFamiliarId: nuevoPlanFamiliarId,
                familiarId: id
              }
            });
            sociosConvertidosLocal.push(`${socioParaConvertir.nombre} (DNI: ${socioParaConvertir.dni}) - Convertido a FAMILIAR`);
            continue;
          }

          // Si no existe en DB, crear nuevo familiar
          // Validar que DNI no esté en uso
          const dniFamiliarExistente = await prisma.usuario.findFirst({ where: { dni: fam.dni } });
          if (dniFamiliarExistente) {
            return NextResponse.json({ message: `El DNI ${fam.dni} ya está registrado` }, { status: 400 });
          }

          const edadFamiliar = fam.fechaNacimiento ? (() => {
            const hoy = new Date();
            const nacimiento = new Date(fam.fechaNacimiento);
            let edad = hoy.getFullYear() - nacimiento.getFullYear();
            const mes = hoy.getMonth() - nacimiento.getMonth();
            if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
            return edad;
          })() : 100;

          const esMenor = edadFamiliar < 12;

          // Si es menor, usar email/telefono del cabeza (recuperar cabeza actualizado)
          const cabeza = await prisma.usuario.findUnique({ where: { id } });

          const familiarData: any = {
            rol: 'SOCIO',
            nombre: fam.nombre,
            dni: fam.dni,
            fechaNacimiento: fam.fechaNacimiento ? new Date(fam.fechaNacimiento) : new Date(),
            email: esMenor ? (cabeza?.email ?? '') : (fam.email || ''),
            telefono: esMenor ? (cabeza?.telefono ?? '') : (fam.telefono || ''),
            tipoSocio: 'FAMILIAR',
            planFamiliarId: nuevoPlanFamiliarId,
            familiarId: id,
            esMenorDe12: esMenor,
            fechaAlta: new Date()
          };

          if (!esMenor && fam.contraseña) {
            familiarData.contraseña = await bcrypt.hash(fam.contraseña, 10);
          } else {
            familiarData.contraseña = null;
          }

          const nuevoFamiliar = await prisma.usuario.create({ data: familiarData });
          sociosConvertidosLocal.push(`${nuevoFamiliar.nombre} (DNI: ${nuevoFamiliar.dni}) - Nuevo familiar creado`);
        }

        mensaje = `Socio convertido a FAMILIAR y se procesaron ${sociosConvertidosLocal.length} integrante(s)`;
        sociosConvertidos = sociosConvertidosLocal;
    }

    // Si se está cambiando de FAMILIAR a INDIVIDUAL
    else if (tipoSocio === 'INDIVIDUAL' && socioExistente.tipoSocio === 'FAMILIAR' && socioExistente.planFamiliarId) {
      console.log('Buscando integrantes del plan familiar:', socioExistente.planFamiliarId);
      
      // Contar cuántos socios quedarían en el plan familiar (sin contar al que se está modificando)
      const integrantesPlanFamiliar = await prisma.usuario.findMany({
        where: {
          planFamiliarId: socioExistente.planFamiliarId,
          rol: 'SOCIO',
          id: { not: id } // Excluir el socio que se está modificando
        },
        select: {
          id: true,
          nombre: true,
          dni: true,
          esMenorDe12: true
        }
      });

      console.log('Integrantes restantes después de sacar este socio:', integrantesPlanFamiliar.length);

      // Si quedan menos de 3 integrantes (porque uno se va), convertir a todos a INDIVIDUAL
      // La regla dice que un plan familiar debe tener al menos 3 integrantes
      // Si quedan 2 o menos, ya no es válido como plan familiar
      if (integrantesPlanFamiliar.length < 3 && integrantesPlanFamiliar.length > 0) {
        console.log('Quedan menos de 3 integrantes. Convirtiendo adultos a INDIVIDUAL y eliminando menores...');
        
        for (const integrante of integrantesPlanFamiliar) {
          // Si es menor de 12 años, eliminarlo (no puede tener cuenta individual)
          if (integrante.esMenorDe12) {
            console.log(`⚠️ Eliminando menor: ${integrante.nombre} (ID: ${integrante.id}) - Los menores no pueden tener cuenta individual`);
            
            // Registrar la baja del menor
            await prisma.usuarioBaja.create({
              data: {
                usuarioEliminadoId: integrante.id,
                usuarioEliminadoNombre: integrante.nombre,
                usuarioEliminadoDni: integrante.dni,
                usuarioEliminadoEmail: socioExistente.email, // Usaba el email del cabeza de familia
                rolUsuarioEliminado: 'SOCIO',
                realizadoPorId: null,
                realizadoPorNombre: '',
                realizadoPorDni: '',
                motivo: `Eliminado automáticamente por conversión de plan familiar a individual (menor de 12 años sin cuenta)`
              }
            });
            
            // Eliminar al menor
            await prisma.usuario.delete({
              where: { id: integrante.id }
            });
            
            sociosConvertidos.push(`${integrante.nombre} (DNI: ${integrante.dni}) - ELIMINADO (menor de 12 años)`);
          } else {
            // Si es mayor de 12 años, convertir a INDIVIDUAL
            console.log(`Convirtiendo a ${integrante.nombre} (ID: ${integrante.id}) a INDIVIDUAL`);
            await prisma.usuario.update({
              where: { id: integrante.id },
              data: {
                tipoSocio: 'INDIVIDUAL',
                planFamiliarId: null,
                familiarId: null
              }
            });
            sociosConvertidos.push(`${integrante.nombre} (DNI: ${integrante.dni}) - Convertido a INDIVIDUAL`);
          }
        }

        mensaje = `Socio actualizado exitosamente. Como el plan familiar quedó con menos de 3 integrantes, se procesaron ${sociosConvertidos.length} socio(s) adicional(es)`;
        console.log('Todos los integrantes procesados');
      } else if (integrantesPlanFamiliar.length === 0) {
        console.log('No quedan más integrantes en el plan familiar');
      }
    }
    
    console.log('Mensaje final:', mensaje);
    console.log('Socios convertidos:', sociosConvertidos);

    // Construir el objeto de actualización solo con los campos proporcionados
    const datosActualizacion: any = {};
    if (email !== undefined) datosActualizacion.email = email;
    if (telefono !== undefined) datosActualizacion.telefono = telefono;
    if (direccion !== undefined) datosActualizacion.direccion = direccion;
    if (tipoSocio !== undefined) {
      datosActualizacion.tipoSocio = tipoSocio;
      // Si se cambia a INDIVIDUAL, limpiar el planFamiliarId y familiarId
      if (tipoSocio === 'INDIVIDUAL') {
        datosActualizacion.planFamiliarId = null;
        datosActualizacion.familiarId = null;
      }
    }

    console.log('Datos de actualización:', datosActualizacion);

    // Actualizar el socio
    const socioActualizado = await prisma.usuario.update({
      where: { id },
      data: datosActualizacion,
      select: {
        id: true,
        nombre: true,
        dni: true,
        email: true,
        telefono: true,
        direccion: true,
        tipoSocio: true,
        planFamiliarId: true,
        fechaNacimiento: true
      }
    });

    console.log('Socio actualizado exitosamente:', socioActualizado);

    return NextResponse.json(
      { 
        message: mensaje,
        socio: socioActualizado,
        sociosConvertidos: sociosConvertidos.length > 0 ? sociosConvertidos : undefined
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error detallado al actualizar socio:', error);
    console.error('Stack trace:', (error as Error).stack);
    return NextResponse.json(
      { message: `Error interno del servidor: ${(error as Error).message}` },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Endpoint para eliminar un socio
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dni = searchParams.get('dni');

    if (!dni) {
      return NextResponse.json(
        { message: 'Se requiere DNI para eliminar socio' },
        { status: 400 }
      );
    }

    // Buscar el socio antes de eliminarlo
    const socio = await prisma.usuario.findFirst({
      where: { dni: dni, rol: 'SOCIO' }
    });

    if (!socio) {
      return NextResponse.json(
        { message: 'No se encontró ningún socio con ese DNI' },
        { status: 404 }
      );
    }

    let sociosEliminados = 1; // Contador de socios eliminados
    const nombresEliminados: string[] = [socio.nombre];

    // Si es cabeza de grupo familiar (tiene planFamiliarId pero NO tiene familiarId)
    // Eliminar también a todos los miembros del grupo
    if (socio.tipoSocio === 'FAMILIAR' && socio.planFamiliarId && !socio.familiarId) {
      console.log(`🔄 Eliminando cabeza de grupo familiar: ${socio.nombre} (planFamiliarId: ${socio.planFamiliarId})`);
      
      // Buscar todos los miembros del grupo familiar
      const miembrosGrupo = await prisma.usuario.findMany({
        where: {
          planFamiliarId: socio.planFamiliarId,
          rol: 'SOCIO',
          id: { not: socio.id } // Excluir el socio principal que ya tenemos
        },
        select: {
          id: true,
          nombre: true,
          dni: true,
          email: true,
          rol: true
        }
      });

      console.log(`📋 Encontrados ${miembrosGrupo.length} miembros adicionales en el grupo familiar`);

      // Eliminar cada miembro del grupo
      for (const miembro of miembrosGrupo) {
        console.log(`   🗑️ Eliminando miembro: ${miembro.nombre} (DNI: ${miembro.dni})`);
        
        // Registrar la baja del miembro
        await prisma.usuarioBaja.create({
          data: {
            usuarioEliminadoId: miembro.id,
            usuarioEliminadoNombre: miembro.nombre,
            usuarioEliminadoDni: miembro.dni,
            usuarioEliminadoEmail: miembro.email,
            rolUsuarioEliminado: miembro.rol,
            realizadoPorId: null,
            realizadoPorNombre: '',
            realizadoPorDni: '',
            motivo: `Eliminado por baja de cabeza de grupo familiar (DNI: ${socio.dni})`
          }
        });

        // Eliminar el miembro
        await prisma.usuario.delete({
          where: { id: miembro.id }
        });

        nombresEliminados.push(miembro.nombre);
        sociosEliminados++;

        // Enviar correo de notificación al miembro
        try {
          const { enviarCorreoBajaUsuario } = await import('@/lib/email');
          await enviarCorreoBajaUsuario({
            email: miembro.email,
            nombre: miembro.nombre,
            dni: miembro.dni,
            rol: miembro.rol,
            fechaBaja: new Date()
          });
          console.log(`   ✅ Correo enviado a ${miembro.email}`);
        } catch (emailError) {
          console.error(`   ⚠️ Error al enviar correo a ${miembro.email}:`, emailError);
        }
      }

      console.log(`✅ Grupo familiar completo eliminado: ${sociosEliminados} socio(s)`);
    }

    // Registrar la baja del socio principal
    const registroBaja = await prisma.usuarioBaja.create({
      data: {
        usuarioEliminadoId: socio.id,
        usuarioEliminadoNombre: socio.nombre,
        usuarioEliminadoDni: socio.dni,
        usuarioEliminadoEmail: socio.email,
        rolUsuarioEliminado: socio.rol,
        realizadoPorId: null,
        realizadoPorNombre: '',
        realizadoPorDni: '',
        motivo: socio.tipoSocio === 'FAMILIAR' && socio.planFamiliarId && !socio.familiarId 
          ? `Cabeza de grupo familiar eliminada junto con ${sociosEliminados - 1} miembro(s)`
          : ''
      }
    });

    // Eliminar el socio principal
    await prisma.usuario.delete({
      where: { id: socio.id }
    });

    // Enviar correo de notificación al socio principal
    try {
      const { enviarCorreoBajaUsuario } = await import('@/lib/email');
      await enviarCorreoBajaUsuario({
        email: socio.email,
        nombre: socio.nombre,
        dni: socio.dni,
        rol: socio.rol,
        fechaBaja: registroBaja.fechaBaja
      });
      console.log(`✅ Correo de notificación enviado a ${socio.email}`);
    } catch (emailError) {
      console.error('⚠️ Error al enviar correo de notificación:', emailError);
    }

    const mensaje = sociosEliminados > 1
      ? `Grupo familiar eliminado exitosamente: ${nombresEliminados.join(', ')} (${sociosEliminados} socio(s) en total)`
      : 'Socio eliminado exitosamente';

    return NextResponse.json(
      { 
        message: mensaje,
        sociosEliminados,
        nombres: nombresEliminados
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar socio:', error);
    return NextResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
