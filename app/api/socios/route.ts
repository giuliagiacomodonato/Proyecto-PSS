import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { socio, familiares } = body;

    // Validar que el usuario sea administrador (esto se puede mejorar con autenticación)
    // Por ahora, asumimos que si llega aquí es porque es admin
    
    // Validar datos del socio principal
    if (!socio.nombre || !socio.dni || !socio.email || !socio.telefono || !socio.contraseña) {
      return NextResponse.json(
        { message: 'Faltan campos obligatorios del socio principal' },
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

    // Verificar que el email no esté en uso
    const emailExistente = await prisma.usuario.findFirst({
      where: { email: socio.email }
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
      
      // Verificar que se hayan agregado al menos 2 familiares (3 en total con el socio principal)
      if (familiares.length < 2) {
        return NextResponse.json(
          { message: 'El plan familiar requiere al menos 2 integrantes adicionales (3 en total)' },
          { status: 400 }
        );
      }

      // Validar y crear cada familiar
      let familiarCount = 0;
      for (const familiar of familiares) {
        familiarCount++;
        // Verificar que el DNI del familiar no esté en uso
        const dniFamiliarExistente = await prisma.usuario.findFirst({
          where: { dni: familiar.dni }
        });

        if (dniFamiliarExistente) {
          return NextResponse.json(
            { message: `El DNI ${familiar.dni} ya está registrado` },
            { status: 400 }
          );
        }

        // Verificar que el email del familiar no esté en uso
        const emailFamiliarExistente = await prisma.usuario.findFirst({
          where: { email: familiar.email }
        });

        if (emailFamiliarExistente) {
          return NextResponse.json(
            { message: `El email ${familiar.email} ya está registrado` },
            { status: 400 }
          );
        }

        // Hash de la contraseña del familiar
        const hashedPasswordFamiliar = await bcrypt.hash(familiar.contraseña, 10);

        console.log(`   ${familiarCount}. Creando familiar: ${familiar.nombre} con planFamiliarId: ${nuevoSocio.planFamiliarId}`);

        // Crear el familiar
        const nuevoFamiliar = await prisma.usuario.create({
          data: {
            rol: 'SOCIO',
            nombre: familiar.nombre,
            dni: familiar.dni,
            fechaNacimiento: new Date(familiar.fechaNacimiento),
            email: familiar.email,
            telefono: familiar.telefono,
            contraseña: hashedPasswordFamiliar,
            tipoSocio: 'FAMILIAR',
            planFamiliarId: nuevoSocio.planFamiliarId, // Mismo ID del plan familiar
            familiarId: nuevoSocio.id, // Referencia al socio principal
            fechaAlta: new Date()
          }
        });

        console.log(`   ✅ Familiar ${familiarCount} creado: ${nuevoFamiliar.nombre} (ID: ${nuevoFamiliar.id}, planFamiliarId: ${nuevoFamiliar.planFamiliarId})`);
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
        fechaAlta: true
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

    // Si se está cambiando de FAMILIAR a INDIVIDUAL
    if (tipoSocio === 'INDIVIDUAL' && socioExistente.tipoSocio === 'FAMILIAR' && socioExistente.planFamiliarId) {
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
          dni: true
        }
      });
      
      console.log('Integrantes restantes después de sacar este socio:', integrantesPlanFamiliar.length);

      // Si quedan menos de 3 integrantes (porque uno se va), convertir a todos a INDIVIDUAL
      // La regla dice que un plan familiar debe tener al menos 3 integrantes
      // Si quedan 2 o menos, ya no es válido como plan familiar
      if (integrantesPlanFamiliar.length < 3 && integrantesPlanFamiliar.length > 0) {
        console.log('Quedan menos de 3 integrantes. Convirtiendo todos a INDIVIDUAL...');
        
        for (const integrante of integrantesPlanFamiliar) {
          console.log(`Convirtiendo a ${integrante.nombre} (ID: ${integrante.id}) a INDIVIDUAL`);
          await prisma.usuario.update({
            where: { id: integrante.id },
            data: {
              tipoSocio: 'INDIVIDUAL',
              planFamiliarId: null,
              familiarId: null
            }
          });
          sociosConvertidos.push(`${integrante.nombre} (DNI: ${integrante.dni})`);
          console.log(`✓ ${integrante.nombre} convertido exitosamente`);
        }

        mensaje = `Socio actualizado exitosamente. Como el plan familiar quedó con menos de 3 integrantes, se convirtieron ${sociosConvertidos.length} socio(s) adicional(es) a plan INDIVIDUAL: ${sociosConvertidos.join(', ')}`;
        console.log('Todos los integrantes convertidos');
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

    // Registrar la baja en UsuarioBaja solo con los campos obligatorios del usuario eliminado
    const registroBaja = await prisma.usuarioBaja.create({
      data: {
        usuarioEliminadoId: socio.id,
        usuarioEliminadoNombre: socio.nombre,
        usuarioEliminadoDni: socio.dni,
        usuarioEliminadoEmail: socio.email,
        rolUsuarioEliminado: socio.rol,
        // El resto de los campos quedan nulos o vacíos
        realizadoPorId: null,
        realizadoPorNombre: '',
        realizadoPorDni: '',
        motivo: ''
      }
    });

    // Eliminar el socio
    await prisma.usuario.delete({
      where: { id: socio.id }
    });

    // Enviar correo de notificación al socio dado de baja
    try {
      // Importar la función de email dinámicamente para evitar problemas de dependencias
      const { enviarCorreoBajaUsuario } = await import('@/lib/email');
      await enviarCorreoBajaUsuario({
        email: socio.email,
        nombre: socio.nombre,
        dni: socio.dni,
        rol: socio.rol,
        fechaBaja: registroBaja.fechaBaja
      });
      console.log(`Correo de notificación enviado a ${socio.email}`);
    } catch (emailError) {
      console.error('Error al enviar correo de notificación:', emailError);
      // La baja ya se realizó, solo falló el correo
    }

    return NextResponse.json(
      { message: 'Socio eliminado exitosamente' },
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
