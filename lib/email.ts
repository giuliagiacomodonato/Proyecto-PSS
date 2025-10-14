import nodemailer from 'nodemailer'

// Configuración del transporter de nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface EmailBajaUsuarioParams {
  email: string
  nombre: string
  dni: string
  rol: string
  fechaBaja: Date
}

/**
 * Envía un correo de notificación al usuario que fue dado de baja
 */
export async function enviarCorreoBajaUsuario({
  email,
  nombre,
  dni,
  rol,
  fechaBaja,
}: EmailBajaUsuarioParams) {
  const fechaFormateada = fechaBaja.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const rolTexto = rol === 'ADMIN' ? 'Administrador' : rol === 'SOCIO' ? 'Socio' : 'Entrenador'

  const mailOptions = {
    from: `"Club Deportivo" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Notificación de Baja - ${rolTexto}`,
    html: `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #1e40af;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #f9fafb;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-radius: 0 0 8px 8px;
          }
          .info-box {
            background-color: white;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #1e40af;
            border-radius: 4px;
          }
          .info-row {
            margin: 10px 0;
          }
          .label {
            font-weight: bold;
            color: #6b7280;
          }
          .value {
            color: #111827;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
          }
          .alert {
            background-color: #fee2e2;
            border-left: 4px solid #dc2626;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Club Deportivo</h1>
          <p>Notificación de Baja de Usuario</p>
        </div>
        
        <div class="content">
          <p>Estimado/a <strong>${nombre}</strong>,</p>
          
          <div class="alert">
            <p style="margin: 0;">
              Le informamos que su cuenta de <strong>${rolTexto}</strong> ha sido dada de baja en el sistema del Club Deportivo.
            </p>
          </div>
          
          <div class="info-box">
            <h3 style="margin-top: 0;">Detalles de la baja:</h3>
            
            <div class="info-row">
              <span class="label">Nombre:</span>
              <span class="value">${nombre}</span>
            </div>
            
            <div class="info-row">
              <span class="label">DNI:</span>
              <span class="value">${dni}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Rol:</span>
              <span class="value">${rolTexto}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Fecha de baja:</span>
              <span class="value">${fechaFormateada}</span>
            </div>
          </div>
          
          <p>
            A partir de este momento, su acceso al sistema ha sido revocado y sus credenciales ya no son válidas.
          </p>
          
          <p>
            Si considera que esta baja es un error o tiene alguna consulta, por favor contacte con la administración del club.
          </p>
          
          <p>Saludos cordiales,<br>
          <strong>Administración del Club Deportivo</strong></p>
        </div>
        
        <div class="footer">
          <p>Este es un correo automático, por favor no responda a este mensaje.</p>
          <p>&copy; ${new Date().getFullYear()} Club Deportivo. Todos los derechos reservados.</p>
        </div>
      </body>
      </html>
    `,
    text: `
Estimado/a ${nombre},

Le informamos que su cuenta de ${rolTexto} ha sido dada de baja en el sistema del Club Deportivo.

Detalles de la baja:
- Nombre: ${nombre}
- DNI: ${dni}
- Rol: ${rolTexto}
- Fecha de baja: ${fechaFormateada}

A partir de este momento, su acceso al sistema ha sido revocado y sus credenciales ya no son válidas.

Si considera que esta baja es un error o tiene alguna consulta, por favor contacte con la administración del club.

Saludos cordiales,
Administración del Club Deportivo

---
Este es un correo automático, por favor no responda a este mensaje.
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('Correo de baja enviado:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error al enviar correo de baja:', error)
    throw new Error('Error al enviar el correo de notificación')
  }
}

/**
 * Verifica la configuración del servicio de correo
 */
export async function verificarConfiguracionCorreo() {
  try {
    await transporter.verify()
    console.log('Servidor de correo configurado correctamente')
    return true
  } catch (error) {
    console.error('Error en la configuración del servidor de correo:', error)
    return false
  }
}
