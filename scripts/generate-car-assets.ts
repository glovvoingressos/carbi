import * as fs from 'fs';
import * as path from 'path';

// Note: This script is intended to be run in a Node environment during build/deployment.
// It inventories existing assets and generates prompts for missing ones.

const ASSETS_PATH = path.join(process.cwd(), 'public/assets/cars');
const DATA_PATH = path.join(process.cwd(), 'src/data/cars');

const files = ['hatches.ts', 'sedans.ts', 'suvs.ts', 'pickups.ts', 'electric.ts'];

function extractCarData(filePath: string) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const carRegex = /id:\s*"([^"]+)",\s*brand:\s*"([^"]+)",\s*model:\s*"([^"]+)",\s*year:\s*(\d+)/g;
    const matches = [];
    let match;
    while ((match = carRegex.exec(content)) !== null) {
        matches.push({
            id: match[1],
            brand: match[2],
            model: match[3],
            year: match[4]
        });
    }
    return matches;
}

const allCars = files.flatMap(file => extractCarData(path.join(DATA_PATH, file)));
const existingAssets = fs.readdirSync(ASSETS_PATH);

const missing = allCars.filter(car => !existingAssets.includes(`${car.id}.png`));

console.log(`Inventory Summary:`);
console.log(`Total Cars in Database: ${allCars.length}`);
console.log(`Existing Assets: ${existingAssets.length}`);
console.log(`Missing Assets: ${missing.length}`);

const prompts = missing.map(car => ({
    id: car.id,
    prompt: `${car.brand} ${car.model} ${car.year}, official studio car photography, high-end automotive lighting, clean solid white background, 3/4 front view profile, cinematic lighting, 8k resolution, photorealistic, premium automotive marketing style.`
}));

fs.writeFileSync(path.join(process.cwd(), 'scripts/missing-assets-prompts.json'), JSON.stringify(prompts, null, 2));

console.log(`\nPrompts generated and saved to scripts/missing-assets-prompts.json`);
