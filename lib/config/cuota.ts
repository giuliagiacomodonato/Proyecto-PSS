// Helpers para leer y escribir el precio base de la cuota de socios.
// Se utiliza un archivo JSON en `lib/config/cuota.json` como almacenamiento simple
// para permitir que el administrador modifique la tarifa sin tocar la base de datos.
import fs from 'fs/promises'
import path from 'path'

const CONFIG_PATH = path.join(process.cwd(), 'lib', 'config', 'cuota.json')

// Devuelve el precio base actual (número). Si ocurre un error o el archivo no
// existe, devuelve 0 como fallback.
export async function getPrecioBaseCuota(): Promise<number> {
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8')
    const json = JSON.parse(raw)
    const precio = Number(json.precioBase ?? json.precio ?? 0)
    return Number.isNaN(precio) ? 0 : precio
  } catch (err) {
    // Si no existe o hay error, devolver 0 como fallback
    return 0
  }
}

// Escribe el nuevo precio base en el archivo JSON. Redondea el valor y se
// asegura de crear el directorio si no existe.
export async function setPrecioBaseCuota(precio: number): Promise<void> {
  const safePrecio = Math.round(Number(precio) || 0)
  const payload = { precioBase: safePrecio }
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true })
  await fs.writeFile(CONFIG_PATH, JSON.stringify(payload, null, 2), 'utf-8')
}

// Asegura que exista un precio por defecto. Se puede llamar al inicio de la
// aplicación si se desea garantizar un valor inicial.
export async function ensureDefaultPrecio(defaultPrecio = 5000) {
  try {
    const exists = await fs.readFile(CONFIG_PATH, 'utf-8')
    if (!exists) {
      await setPrecioBaseCuota(defaultPrecio)
    }
  } catch (err) {
    // Crear con valor por defecto
    await setPrecioBaseCuota(defaultPrecio)
  }
}
