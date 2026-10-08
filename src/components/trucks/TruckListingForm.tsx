'use client'

import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, ArrowRight, Camera, Check, Loader2, X } from 'lucide-react'
import AuthCard from '@/components/marketplace/AuthCard'
import ListingStepper from '@/components/marketplace/ListingStepper'
import PlateInput from '@/components/marketplace/PlateInput'
import { normalizePlateFinal } from '@/lib/marketplace'
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from '@/lib/supabase-browser'
import { TRUCK_CATEGORIES } from '@/lib/truck-seo'
import '@/components/marketplace/listing-flow.css'

/* Fluxo próprio de caminhão: usa a mesma API de anúncios e a mesma consulta de
   placa, mas tem as próprias etapas, campos (eixos, PBT, CMT, carroceria) e
   regras de validação. O visual é o do fluxo de carro. */

const MAX_PHOTOS = 10
const MAX_PHOTO_BYTES = 10 * 1024 * 1024
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const BODY_TYPES = ['Baú', 'Sider', 'Graneleiro', 'Tanque', 'Carga seca', 'Baú frigorífico', 'Boiadeira', 'Basculante', 'Plataforma', 'Outra']
const CABIN_TYPES = ['Leito', 'Teto baixo', 'Teto alto', 'Dupla']
const FUELS = ['Diesel', 'Gasolina', 'Flex', 'Elétrico', 'Gás']
const TRANSMISSIONS = ['Manual', 'Automatizado', 'Automático']
const UF_OPTIONS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']

type TruckForm = {
  brand: string
  model: string
  version: string
  year: string
  yearModel: string
  color: string
  truckType: string
  axles: string
  loadCapacity: string
  pbt: string
  cmt: string
  bodyType: string
  cabin: string
  category: string
  price: string
  mileage: string
  fuel: string
  transmission: string
  city: string
  state: string
  description: string
}

const EMPTY_FORM: TruckForm = {
  brand: '', model: '', version: '', year: '', yearModel: '', color: '',
  truckType: '', axles: '', loadCapacity: '', pbt: '', cmt: '', bodyType: '', cabin: '', category: '',
  price: '', mileage: '', fuel: 'Diesel', transmission: '', city: '', state: '', description: '',
}

type Photo = { file: File; preview: string }
type Errors = Partial<Record<keyof TruckForm | 'photos', string>>

function digits(value: string): number {
  return Number(value.replace(/\D/g, ''))
}

/** Casa o texto vindo da consulta de placa com uma opção da lista (sem acento e sem caixa). */
function matchOption(options: readonly string[], value: string | null | undefined): string {
  if (!value) return ''
  const fold = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  const target = fold(value)
  return options.find((option) => fold(option) === target) || ''
}

function matchTruckType(value: string | null | undefined): string {
  if (!value) return ''
  const fold = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  const target = fold(value)
  const found = TRUCK_CATEGORIES.find((category) => fold(category.name) === target || category.slug === target)
  return found ? found.slug : ''
}

function validateStepVehicle(form: TruckForm): Errors {
  const errors: Errors = {}
  const year = digits(form.year)
  const yearModel = digits(form.yearModel)
  if (!form.brand.trim()) errors.brand = 'Informe a marca.'
  if (!form.model.trim()) errors.model = 'Informe o modelo.'
  if (year < 1950 || year > 2100) errors.year = 'Ano de fabricação inválido.'
  if (yearModel < 1950 || yearModel > 2100) errors.yearModel = 'Ano do modelo inválido.'
  if (!form.truckType) errors.truckType = 'Escolha o tipo de caminhão.'
  if (!form.axles || digits(form.axles) < 2) errors.axles = 'Informe o número de eixos (mínimo 2).'
  if (!form.loadCapacity || digits(form.loadCapacity) <= 0) errors.loadCapacity = 'Informe a capacidade de carga em kg.'
  return errors
}

function validateStepSale(form: TruckForm, photoCount: number): Errors {
  const errors: Errors = {}
  if (digits(form.price) <= 0) errors.price = 'Informe o preço pedido.'
  if (form.mileage === '') errors.mileage = 'Informe a quilometragem.'
  if (!form.fuel) errors.fuel = 'Selecione o combustível.'
  if (!form.transmission) errors.transmission = 'Selecione o câmbio.'
  if (!form.city.trim()) errors.city = 'Informe a cidade.'
  if (!UF_OPTIONS.includes(form.state)) errors.state = 'Selecione o estado.'
  if (photoCount === 0) errors.photos = 'Adicione pelo menos uma foto.'
  return errors
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="listing-flow-field-label">{label}</label>
      {children}
      {error ? <p className="listing-field-error mt-1 flex items-center gap-1"><AlertCircle size={13} aria-hidden="true" />{error}</p> : null}
    </div>
  )
}

export default function TruckListingForm() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<TruckForm>(EMPTY_FORM)
  const [plate, setPlate] = useState('')
  const [fipe, setFipe] = useState<{ price: number | null; reference: string | null }>({ price: null, reference: null })
  const [photos, setPhotos] = useState<Photo[]>([])
  const [errors, setErrors] = useState<Errors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [details, setDetails] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [needsAuth, setNeedsAuth] = useState(false)

  const set = (field: keyof TruckForm) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const goTo = (next: number) => {
    setFormError(null)
    setDetails([])
    setStep(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNext = () => {
    if (step === 1) {
      const found = validateStepVehicle(form)
      setErrors(found)
      if (Object.keys(found).length > 0) return
      goTo(2)
      return
    }
    if (step === 2) {
      const found = validateStepSale(form, photos.length)
      setErrors(found)
      if (Object.keys(found).length > 0) return
      goTo(3)
    }
  }

  const handlePlateFound = (data: Parameters<NonNullable<React.ComponentProps<typeof PlateInput>['onPlateFound']>>[0]) => {
    setPlate(data.plate || '')
    setFipe({ price: data.fipePrice ?? null, reference: data.fipeReference ?? null })
    setForm((prev) => ({
      ...prev,
      brand: data.brand || prev.brand,
      model: data.model || prev.model,
      version: data.version || prev.version,
      year: data.year ? String(data.year) : prev.year,
      yearModel: data.yearModel ? String(data.yearModel) : prev.yearModel,
      color: data.color || prev.color,
      truckType: matchTruckType(data.truck_type) || prev.truckType,
      axles: data.axles != null ? String(data.axles) : prev.axles,
      loadCapacity: data.load_capacity != null ? String(data.load_capacity) : prev.loadCapacity,
      pbt: data.pbt != null ? String(data.pbt) : prev.pbt,
      cmt: data.cmt != null ? String(data.cmt) : prev.cmt,
      bodyType: matchOption(BODY_TYPES, data.truck_body_type) || prev.bodyType,
      cabin: matchOption(CABIN_TYPES, data.cabin_type) || prev.cabin,
      category: data.truck_category || prev.category,
      fuel: matchOption(FUELS, data.fuel) || prev.fuel,
      transmission: matchOption(TRANSMISSIONS, data.transmission) || prev.transmission,
    }))
    setErrors({})
  }

  const addPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files || [])
    event.target.value = ''
    const accepted: Photo[] = []
    let problem: string | null = null
    for (const file of incoming) {
      if (!PHOTO_TYPES.includes(file.type)) { problem = 'Use fotos em JPG, PNG ou WEBP.'; continue }
      if (file.size > MAX_PHOTO_BYTES) { problem = 'Cada foto pode ter até 10 MB.'; continue }
      accepted.push({ file, preview: URL.createObjectURL(file) })
    }
    const room = MAX_PHOTOS - photos.length
    if (accepted.length > room) problem = `Você pode enviar até ${MAX_PHOTOS} fotos.`
    const next = [...photos, ...accepted.slice(0, Math.max(room, 0))]
    setPhotos(next)
    setErrors((prev) => ({ ...prev, photos: problem ?? undefined }))
  }

  const removePhoto = (index: number) => {
    const target = photos[index]
    if (target) URL.revokeObjectURL(target.preview)
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const buildPayload = () => {
    const plateFinal = normalizePlateFinal(plate)
    return {
      title: [form.brand, form.model, form.yearModel].join(' ').replace(/\s+/g, ' ').trim(),
      description: form.description.trim() || null,
      vehicle_type: 'truck',
      brand: form.brand.trim(),
      model: form.model.trim(),
      version: form.version.trim() || null,
      year: digits(form.year),
      year_model: digits(form.yearModel),
      mileage: digits(form.mileage),
      price: digits(form.price),
      transmission: form.transmission,
      fuel: form.fuel,
      color: form.color.trim() || 'Não informado',
      body_type: 'Caminhão',
      city: form.city.trim(),
      state: form.state,
      optional_items: [],
      engine: null,
      horsepower: null,
      plate_final: plateFinal,
      doors: null,
      vin: null,
      truck_type: form.truckType,
      load_capacity: digits(form.loadCapacity),
      axles: digits(form.axles),
      truck_body_type: form.bodyType || null,
      cabin_type: form.cabin || null,
      pbt: form.pbt ? digits(form.pbt) : null,
      cmt: form.cmt ? digits(form.cmt) : null,
      truck_category: form.category || null,
      fipe_price: fipe.price,
      fipe_reference_month: fipe.reference,
      structured_data: { source: 'truck_flow' },
    }
  }

  const publish = async () => {
    setFormError(null)
    setDetails([])
    if (!isSupabaseBrowserConfigured()) {
      setFormError('Serviço indisponível no momento. Tente novamente mais tarde.')
      return
    }
    setSaving(true)
    let createdId: string | null = null
    let uploadedPaths: string[] = []
    try {
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token || !session.user?.id) {
        setNeedsAuth(true)
        return
      }
      const headers = { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' }

      const createResponse = await fetch('/api/marketplace/listings', {
        method: 'POST',
        headers,
        body: JSON.stringify(buildPayload()),
      })
      if (!createResponse.ok) {
        const body = await createResponse.json().catch(() => ({}))
        setDetails(Array.isArray(body?.details) ? body.details.filter((item: unknown): item is string => typeof item === 'string') : [])
        throw new Error(body.error || 'Falha ao criar anúncio.')
      }
      const created = (await createResponse.json()) as { id: string; slug: string }
      createdId = created.id

      const uploaded: Array<{ storage_path: string; public_url: string; sort_order: number; is_primary: boolean }> = []
      for (let i = 0; i < photos.length; i += 1) {
        const file = photos[i].file
        const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '-')
        const storagePath = `${session.user.id}/${created.id}/${String(i + 1).padStart(2, '0')}-${Date.now()}-${safeName}`
        const { error: uploadError } = await supabase.storage
          .from('vehicle-listings')
          .upload(storagePath, file, { upsert: false, contentType: file.type })
        if (uploadError) throw new Error(`Falha no upload de imagem: ${uploadError.message}`)
        uploadedPaths = [...uploadedPaths, storagePath]
        const { data: urlData } = supabase.storage.from('vehicle-listings').getPublicUrl(storagePath)
        uploaded.push({ storage_path: storagePath, public_url: urlData.publicUrl, sort_order: i, is_primary: i === 0 })
      }

      const imageResponse = await fetch(`/api/marketplace/listings/${created.id}/images`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ images: uploaded }),
      })
      if (!imageResponse.ok) {
        const body = await imageResponse.json().catch(() => ({}))
        throw new Error(body.error || 'Falha ao salvar as fotos do anúncio.')
      }

      router.push(`/caminhoes/anuncio/${created.slug}`)
    } catch (error) {
      // Se as fotos não subiram, remove o que foi enviado e o anúncio incompleto.
      if (uploadedPaths.length > 0) {
        await getSupabaseBrowserClient().storage.from('vehicle-listings').remove(uploadedPaths).catch(() => null)
      }
      if (createdId) {
        const session = await getSupabaseBrowserClient().auth
          .getSession()
          .then((r: { data: { session: { access_token: string } | null } }) => r.data.session)
          .catch(() => null)
        await fetch(`/api/marketplace/listings/${createdId}`, {
          method: 'DELETE',
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        }).catch(() => null)
      }
      setFormError(error instanceof Error ? error.message : 'Não foi possível publicar o anúncio.')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (step === 3) void publish()
    else handleNext()
  }

  return (
    <>
      <form className="space-y-6 w-full pb-4" onSubmit={handleSubmit} aria-busy={saving} noValidate>
      <ListingStepper currentStep={step} onStepChange={(target) => { if (target < step) goTo(target) }} />

      {step === 1 ? (
        <div className="space-y-6">
          <div>
            <h2 className="tfp-section-title">Dados do caminhão</h2>
            <p className="tfp-section-sub">Consulte a placa para preencher os dados ou preencha manualmente.</p>
          </div>

          <div className="fingen-flow-substep-card p-3 sm:p-5">
            <PlateInput onPlateFound={handlePlateFound} />
          </div>

          <div className="fingen-flow-substep-card p-3 sm:p-5 space-y-4">
            <p className="fingen-flow-field-label">Identificação</p>
            <div className="grid grid-cols-2 gap-3">
              <Field id="truck-brand" label="Marca" error={errors.brand}>
                <input id="truck-brand" className="fingen-flow-input" value={form.brand} onChange={set('brand')} placeholder="Ex: Scania" />
              </Field>
              <Field id="truck-model" label="Modelo" error={errors.model}>
                <input id="truck-model" className="fingen-flow-input" value={form.model} onChange={set('model')} placeholder="Ex: R 450" />
              </Field>
              <Field id="truck-year" label="Ano de fabricação" error={errors.year}>
                <input id="truck-year" className="fingen-flow-input" inputMode="numeric" maxLength={4} value={form.year} onChange={set('year')} placeholder="2019" />
              </Field>
              <Field id="truck-year-model" label="Ano do modelo" error={errors.yearModel}>
                <input id="truck-year-model" className="fingen-flow-input" inputMode="numeric" maxLength={4} value={form.yearModel} onChange={set('yearModel')} placeholder="2020" />
              </Field>
              <Field id="truck-color" label="Cor">
                <input id="truck-color" className="fingen-flow-input" value={form.color} onChange={set('color')} placeholder="Ex: Branco" />
              </Field>
            </div>
          </div>

          <div className="fingen-flow-substep-card p-3 sm:p-5 space-y-4">
            <p className="fingen-flow-field-label">Ficha técnica</p>
            <div className="grid grid-cols-2 gap-3">
              <Field id="truck-type" label="Tipo de caminhão" error={errors.truckType}>
                <select id="truck-type" className="fingen-flow-input" value={form.truckType} onChange={set('truckType')}>
                  <option value="">Selecione</option>
                  {TRUCK_CATEGORIES.map((category) => (
                    <option key={category.slug} value={category.slug}>{category.name}</option>
                  ))}
                </select>
              </Field>
              <Field id="truck-axles" label="Eixos" error={errors.axles}>
                <input id="truck-axles" className="fingen-flow-input" inputMode="numeric" value={form.axles} onChange={set('axles')} placeholder="Ex: 6" />
              </Field>
              <Field id="truck-load" label="Capacidade de carga (kg)" error={errors.loadCapacity}>
                <input id="truck-load" className="fingen-flow-input" inputMode="numeric" value={form.loadCapacity} onChange={set('loadCapacity')} placeholder="Ex: 14000" />
              </Field>
              <Field id="truck-pbt" label="PBT (kg)">
                <input id="truck-pbt" className="fingen-flow-input" inputMode="numeric" value={form.pbt} onChange={set('pbt')} placeholder="Opcional" />
              </Field>
              <Field id="truck-cmt" label="CMT (kg)">
                <input id="truck-cmt" className="fingen-flow-input" inputMode="numeric" value={form.cmt} onChange={set('cmt')} placeholder="Opcional" />
              </Field>
              <Field id="truck-body" label="Carroceria">
                <select id="truck-body" className="fingen-flow-input" value={form.bodyType} onChange={set('bodyType')}>
                  <option value="">Não informada</option>
                  {BODY_TYPES.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </Field>
              <Field id="truck-cabin" label="Cabine">
                <select id="truck-cabin" className="fingen-flow-input" value={form.cabin} onChange={set('cabin')}>
                  <option value="">Não informada</option>
                  {CABIN_TYPES.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </Field>
            </div>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-6">
          <div>
            <h2 className="tfp-section-title">Preço e fotos</h2>
            <p className="tfp-section-sub">Defina o preço, informe o estado do caminhão e adicione fotos.</p>
          </div>

          <div className="fingen-flow-substep-card p-3 sm:p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field id="truck-price" label="Preço pedido (R$)" error={errors.price}>
                <input id="truck-price" className="fingen-flow-input" inputMode="numeric" value={form.price} onChange={set('price')} placeholder="Ex: 185000" />
              </Field>
              <Field id="truck-mileage" label="Quilometragem (km)" error={errors.mileage}>
                <input id="truck-mileage" className="fingen-flow-input" inputMode="numeric" value={form.mileage} onChange={set('mileage')} placeholder="Ex: 420000" />
              </Field>
              <Field id="truck-fuel" label="Combustível" error={errors.fuel}>
                <select id="truck-fuel" className="fingen-flow-input" value={form.fuel} onChange={set('fuel')}>
                  <option value="">Selecione</option>
                  {FUELS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </Field>
              <Field id="truck-transmission" label="Câmbio" error={errors.transmission}>
                <select id="truck-transmission" className="fingen-flow-input" value={form.transmission} onChange={set('transmission')}>
                  <option value="">Selecione</option>
                  {TRANSMISSIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </Field>
              <Field id="truck-city" label="Cidade" error={errors.city}>
                <input id="truck-city" className="fingen-flow-input" value={form.city} onChange={set('city')} placeholder="Ex: Campinas" />
              </Field>
              <Field id="truck-state" label="Estado (UF)" error={errors.state}>
                <select id="truck-state" className="fingen-flow-input" value={form.state} onChange={set('state')}>
                  <option value="">Selecione</option>
                  {UF_OPTIONS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </Field>
            </div>
          </div>

          <div className="fingen-flow-substep-card p-3 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="fingen-flow-field-label">Fotos ({photos.length}/{MAX_PHOTOS})</p>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#111] px-4 py-2 text-[13px] font-semibold text-white">
                <Camera size={16} aria-hidden="true" /> Adicionar fotos
                <input type="file" accept={PHOTO_TYPES.join(',')} multiple className="sr-only" onChange={addPhotos} />
              </label>
            </div>
            {errors.photos ? <p className="listing-field-error flex items-center gap-1"><AlertCircle size={13} aria-hidden="true" />{errors.photos}</p> : null}
            {photos.length > 0 ? (
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {photos.map((photo, index) => (
                  <li key={photo.preview} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#efefec]">
                    <img src={photo.preview} alt={`Foto ${index + 1} do caminhão`} className="h-full w-full object-cover" />
                    {index === 0 ? <span className="absolute left-2 top-2 rounded-full bg-[#111] px-2 py-0.5 text-[10px] font-bold text-white">Capa</span> : null}
                    <button type="button" onClick={() => removePhoto(index)} aria-label={`Remover foto ${index + 1}`} className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-[#111]">
                      <X size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="fingen-flow-substep-card p-3 sm:p-5 space-y-2">
            <Field id="truck-description" label="Descrição (opcional)">
              <textarea id="truck-description" className="fingen-flow-input listing-description-field" rows={5} value={form.description} onChange={set('description')} placeholder="Estado de conservação, revisões, documentação, o que está incluso." />
            </Field>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-6">
          <div>
            <h2 className="tfp-section-title">Confira e publique</h2>
            <p className="tfp-section-sub">Veja como o anúncio vai aparecer antes de publicar.</p>
          </div>

          <div className="fingen-flow-substep-card p-3 sm:p-5">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <dt className="text-[#5f5f5c]">Veículo</dt><dd className="font-semibold text-[#111]">{form.brand} {form.model} {form.yearModel}</dd>
              <dt className="text-[#5f5f5c]">Tipo</dt><dd className="font-semibold text-[#111]">{TRUCK_CATEGORIES.find((c) => c.slug === form.truckType)?.name || '—'}</dd>
              <dt className="text-[#5f5f5c]">Eixos</dt><dd className="font-semibold text-[#111]">{form.axles}</dd>
              <dt className="text-[#5f5f5c]">Capacidade</dt><dd className="font-semibold text-[#111]">{digits(form.loadCapacity).toLocaleString('pt-BR')} kg</dd>
              <dt className="text-[#5f5f5c]">Quilometragem</dt><dd className="font-semibold text-[#111]">{digits(form.mileage).toLocaleString('pt-BR')} km</dd>
              <dt className="text-[#5f5f5c]">Local</dt><dd className="font-semibold text-[#111]">{form.city} / {form.state}</dd>
              <dt className="text-[#5f5f5c]">Preço</dt><dd className="font-semibold text-[#111]">R$ {digits(form.price).toLocaleString('pt-BR')}</dd>
              <dt className="text-[#5f5f5c]">Fotos</dt><dd className="font-semibold text-[#111]">{photos.length}</dd>
            </dl>
          </div>

          {formError ? (
            <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#B91C1C]" role="alert">
              <p className="font-semibold">{formError}</p>
              {details.length > 0 ? <ul className="mt-2 list-disc pl-5">{details.map((detail) => <li key={detail}>{detail}</li>)}</ul> : null}
            </div>
          ) : null}

        </div>
      ) : null}

      <div className="mt-10 border-t border-[#EAEAEA] pt-8">
        <div className="flex flex-col-reverse justify-between gap-4 sm:flex-row">
          {step > 1 ? (
            <button type="button" onClick={() => goTo(step - 1)} className="tfp-btn-secondary" disabled={saving}>
              Voltar
            </button>
          ) : <div />}

          {step < 3 ? (
            <button type="submit" className="tfp-btn-primary listing-next-step-button">
              Próxima etapa <ArrowRight size={17} aria-hidden="true" />
            </button>
          ) : !needsAuth ? (
            <button type="submit" className="tfp-btn-primary listing-final-submit-button" disabled={saving}>
              {saving ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <Check size={17} aria-hidden="true" />}
              {saving ? 'Publicando…' : 'Publicar anúncio grátis'}
            </button>
          ) : null}
        </div>
      </div>
      </form>

      {/* Fora do <form>: o AuthCard renderiza o próprio <form> de login. */}
      {needsAuth ? (
        <div className="space-y-3 pt-6">
          <p className="text-sm text-[#5f5f5c]">Entre ou crie sua conta para publicar. O anúncio continua preenchido.</p>
          <AuthCard onAuthenticated={() => { setNeedsAuth(false); void publish() }} />
        </div>
      ) : null}
    </>
  )
}
