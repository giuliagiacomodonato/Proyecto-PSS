# 📧 Configuración de Correo Electrónico

Este documento explica cómo configurar el envío de correos electrónicos para notificaciones del sistema.

## 🎯 Propósito

El sistema envía correos electrónicos automáticos cuando:
- ✉️ Se da de baja a un administrador
- ✉️ Se da de baja a un socio (futuro)
- ✉️ Se da de baja a un entrenador (futuro)
- ✉️ Otras notificaciones del sistema

## 🔧 Configuración

### 1. Cuenta de Gmail del Proyecto

**Email:** `clubdeportivo.notificaciones@gmail.com`  
**Contraseña:** Solicitar al equipo de desarrollo

### 2. Variables de Entorno

El archivo `.env` debe contener las siguientes variables:

```env
# Configuración de correo electrónico (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=clubdeportivo.notificaciones@gmail.com
SMTP_PASS=oter oomb yrzy kklv
EMAIL_FROM=clubdeportivo.notificaciones@gmail.com
```

### 3. Instalación para Desarrolladores

Si acabas de clonar el repositorio:

1. **Copia el archivo de ejemplo:**
   ```bash
   cp .env.example .env
   ```

2. **Solicita las credenciales** al líder del equipo o revisa el canal privado de Discord/WhatsApp

3. **Actualiza el archivo `.env`** con las credenciales proporcionadas

4. **Instala las dependencias:**
   ```bash
   pnpm install
   ```

5. **Verifica la configuración:**
   ```bash
   pnpm dev
   ```

## 🧪 Prueba del Envío de Correos

Para probar que el correo funciona correctamente:

1. Inicia el servidor de desarrollo:
   ```bash
   pnpm dev
   ```

2. Accede a la página de baja de administrador:
   ```
   http://localhost:3000/admin/bajaAdmin
   ```

3. Ingresa el DNI de un administrador de prueba

4. Confirma la baja

5. Verifica que el correo llegó al email del administrador eliminado

## 🔒 Seguridad

### ⚠️ IMPORTANTE:

- ✅ El archivo `.env` **NO** se sube a GitHub (está en `.gitignore`)
- ✅ Nunca compartas las credenciales en canales públicos
- ✅ Usa solo canales privados del equipo (Discord, WhatsApp, etc.)
- ✅ La contraseña es una "Contraseña de Aplicación" de Gmail, no la contraseña real

### 🔐 Sobre la Contraseña de Aplicación

La contraseña que usamos (`oter oomb yrzy kklv`) es una **contraseña de aplicación** generada por Google. Esto significa:

- ✅ Es específica para esta aplicación
- ✅ No da acceso completo a la cuenta de Gmail
- ✅ Puede ser revocada en cualquier momento sin cambiar la contraseña principal
- ✅ Es más segura que usar la contraseña real

## 📋 Plantilla de Correo

El sistema envía correos con el siguiente formato:

**Asunto:** `Notificación de Baja - Administrador`

**Contenido:** 
- Información del usuario dado de baja
- Fecha y hora de la baja
- Detalles del rol
- Mensaje de despedida

## 🚨 Solución de Problemas

### Error: "Error al enviar correo de notificación"

**Posibles causas:**

1. **Credenciales incorrectas en `.env`**
   - Verifica que `SMTP_USER` y `SMTP_PASS` estén correctos
   
2. **Gmail bloqueó el acceso**
   - Verifica que la verificación en dos pasos esté activa
   - Regenera la contraseña de aplicación
   
3. **Variables de entorno no cargadas**
   - Reinicia el servidor de desarrollo (`Ctrl+C` y `pnpm dev`)
   
4. **Firewall o antivirus bloqueando el puerto 587**
   - Verifica la configuración de tu firewall

### Verificar la configuración

Puedes agregar esta función en cualquier archivo para probar la conexión:

```typescript
import { verificarConfiguracionCorreo } from '@/lib/email'

// Llamar esta función para verificar
await verificarConfiguracionCorreo()
```

## 👥 Compartir con el Equipo

Para compartir las credenciales con nuevos miembros:

1. **No uses GitHub** - El `.env` está en `.gitignore`
2. **Usa canales privados:**
   - WhatsApp del grupo
   - Discord privado
   - Email directo
   - Google Drive con acceso restringido

3. **Comparte el archivo `.env` completo** o las credenciales para que lo agreguen manualmente

## 📧 Contacto

Si tienes problemas con la configuración del correo, contacta:
- Canal de Discord del proyecto
- Líder del equipo
- [Agregar contacto relevante]

---

**Última actualización:** Octubre 2025
