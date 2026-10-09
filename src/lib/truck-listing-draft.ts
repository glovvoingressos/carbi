export const TRUCK_LISTING_DRAFT_VERSION = 1
export const TRUCK_LISTING_DRAFT_KEY = 'carbi_truck_listing_draft_v1'

export interface TruckListingDraftSnapshot<T> {
  version: number
  form: T
  plate: string
  fipe: { price: number | null; reference: string | null }
  step: number
  updatedAt: number
}

export interface TruckListingDraftImage {
  id: string
  name: string
  type: string
  lastModified: number
  blob: Blob
}

const IMAGE_DB_NAME = 'carbi-truck-listing-draft'
const IMAGE_STORE_NAME = 'images'
let imageWriteQueue: Promise<void> = Promise.resolve()

export function serializeTruckListingDraft<T>(snapshot: Omit<TruckListingDraftSnapshot<T>, 'version' | 'updatedAt'>): string {
  return JSON.stringify({ ...snapshot, version: TRUCK_LISTING_DRAFT_VERSION, updatedAt: Date.now() })
}

export function parseTruckListingDraft<T extends Record<string, string>>(value: string | null, defaults: T): TruckListingDraftSnapshot<T> | null {
  if (!value) return null

  try {
    const parsed = JSON.parse(value) as Partial<TruckListingDraftSnapshot<T>> | null
    if (
      !parsed || parsed.version !== TRUCK_LISTING_DRAFT_VERSION ||
      !parsed.form || typeof parsed.form !== 'object' || Array.isArray(parsed.form) ||
      typeof parsed.step !== 'number' || !Number.isFinite(parsed.step)
    ) return null

    // Restore only listing fields; account fields never belong to this snapshot.
    const form = Object.fromEntries(Object.entries(defaults).map(([key, fallback]) => [
      key, typeof parsed.form?.[key] === 'string' ? parsed.form[key] : fallback,
    ])) as T

    return {
      version: TRUCK_LISTING_DRAFT_VERSION,
      form,
      plate: typeof parsed.plate === 'string' ? parsed.plate : '',
      fipe: {
        price: typeof parsed.fipe?.price === 'number' && Number.isFinite(parsed.fipe.price) ? parsed.fipe.price : null,
        reference: typeof parsed.fipe?.reference === 'string' ? parsed.fipe.reference : null,
      },
      step: Math.min(4, Math.max(1, Math.trunc(parsed.step))),
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    }
  } catch {
    return null
  }
}

function openImageDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('Armazenamento de fotos indisponível.'))

  return new Promise((resolve, reject) => {
    let blocked = false
    const request = indexedDB.open(IMAGE_DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(IMAGE_STORE_NAME)) {
        request.result.createObjectStore(IMAGE_STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => {
      if (blocked) request.result.close()
      else resolve(request.result)
    }
    request.onerror = () => reject(request.error ?? new Error('Não foi possível abrir o rascunho.'))
    request.onblocked = () => {
      blocked = true
      reject(new Error('O armazenamento do rascunho está bloqueado.'))
    }
  })
}

function writeImages(images: TruckListingDraftImage[]): Promise<void> {
  // Keep autosaves and successful-publication cleanup in their requested order.
  const write = imageWriteQueue.catch(() => undefined).then(async () => {
    const database = await openImageDatabase()
    try {
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(IMAGE_STORE_NAME, 'readwrite')
        transaction.oncomplete = () => resolve()
        transaction.onerror = transaction.onabort = () => reject(transaction.error ?? new Error('Não foi possível salvar as fotos.'))
        const store = transaction.objectStore(IMAGE_STORE_NAME)
        store.clear()
        images.forEach((image) => store.put(image))
      })
    } finally {
      database.close()
    }
  })
  imageWriteQueue = write
  return write
}

export function saveTruckListingDraftImages(images: TruckListingDraftImage[]): Promise<void> {
  return writeImages(images)
}

export async function loadTruckListingDraftImages(): Promise<TruckListingDraftImage[]> {
  await imageWriteQueue.catch(() => undefined)
  const database = await openImageDatabase()
  try {
    return await new Promise<TruckListingDraftImage[]>((resolve, reject) => {
      const transaction = database.transaction(IMAGE_STORE_NAME, 'readonly')
      const request = transaction.objectStore(IMAGE_STORE_NAME).getAll()
      transaction.oncomplete = () => {
        const images = (request.result as TruckListingDraftImage[]).filter((image) => (
          image && typeof image.id === 'string' && typeof image.name === 'string' &&
          typeof image.type === 'string' && typeof image.lastModified === 'number' &&
          image.blob instanceof Blob
        ))
        resolve(images.sort((a, b) => a.id.localeCompare(b.id)))
      }
      transaction.onerror = transaction.onabort = () => reject(transaction.error ?? new Error('Não foi possível recuperar as fotos.'))
    })
  } finally {
    database.close()
  }
}

export function clearTruckListingDraftImages(): Promise<void> {
  return writeImages([])
}
