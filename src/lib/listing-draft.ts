export const LISTING_DRAFT_VERSION = 2
export const LISTING_DRAFT_KEY = 'carbi_listing_draft_v2'

export interface ListingDraftSnapshot<T> {
  version: number
  form: T
  currentStep: number
  listingSubStep: number
  updatedAt: number
}

export interface ListingDraftImage {
  id: string
  name: string
  type: string
  lastModified: number
  blob: Blob
}

const IMAGE_DB_NAME = 'carbi-listing-draft'
const IMAGE_STORE_NAME = 'images'

export function serializeListingDraft<T>(snapshot: Omit<ListingDraftSnapshot<T>, 'version' | 'updatedAt'>): string {
  return JSON.stringify({
    ...snapshot,
    version: LISTING_DRAFT_VERSION,
    updatedAt: Date.now(),
  } satisfies ListingDraftSnapshot<T>)
}

export function parseListingDraft<T>(value: string | null): ListingDraftSnapshot<T> | null {
  if (!value) return null

  try {
    const parsed = JSON.parse(value) as Partial<ListingDraftSnapshot<T>>
    if (
      parsed.version !== LISTING_DRAFT_VERSION ||
      !parsed.form ||
      typeof parsed.currentStep !== 'number' ||
      typeof parsed.listingSubStep !== 'number'
    ) {
      return null
    }

    return {
      version: LISTING_DRAFT_VERSION,
      form: parsed.form,
      currentStep: Math.min(3, Math.max(1, parsed.currentStep)),
      listingSubStep: Math.min(4, Math.max(1, parsed.listingSubStep)),
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    }
  } catch {
    return null
  }
}

function openImageDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IMAGE_DB_NAME, 1)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(IMAGE_STORE_NAME)) {
        request.result.createObjectStore(IMAGE_STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Não foi possível abrir o rascunho.'))
  })
}

export async function saveListingDraftImages(images: ListingDraftImage[]): Promise<void> {
  const database = await openImageDatabase()
  if (!database) return

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(IMAGE_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(IMAGE_STORE_NAME)
    store.clear()
    images.forEach((image) => store.put(image))
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Não foi possível salvar as fotos.'))
  }).finally(() => database.close())
}

export async function loadListingDraftImages(): Promise<ListingDraftImage[]> {
  const database = await openImageDatabase()
  if (!database) return []

  return new Promise<ListingDraftImage[]>((resolve, reject) => {
    const transaction = database.transaction(IMAGE_STORE_NAME, 'readonly')
    const request = transaction.objectStore(IMAGE_STORE_NAME).getAll()
    request.onsuccess = () => resolve((request.result as ListingDraftImage[]) || [])
    request.onerror = () => reject(request.error ?? new Error('Não foi possível recuperar as fotos.'))
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => {
      database.close()
      reject(transaction.error ?? new Error('Não foi possível recuperar as fotos.'))
    }
  })
}

export async function clearListingDraftImages(): Promise<void> {
  const database = await openImageDatabase()
  if (!database) return

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(IMAGE_STORE_NAME, 'readwrite')
    transaction.objectStore(IMAGE_STORE_NAME).clear()
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Não foi possível limpar as fotos.'))
  }).finally(() => database.close())
}
