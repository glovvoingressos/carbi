const fs = require('fs');
const path = require('path');

const ASSETS_PATH = path.join(process.cwd(), 'public/assets/cars');
const DATA_PATH = path.join(process.cwd(), 'src/data/cars');

const files = ['hatches.ts', 'sedans.ts', 'suvs.ts', 'pickups.ts', 'electric.ts'];

function extractCarData(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    // More robust regex to find car objects
    // It captures id, brand, model, and year even if other fields are in between
    const carBlocks = content.split(/\{/).slice(1);
    
    const cars = [];
    for (const block of carBlocks) {
        const idMatch = block.match(/id:\s*"([^"]+)"/);
        const brandMatch = block.match(/brand:\s*"([^"]+)"/);
        const modelMatch = block.match(/model:\s*"([^"]+)"/);
        const yearMatch = block.match(/year:\s*(\d+)/);
        
        if (idMatch && brandMatch && modelMatch && yearMatch) {
            cars.push({
                id: idMatch[1],
                brand: brandMatch[1],
                model: modelMatch[1],
                year: yearMatch[1]
            });
        }
    }
    return cars;
}

if (!fs.existsSync(ASSETS_PATH)) {
    fs.mkdirSync(ASSETS_PATH, { recursive: true });
}

const allCars = files.flatMap(file => extractCarData(path.join(DATA_PATH, file)));
// Deduplicate by ID
const uniqueCars = Array.from(new Map(allCars.map(car => [car.id, car])).values());

const existingAssets = fs.readdirSync(ASSETS_PATH).map(f => f.replace('.png', ''));

const missing = uniqueCars.filter(car => !existingAssets.includes(car.id));

console.log(`Inventory Summary:`);
console.log(`Total Cars in Database: ${uniqueCars.length}`);
console.log(`Existing Assets: ${existingAssets.length}`);
console.log(`Missing Assets: ${missing.length}`);

const prompts = missing.map(car => ({
    id: car.id,
    prompt: `Industrial studio cinematography of a ${car.year} ${car.brand} ${car.model}. Dramatic automotive studio lighting, clean solid off-white background, side profile shot, 8k resolution, ultra-realistic textures, neutral colors, minimalist premium aesthetic.`
}));

fs.writeFileSync(path.join(process.cwd(), 'scripts/missing-assets-prompts.json'), JSON.stringify(prompts, null, 2));

console.log(`\nPrompts generated for ${missing.length} vehicles and saved to scripts/missing-assets-prompts.json`);
