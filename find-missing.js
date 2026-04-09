const fs = require('fs');
const path = require('path');

const ASSETS_PATH = path.join(__dirname, 'public/assets/cars');
const DATA_PATH = path.join(__dirname, 'src/data/cars');

const files = ['hatches.ts', 'sedans.ts', 'suvs.ts', 'pickups.ts', 'electric.ts'];

function extractCarData(filePath) {
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

console.log(JSON.stringify(missing, null, 2));
