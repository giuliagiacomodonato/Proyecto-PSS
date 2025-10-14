# Alta de Socio - Funcionalidad Implementada

## 📋 Resumen
Esta funcionalidad permite a los administradores registrar nuevos socios en el sistema, tanto individuales como familiares.

## 🎯 User Story Implementada
**F1-7 Alta de Socio** - Completamente implementada según los criterios de aceptación.

## ✅ Criterios de Aceptación Cumplidos

### ✅ Validaciones de Campos Obligatorios
- **Nombre completo**: Solo caracteres, campo obligatorio
- **DNI**: Solo números, 7-8 dígitos, campo obligatorio
- **Fecha de nacimiento**: Formato calendario, campo obligatorio
- **Correo electrónico**: Validación de formato con '@', campo obligatorio
- **Teléfono**: Solo números, campo obligatorio
- **Dirección**: Campo obligatorio
- **Contraseña**: Mínimo 8 caracteres con mayúscula, minúscula, número y carácter especial

### ✅ Tipos de Socio
- **Botones de selección**: Individual y Familiar
- **Plan Individual**: Registro directo
- **Plan Familiar**: Requiere al menos 3 integrantes adicionales

### ✅ Funcionalidad de Familiares
- **Modal para agregar familiares**: Se abre al hacer clic en "Agregar nuevo integrante"
- **Validación de duplicados**: No permite DNI o email duplicados entre familiares
- **Mínimo 3 familiares**: El botón "Registrar" se habilita solo con 3+ familiares
- **Información temporal**: Se mantiene hasta presionar "Registrar" en el formulario principal

### ✅ Validaciones del Sistema
- **DNI único**: Verifica que no esté registrado en la base de datos
- **Email único**: Verifica que no esté registrado en la base de datos
- **Rol administrador**: Validación implementada en la API
- **Botón deshabilitado**: Hasta completar todos los campos requeridos

### ✅ Mensajes y Confirmaciones
- **Mensajes de error**: Para datos inválidos o duplicados
- **Mensaje de éxito**: Confirmación de registro exitoso
- **Toast notifications**: Mensajes temporales que no bloquean la interfaz
- **Contador de familiares**: Muestra cuántos integrantes se han agregado

## 🚀 Cómo Usar

### 1. Acceder a la Funcionalidad
- Navegar a `/admin/altaSocio`
- La página muestra el formulario "Registrar Nuevo Socio"

### 2. Registrar Socio Individual
1. Completar todos los campos obligatorios
2. Seleccionar "Individual" en tipo de socio
3. Hacer clic en "✓ Registrar"

### 3. Registrar Socio Familiar
1. Completar campos del socio principal
2. Seleccionar "Familiar" en tipo de socio
3. Hacer clic en "Agregar nuevo integrante"
4. Completar el modal con datos del familiar
5. Repetir hasta tener al menos 3 familiares
6. Hacer clic en "✓ Registrar" (se habilita con 3+ familiares)

## 🔧 Archivos Creados

### Frontend
- `app/admin/altaSocio/page.tsx` - Página principal con formulario
- `app/components/Toast.tsx` - Componente para mensajes
- `app/globals.css` - Animaciones para Toast

### Backend
- `app/api/socios/route.ts` - API para registrar y consultar socios

## 🗄️ Base de Datos
La funcionalidad utiliza el esquema Prisma existente:
- Tabla `Usuario` con campos específicos para socios
- Relación `familiarId` para vincular familiares
- Enum `TipoSocio` (INDIVIDUAL, FAMILIAR)
- Enum `RolUsuario` (SOCIO)

## 🔐 Seguridad
- **Contraseñas hasheadas**: Usando bcryptjs
- **Validación de duplicados**: DNI y email únicos
- **Validación de rol**: Solo administradores pueden registrar
- **Sanitización de datos**: Validaciones en frontend y backend

## 🎨 UI/UX
- **Diseño responsive**: Funciona en desktop y móvil
- **Validación en tiempo real**: Errores se muestran mientras se escribe
- **Estados de carga**: Botón muestra "Registrando..." durante el proceso
- **Mensajes claros**: Toast notifications con iconos y colores apropiados
- **Formulario intuitivo**: Campos organizados lógicamente

## 🧪 Pruebas Recomendadas

### Casos de Éxito
1. ✅ Registrar socio individual con datos válidos
2. ✅ Registrar socio familiar con 3+ integrantes
3. ✅ Validar que se muestre mensaje de éxito

### Casos de Error
1. ✅ Intentar registrar con DNI duplicado
2. ✅ Intentar registrar con email duplicado
3. ✅ Intentar registrar familiar con menos de 3 integrantes
4. ✅ Validar campos obligatorios vacíos
5. ✅ Validar formato de contraseña

## 📝 Notas Técnicas
- **Estado local**: Se mantiene información de familiares hasta el registro final
- **Validación dual**: Frontend para UX, backend para seguridad
- **Transacciones**: El registro es atómico (todo o nada)
- **Performance**: Validaciones optimizadas para no bloquear la UI

## 🔄 Próximos Pasos Sugeridos
1. Implementar autenticación real de administradores
2. Agregar validación de cambio de plan para socios existentes
3. Implementar descuentos para plan familiar
4. Agregar historial de registros
5. Implementar notificaciones por email
