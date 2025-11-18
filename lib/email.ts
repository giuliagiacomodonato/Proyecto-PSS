import nodemailer from 'nodemailer'
import { prisma } from './prisma'

// Implementación ligera para envío/simulación de correos y registro en EmailLog.
let _cachedTransporter: nodemailer.Transporter | null = null
let _defaultFrom: string | null = process.env.SMTP_FROM ?? process.env.SMTP_USER ?? null

async function getTransporter() {
	if (_cachedTransporter) return _cachedTransporter

	const smtpUser = process.env.SMTP_USER
	const smtpPass = process.env.SMTP_PASS

	if (smtpUser && smtpPass) {
		_cachedTransporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST || 'smtp.gmail.com',
			port: parseInt(process.env.SMTP_PORT || '587'),
			secure: process.env.SMTP_SECURE === 'true',
			auth: { user: smtpUser, pass: smtpPass },
		})
		_defaultFrom = process.env.SMTP_FROM ?? smtpUser
		return _cachedTransporter
	}

	// Fallback de desarrollo: cuenta Ethereal
	const testAccount = await nodemailer.createTestAccount()
	_cachedTransporter = nodemailer.createTransport({
		host: 'smtp.ethereal.email',
		port: 587,
		secure: false,
		auth: { user: testAccount.user, pass: testAccount.pass },
	})
	_defaultFrom = process.env.SMTP_FROM ?? testAccount.user
	console.log('Email: usando cuenta de prueba Ethereal:', testAccount.user)
	return _cachedTransporter
}

interface EmailCancelacionReservaParams {
	email: string
	nombre: string
	dni?: string
	canchaNombre?: string
	fecha?: Date
	horario?: string
}

/**
 * Envía (o simula) un correo de cancelación y crea un registro en EmailLog.
 * La entrada en DB se crea siempre; status = 'SENT' o 'ERROR'.
 */
export async function enviarCorreoCancelacionReserva({
	email,
	nombre,
	dni = '',
	canchaNombre = '',
	fecha,
	horario = '',
}: EmailCancelacionReservaParams) {
	const fechaFormateada = fecha ? fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''

	const subject = 'Cancelación de reserva - Club Deportivo'
	const text = `Hola ${nombre},\n\nSu reserva ha sido cancelada.\n${canchaNombre ? `Cancha: ${canchaNombre}\n` : ''}${fechaFormateada ? `Fecha: ${fechaFormateada}\n` : ''}${horario ? `Horario: ${horario}\n` : ''}${dni ? `DNI: ${dni}\n` : ''}\n\nSaludos,\nAdministración Club Deportivo`
	const html = `<!doctype html><html><body><h2>Club Deportivo</h2><p>Hola <strong>${nombre}</strong>,</p><p>Su reserva ha sido cancelada.</p><div><strong>Detalle:</strong>${canchaNombre ? `<div>Cancha: ${canchaNombre}</div>` : ''}${fechaFormateada ? `<div>Fecha: ${fechaFormateada}</div>` : ''}${horario ? `<div>Horario: ${horario}</div>` : ''}${dni ? `<div>DNI: ${dni}</div>` : ''}</div><p>Saludos,<br/>Administración Club Deportivo</p></body></html>`

	const mailOptions = {
		from: process.env.SMTP_FROM ?? `"Club Deportivo" <${_defaultFrom ?? 'no-reply@clubdeportivo.local'}>`,
		to: email,
		subject,
		text,
		html,
	}

	try {
		const t = await getTransporter()
		const info = await t.sendMail(mailOptions)
		const preview = nodemailer.getTestMessageUrl(info) ?? null
		console.log('Correo de cancelación enviado:', info.messageId, 'preview:', preview)

		// Guardar registro en la base de datos. Usamos cast a any para evitar
		// fallos de tipos si Prisma client no está regenerado aún.
		try {
			await (prisma as any).emailLog.create({
				data: {
					toAddress: email,
					subject,
					bodyText: text,
					bodyHtml: html,
					messageId: info.messageId,
					previewUrl: preview,
					status: 'SENT',
					tipo: 'CANCELACION_RESERVA',
				},
			})
		} catch (dbErr) {
			console.error('No se pudo guardar EmailLog (SENT):', dbErr)
		}

		return { success: true, messageId: info.messageId }
	} catch (err) {
		console.error('Error enviando correo de cancelación:', err)
		try {
			await (prisma as any).emailLog.create({
				data: {
					toAddress: email,
					subject,
					bodyText: text,
					bodyHtml: html,
					status: 'ERROR',
					error: err instanceof Error ? err.message : String(err),
					tipo: 'CANCELACION_RESERVA',
				},
			})
		} catch (dbErr) {
			console.error('No se pudo guardar EmailLog (ERROR):', dbErr)
		}

		return { success: false, error: err instanceof Error ? err.message : String(err) }
	}
}

export async function verificarConfiguracionCorreo() {
	try {
		const t = await getTransporter()
		await t.verify()
		return true
	} catch (error) {
		console.error('verificarConfiguracionCorreo:', error)
		return false
	}
}

interface EmailBajaPracticaParams {
	email: string
	nombre: string
	dni?: string
	practicaNombre?: string
}

/**
 * Envía (o simula) un correo informando la baja de una práctica deportiva
 * y crea un registro en EmailLog con tipo 'BAJA_PRACTICA'.
 */
export async function enviarCorreoBajaPractica({ email, nombre, dni = '', practicaNombre = '' }: EmailBajaPracticaParams) {
	const subject = 'Información importante: Baja de práctica deportiva - Club Deportivo'
	const text = `Hola ${nombre},\n\nLamentamos informarle que la práctica ${practicaNombre} ha sido dada de baja.\nSi tenía una inscripción activa, ya ha sido marcada como inactiva.\n\nSi necesita asistencia, contacte con Administración.\n\nSaludos,\nAdministración Club Deportivo`
	const html = `<!doctype html><html><body><h2>Club Deportivo</h2><p>Hola <strong>${nombre}</strong>,</p><p>Lamentamos informarle que la práctica <strong>${practicaNombre}</strong> ha sido dada de baja. Si tenía una inscripción activa, se ha marcado como inactiva en el sistema.</p><p>Si necesita asistencia, contacte con Administración.</p><p>Saludos,<br/>Administración Club Deportivo</p></body></html>`

	const mailOptions = {
		from: process.env.SMTP_FROM ?? `"Club Deportivo" <${_defaultFrom ?? 'no-reply@clubdeportivo.local'}>`,
		to: email,
		subject,
		text,
		html,
	}

	try {
		const t = await getTransporter()
		const info = await t.sendMail(mailOptions)
		const preview = nodemailer.getTestMessageUrl(info) ?? null
		console.log('Correo de baja práctica enviado:', info.messageId, 'preview:', preview)

		try {
			await (prisma as any).emailLog.create({
				data: {
					toAddress: email,
					subject,
					bodyText: text,
					bodyHtml: html,
					messageId: info.messageId,
					previewUrl: preview,
					status: 'SENT',
					tipo: 'BAJA_PRACTICA',
				}
			})
		} catch (dbErr) {
			console.error('No se pudo guardar EmailLog (SENT BAJA_PRACTICA):', dbErr)
		}

		return { success: true, messageId: info.messageId }
	} catch (err) {
		console.error('Error enviando correo de baja práctica:', err)
		try {
			await (prisma as any).emailLog.create({
				data: {
					toAddress: email,
					subject,
					bodyText: text,
					bodyHtml: html,
					status: 'ERROR',
					error: err instanceof Error ? err.message : String(err),
					tipo: 'BAJA_PRACTICA',
				}
			})
		} catch (dbErr) {
			console.error('No se pudo guardar EmailLog (ERROR BAJA_PRACTICA):', dbErr)
		}

		return { success: false, error: err instanceof Error ? err.message : String(err) }
	}
}

interface EmailBajaUsuarioParams {
	email: string
	nombre: string
	dni: string
	rol: string
	fechaBaja: Date
}

/**
 * Envía correo informando la baja de un usuario (admin, socio, entrenador).
 */
export async function enviarCorreoBajaUsuario({ 
	email, 
	nombre, 
	dni, 
	rol,
	fechaBaja 
}: EmailBajaUsuarioParams) {
	console.log('[enviarCorreoBajaUsuario] Iniciando envío de email...')
	console.log('[enviarCorreoBajaUsuario] Destinatario:', email)
	console.log('[enviarCorreoBajaUsuario] Nombre:', nombre)
	console.log('[enviarCorreoBajaUsuario] DNI:', dni)
	console.log('[enviarCorreoBajaUsuario] Rol:', rol)
	console.log('[enviarCorreoBajaUsuario] Fecha Baja:', fechaBaja)
	
	const rolTexto = rol === 'ADMIN' ? 'Administrador' : rol === 'SOCIO' ? 'Socio' : 'Entrenador'
	const fechaFormateada = fechaBaja.toLocaleDateString('es-AR', {
		day: '2-digit',
		month: 'long',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	})

	const subject = 'Notificación de Baja de Usuario - Club Deportivo'
	const text = `Hola ${nombre},\n\nLe informamos que su cuenta en el Club Deportivo ha sido dada de baja.\n\nDetalles:\nNombre: ${nombre}\nDNI: ${dni}\nRol: ${rolTexto}\nFecha de Baja: ${fechaFormateada}\n\nA partir de este momento, ya no tendrá acceso al sistema.\n\nSi considera que esto es un error, contacte con la administración.\n\nSaludos,\nAdministración Club Deportivo`
	
	const html = `<!DOCTYPE html>
<html>
	<head>
		<style>
			body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
			.container { max-width: 600px; margin: 0 auto; padding: 20px; }
			.header { background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
			.content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 5px 5px; }
			.info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #dc2626; }
			.footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
		</style>
	</head>
	<body>
		<div class="container">
			<div class="header">
				<h1>🚫 Notificación de Baja de Usuario</h1>
			</div>
			<div class="content">
				<p>Estimado/a <strong>${nombre}</strong>,</p>
				
				<p>Le informamos que su cuenta en el Club Deportivo ha sido dada de baja.</p>
				
				<div class="info-box">
					<h3>📋 Detalles de la Baja:</h3>
					<p><strong>Nombre:</strong> ${nombre}</p>
					<p><strong>DNI:</strong> ${dni}</p>
					<p><strong>Rol:</strong> ${rolTexto}</p>
					<p><strong>Fecha de Baja:</strong> ${fechaFormateada}</p>
				</div>

				<p>A partir de este momento, ya no tendrá acceso al sistema del Club Deportivo.</p>
				
				<p>Si considera que esta baja es un error o tiene alguna consulta, por favor contacte con la administración del club.</p>
				
				<p>Saludos cordiales,<br>
				<strong>Club Deportivo</strong></p>
			</div>
			<div class="footer">
				<p>Este es un correo automático, por favor no responder.</p>
				<p>© ${new Date().getFullYear()} Club Deportivo. Todos los derechos reservados.</p>
			</div>
		</div>
	</body>
</html>`

	const mailOptions = {
		from: process.env.SMTP_FROM ?? `"Club Deportivo" <${_defaultFrom ?? 'no-reply@clubdeportivo.local'}>`,
		to: email,
		subject,
		text,
		html,
	}

	try {
		console.log('[enviarCorreoBajaUsuario] Obteniendo transporter...')
		const t = await getTransporter()
		console.log('[enviarCorreoBajaUsuario] Transporter obtenido, enviando email...')
		const info = await t.sendMail(mailOptions)
		const preview = nodemailer.getTestMessageUrl(info) ?? null
		console.log('✅ [enviarCorreoBajaUsuario] Correo de baja usuario enviado exitosamente!')
		console.log('[enviarCorreoBajaUsuario] Message ID:', info.messageId)
		console.log('[enviarCorreoBajaUsuario] Preview URL:', preview)

		try {
			await (prisma as any).emailLog.create({
				data: {
					toAddress: email,
					subject,
					bodyText: text,
					bodyHtml: html,
					messageId: info.messageId,
					previewUrl: preview,
					status: 'SENT',
					tipo: 'BAJA_USUARIO',
				}
			})
			console.log('[enviarCorreoBajaUsuario] EmailLog guardado correctamente')
		} catch (dbErr) {
			console.error('[enviarCorreoBajaUsuario] No se pudo guardar EmailLog (SENT BAJA_USUARIO):', dbErr)
		}

		return { success: true, messageId: info.messageId }
	} catch (err) {
		console.error('❌ [enviarCorreoBajaUsuario] Error enviando correo de baja usuario:', err)
		console.error('[enviarCorreoBajaUsuario] Stack trace:', err instanceof Error ? err.stack : err)
		try {
			await (prisma as any).emailLog.create({
				data: {
					toAddress: email,
					subject,
					bodyText: text,
					bodyHtml: html,
					status: 'ERROR',
					error: err instanceof Error ? err.message : String(err),
					tipo: 'BAJA_USUARIO',
				}
			})
			console.log('[enviarCorreoBajaUsuario] EmailLog de error guardado')
		} catch (dbErr) {
			console.error('[enviarCorreoBajaUsuario] No se pudo guardar EmailLog (ERROR BAJA_USUARIO):', dbErr)
		}

		return { success: false, error: err instanceof Error ? err.message : String(err) }
	}
}

