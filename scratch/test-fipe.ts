import { getFipeBrands, getFipeModels, getFipeYears, getFipeVersionsByYear, getFipeDetailByCode } from './src/lib/fipe-api.ts';

async function test() {
  try {
    console.log('Testing FIPE API...');
    
    // 1. Get Brands
    const brands = await getFipeBrands('cars');
    console.log('Brands found:', brands.length);
    if (brands.length === 0) throw new Error('No brands found');
    
    // Pick Volkswagen (code 59 usually)
    const vw = brands.find(b => b.name.toLowerCase().includes('volkswagen')) || brands[0];
    console.log('Selected Brand:', vw.name, '(', vw.code, ')');
    
    // 2. Get Models
    const models = await getFipeModels(vw.code, 'cars');
    console.log('Models found:', models.length);
    if (models.length === 0) throw new Error('No models found');
    
    // Pick Golf (code 5940 usually)
    const golf = models.find(m => m.name.toLowerCase().includes('golf')) || models[0];
    console.log('Selected Model:', golf.name, '(', golf.code, ')');
    
    // 3. Get Years
    const years = await getFipeYears(vw.code, golf.code, 'cars');
    console.log('Years found:', years.length, years[0]);
    if (years.length === 0) throw new Error('No years found');
    
    // 4. Get Versions for a year
    const yearNum = parseInt(years[0].name);
    const versions = await getFipeVersionsByYear(vw.code, golf.code, yearNum, 'cars');
    console.log('Versions found for', yearNum, ':', versions.length, versions[0]);
    
    // 5. Get Detail
    const detail = await getFipeDetailByCode(vw.code, golf.code, versions[0].code, 'cars');
    console.log('Detail Result:', JSON.stringify(detail, null, 2));
    
  } catch (error) {
    console.error('Test Failed:', error);
  }
}

test();
