# Guía: Cómo aplicar migraciones de Prisma sin perder datos

Este readme es para actualizar cada copia del código paso a paso y aplicar las migraciones de Prisma generadas, **manteniendo los datos existentes**.

De más está decir que perdón por todo, no me odien :(

Agregué esta variable de entorno para generar las notificaciones por mail:
SMTP_FROM="Club Deportivo <no-reply@clubdeportivo.local>"
---

## Resumen rápido
- Hacer backup de la base de datos antes de tocar migraciones (probar primero con los comandos de prisma y si no se puede regenerar el cliente o dice que no puede continuar sin borrar la base de datos recién ahí hacer todo el bardo del backup explicado más abajo).
- Traer los cambios (`git pull`) e instalar dependencias.
- Revisar las migraciones pendientes con `npx prisma migrate status`.
- Aplicar migraciones con `npx prisma migrate deploy` (no borra datos).
- Verificar que la nueva tabla/columna existe y probar la app.

---

## Requisitos y pre-requisitos
- Tener acceso a la base de datos (variable de entorno `DATABASE_URL`).
- `pg_dump` (para PostgreSQL/Neon) disponible en la máquina si se quiere backup local.
- Node.js y la versión de paquetes requerida (ej. `pnpm` o `npm`).
- Archivo `prisma/schema.prisma` y carpeta `prisma/migrations` presentes en el repo.

---

## Pasos detallados (PowerShell)

1) Hacer un backup de la base de datos (OBLIGATORIO)

   - Postgres / Neon (ejemplo usando variables de entorno). Ajustar según su configuración.

```powershell
# Si hay variables separadas:
# $env:DB_HOST, $env:DB_USER, $env:DB_NAME
# Reemplazar por las variables reales si se usan otras (creo que siempre usamos DATABASE_URL, pero por las dudas).
pg_dump -Fc --no-acl --no-owner -h $env:DB_HOST -U $env:DB_USER -d $env:DB_NAME -f backup_$(Get-Date -Format yyyyMMddHHmmss).dump
```

   - Si tu `DATABASE_URL` contiene usuario/host/puerto/DB, podés pasar la URL completa:

```powershell
# Exportar (si se quiere) y usarla con pg_dump (envíar contraseña con PGPASSWORD o usa .pgpass)
$env:DATABASE_URL = "postgres://user:password@host:port/dbname"
pg_dump -Fc --no-acl --no-owner "$env:DATABASE_URL" -f backup.dump
```

2) Actualizar el código e instalar dependencias

```powershell
git checkout <rama-donde-estan-las-migraciones>
git pull origin <rama-donde-estan-las-migraciones>
pnpm install    # o: npm install
```

3) Revisar la carpeta de migraciones localmente

```powershell
ls prisma/migrations | Sort-Object
# Ver el contenido de la última migración (SQL generado)
Get-ChildItem -Directory prisma/migrations | Sort-Object Name | Select-Object -Last 1 | ForEach-Object { Get-Content "$($_.FullName)\migration.sql" }
```

4) Comprobar el estado de migraciones en la BD

```powershell
npx prisma migrate status --schema=prisma/schema.prisma
```

Esto te da información sobre la última migración aplicada y si hay pendientes.

5) Aplicar migraciones sin perder datos

```powershell
npx prisma migrate deploy --schema=prisma/schema.prisma
```

`migrate deploy` aplica las migraciones que están en `prisma/migrations` a la base de datos. Es la forma recomendada para entornos con datos (no pide confirmaciones interactivas, no resetea la DB).

6) Verificar que la nueva tabla/columna fue creada

- Abrir `Prisma Studio`:

```powershell
npx prisma studio --schema=prisma/schema.prisma
```

- O usar un cliente SQL / `psql` para inspeccionar la tabla recién creada.

---

## Si `migrate deploy` falla (conflictos o schema drift)

- Leer el mensaje de error: suele decir si hay SQL que no puede ejecutarse o si la DB difiere del SQL esperado.
- Posibles acciones seguras:
  - Confirmar si la SQL de la migración ya fue aplicada manualmente (por otro medio).
  - Si la SQL ya existe en la base de datos y quieres marcar la migración como aplicada sin ejecutar SQL:

```powershell
npx prisma migrate resolve --applied "<timestamp_nombre_migracion>" --schema=prisma/schema.prisma
```

  - Usar esta opción solo si verificaste manualmente que la estructura ya contiene los cambios de la migración.
  - Si hay cambios manuales en la BD que generan drift, comparar `prisma/schema.prisma` con la estructura real (por ejemplo exportando `pg_dump --schema-only`) y corregir manualmente.

---

## Verificación final y pruebas
- Ejecutar la aplicación localmente y probar los flujos que usan la tabla/columna nueva.

```powershell
 npm run dev
```

- Alternativamente, ejecutar queries directas con `psql` o un cliente GUI para confirmar datos.

---

---
## Problemas frecuentes y soluciones rápidas
- Error: permiso/roles en la DB -> Asegurar que el usuario DB tenga permisos `CREATE`/`ALTER`/`DROP` según la migración.
- Error: constraints / datos existentes bloquean cambios destructivos -> revisar la migración y realizar pasos manuales (p.ej. backfill) antes de aplicar la migración.
- Error: contraseña no proporcionada -> usar `PGPASSWORD` o `.pgpass` para `pg_dump`/`psql` en scripts.
---

---
## Aclaración sobre el backup
- Si les anduvo todo joya con los comandos de prisma solos bárbaro (la tabla nueva está vacía, así que no debería haber ningún drama), pero si les tira que no puede regenerar el cliente de prisma o que se pueden perder los datos y prueban de hacer el backup, se guardan bien los datos, pero para restaurarlos después los restaura en diferente orden (o sea, crea primero tablas que son dependientes de otras por llave foránea como la tabla Pagos con la tabla Cuotas).
- Ahí lo que hice fue primero hacer el backup con el comando de arriba de postgre usando el valor de la variable de entorno DATABASE_URL del .env
- Ese comando te crea un archivo .DUMP como el que subí y lo podés guardar en otra variable de entorno de la terminal con el comando "$dump = ".\backup_neon_20251113_191423.dump""
- Ahí lo que hice fue ir restaurando tabla por tabla con este orden:
1) practicas_deportivas
2) usuarios
3) canchas
4) horarios
5) inscripciones
6) turnos
7) cuotas
8) pagos
9) asistencias
10) horarios_cancha
11) usuarios_bajas

- El comando para la primera sería:
pg_restore --verbose --data-only --no-owner --table=practicas_deportivas --dbname=$env:DATABASE_URL $dump

- Después de restaurarlas a todas hay que actualizar la secuencia del id que se autoincrementa cada vez que metés algo nuevo a alguna tabla para que quede todo sincronizado (capaz en el backup quedó que el próximo id es el 50 y después de restaurar todo quedó que el próximo id es el 49, entonces en la próxima inserción de esa tabla va a tirar error porque toma como que ya existe un registro con ese id). Esto se hace con este comando (lo hice para prácticas deportivas, pero habría que hacerlo para cada tabla):
psql $env:DATABASE_URL -c "SELECT setval(pg_get_serial_sequence('public.practicas_deportivas','id'), COALESCE((SELECT MAX(id) FROM public.practicas_deportivas),0));"

- Para chequear cuál es el máximo valor que tiene el id (nextval) sin consumirlo se puede usar este comando (está hecho para la tabla usuarios de ejemplo):
psql $env:DATABASE_URL -c "SELECT setval(pg_get_serial_sequence('public.usuarios','id'), COALESCE((SELECT MAX(id) FROM public.usuarios),0));

---