/**
 * FIPE API Integration Utility
 * Powered by fipe.online (Parallelum API)
 */

export interface FipeItem {
  name: string;
  code: string;
}

export interface FipeResult {
  vehicleType: number;
  price: string;
  brand: string;
  model: string;
  modelYear: number;
  fuel: string;
  codeFipe: string;
  referenceMonth: string;
  fuelAcronym: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_FIPE_API_BASE_URL || 'https://fipe.parallelum.com.br/api/v2';
const TOKEN = process.env.FIPE_API_TOKEN;

/**
 * Normalizes strings for better fuzzy matching
 */
function normalize(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Fetch helper with authentication
 */
async function fetchFipe<T>(endpoint: string): Promise<T | null> {
  if (!TOKEN) {
    console.warn('FIPE_API_TOKEN is missing.');
    return null;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'X-Subscription-Token': TOKEN,
      },
      next: { revalidate: 86400 } // Cache for 24 hours
    });

    if (!response.ok) {
      console.error(`FIPE API error: ${response.status} ${response.statusText} at ${endpoint}`);
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error(`FIPE API fetch failed at ${endpoint}:`, err);
    return null;
  }
}

/**
 * Public metadata fetchers
 */
export async function getFipeBrands(): Promise<FipeItem[]> {
  return (await fetchFipe<FipeItem[]>('/cars/brands')) || [];
}

export async function getFipeModels(brandCode: string): Promise<FipeItem[]> {
  return (await fetchFipe<FipeItem[]>(`/cars/brands/${brandCode}/models`)) || [];
}

export async function getFipeYears(brandCode: string, modelCode: string): Promise<FipeItem[]> {
  return (await fetchFipe<FipeItem[]>(`/cars/brands/${brandCode}/models/${modelCode}/years`)) || [];
}

export async function getFipeDetailByCode(brandCode: string, modelCode: string, yearCode: string): Promise<FipeResult | null> {
  return await fetchFipe<FipeResult>(`/cars/brands/${brandCode}/models/${modelCode}/years/${yearCode}`);
}

/**
 * Cascading search to find the price of a vehicle by name
 */
export async function getFipePrice(brandName: string, modelName: string, year: number | string): Promise<FipeResult | null> {
  // 1. Find Brand
  const brands = await getFipeBrands();
  const normalizedBrand = normalize(brandName);
  const brand = brands.find(b => normalize(b.name) === normalizedBrand) 
               || brands.find(b => normalize(b.name).includes(normalizedBrand));
  
  if (!brand) return null;

  // 2. Find Model
  const models = await getFipeModels(brand.code);
  const normalizedModel = normalize(modelName);
  let model = models.find(m => normalize(m.name) === normalizedModel);
  if (!model) {
     model = models.find(m => normalize(m.name).includes(normalizedModel))
          || models.find(m => normalizedModel.includes(normalize(m.name)));
  }

  if (!model) return null;

  // 3. Find Year
  const years = await getFipeYears(brand.code, model.code);
  const yearStr = year.toString();
  const yearMatch = years.find(y => y.name.includes(yearStr)) || years[0];

  if (!yearMatch) return null;

  // 4. Get Final Result
  return await getFipeDetailByCode(brand.code, model.code, yearMatch.code);
}
