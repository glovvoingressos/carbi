import { Calendar, Car, Fuel, Gauge, MapPin, Settings2 } from 'lucide-react'
import { formatBRL } from '@/data/cars'
import { formatBrazilianInt, parseMoneyInputToNumber } from '@/lib/marketplace'

export type ListingLivePreviewProps = {
  brand?: string
  model?: string
  version?: string
  year?: string
  yearModel?: string
  price?: string
  mileage?: string
  transmission?: string
  fuel?: string
  city?: string
  state?: string
  imageUrl?: string | null
  fipePrice?: string | null
  fipePercent?: number | null
}

export default function ListingLivePreview({
  brand = '',
  model = '',
  version = '',
  year = '',
  yearModel = '',
  price = '',
  mileage = '',
  transmission = '',
  fuel = '',
  city = '',
  state = '',
  imageUrl = null,
  fipePrice = null,
  fipePercent = null,
}: ListingLivePreviewProps) {
  const hasVehicle = Boolean(brand.trim() || model.trim())
  const priceNumber = parseMoneyInputToNumber(price)
  const mileageNumber = Number(mileage) || 0
  const title = [brand, model].filter(Boolean).join(' ').trim()
  const yearLabel = [year, yearModel].filter(Boolean).join('/')
  const location = [city, state].filter(Boolean).join(', ')

  return (
    <article className="lf-preview" aria-label="Prévia do anúncio">
      <div className="lf-preview-media">
        <span className="lf-preview-live">Prévia ao vivo</span>
        {imageUrl ? (
          // Object URL local da foto escolhida; não é uma imagem publicada ainda.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={title ? `Prévia de ${title}` : 'Prévia do anúncio'} />
        ) : (
          <div className="lf-preview-placeholder">
            <Car size={34} strokeWidth={1.5} aria-hidden="true" />
            <strong>{hasVehicle ? brand || 'Seu carro' : 'Seu carro'}</strong>
          </div>
        )}
      </div>

      <div className="lf-preview-body">
        {hasVehicle ? (
          <>
            <p className="lf-preview-eyebrow">{brand || 'Marca'}</p>
            <h3 className="lf-preview-title">{model || 'Modelo'}{version ? ` ${version}` : ''}</h3>
            <p className="lf-preview-price">{priceNumber > 0 ? formatBRL(priceNumber) : 'Preço a definir'}</p>

            <div className="lf-preview-chips">
              {yearLabel ? <span><Calendar size={11} aria-hidden="true" />{yearLabel}</span> : null}
              {mileageNumber > 0 ? <span><Gauge size={11} aria-hidden="true" />{formatBrazilianInt(mileageNumber)} km</span> : null}
              {transmission ? <span><Settings2 size={11} aria-hidden="true" />{transmission}</span> : null}
              {fuel ? <span><Fuel size={11} aria-hidden="true" />{fuel}</span> : null}
              {location ? <span><MapPin size={11} aria-hidden="true" />{location}</span> : null}
            </div>

            <div className="lf-preview-fipe">
              <span>Tabela FIPE</span>
              {fipePrice ? (
                <strong>
                  {fipePrice}
                  {fipePercent !== null ? ` · ${fipePercent > 0 ? '+' : ''}${fipePercent}%` : ''}
                </strong>
              ) : (
                <strong>Será consultada</strong>
              )}
            </div>
          </>
        ) : (
          <>
            <p className="lf-preview-eyebrow">Seu anúncio</p>
            <h3 className="lf-preview-title">A prévia aparece aqui</h3>
            <p className="lf-preview-price">Comece pela placa</p>
            <p className="lf-card-sub">Marca, modelo, preço e fotos vão se atualizando enquanto você preenche.</p>
          </>
        )}
      </div>
    </article>
  )
}
