#!/usr/bin/env python3
import os
import re
from pathlib import Path
from typing import Dict, List

from huggingface_hub import InferenceClient


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "src" / "data" / "cars"
ASSETS_DIR = ROOT / "public" / "assets" / "cars"
MANIFEST_PATH = ROOT / "src" / "data" / "carAssetManifest.ts"

HF_TOKEN = os.getenv("HF_TOKEN")
if not HF_TOKEN:
    raise SystemExit("Missing HF_TOKEN")

BRAND_FILTER = os.getenv("BRAND", "").strip().lower()
FORCE = os.getenv("FORCE", "0") == "1"
LIMIT = int(os.getenv("LIMIT", "0") or "0")

# User requested models
MODELS = [
    "black-forest-labs/FLUX.1-dev",
    "stabilityai/stable-diffusion-xl-base-1.0",
]

# Official provider suggested by HF docs for text-to-image
PROVIDERS = [
    "wavespeed",
    "fal-ai",
    "replicate",
]


def parse_cars() -> List[Dict[str, str]]:
    cars: List[Dict[str, str]] = []
    for ts_file in DATA_DIR.glob("*.ts"):
        content = ts_file.read_text(encoding="utf-8")
        blocks = re.findall(r"\{[\s\S]*?\n  \}", content)
        for block in blocks:
            brand = re.search(r"brand:\s*['\"]([^'\"]+)['\"]", block)
            model = re.search(r"model:\s*['\"]([^'\"]+)['\"]", block)
            year = re.search(r"year:\s*(\d{4})", block)
            image = re.search(r"image:\s*['\"](/assets/cars/[^'\"]+\.png)['\"]", block)
            if not (brand and model and year and image):
                continue
            cars.append(
                {
                    "brand": brand.group(1),
                    "model": model.group(1),
                    "year": year.group(1),
                    "image": image.group(1),
                }
            )

    # de-dup by image path
    unique = {}
    for car in cars:
        unique[car["image"]] = car
    return list(unique.values())


def prompt_for(car: Dict[str, str]) -> str:
    return (
        f"{car['brand']} {car['model']} {car['year']}, carro em um estudio, "
        "com fundo branco, imagem realista, fotografia automotiva profissional, "
        "carro inteiro visível em ângulo 3/4 dianteiro, sem texto, sem marca d'água, sem pessoas."
    )


def write_manifest() -> None:
    files = sorted([p.name for p in ASSETS_DIR.glob("*.png")])
    lines = "\n".join([f"  '/assets/cars/{name}'," for name in files])
    content = (
        "// Auto-generated from public/assets/cars.\n"
        f"export const availableCarAssetPaths = new Set<string>([\n{lines}\n])\n"
    )
    MANIFEST_PATH.write_text(content, encoding="utf-8")


def try_generate_image(prompt: str):
    last_error = None
    for provider in PROVIDERS:
        client = InferenceClient(provider=provider, api_key=HF_TOKEN)
        for model in MODELS:
            try:
                image = client.text_to_image(prompt, model=model)
                return image, provider, model
            except Exception as exc:
                last_error = exc
                print(f"model failed: provider={provider} model={model} -> {exc}")
    raise RuntimeError(str(last_error) if last_error else "No provider/model succeeded")


def main() -> None:
    ASSETS_DIR.mkdir(parents=True, exist_ok=True)
    cars = parse_cars()
    if BRAND_FILTER:
        cars = [c for c in cars if c["brand"].lower() == BRAND_FILTER]
    if not FORCE:
        cars = [c for c in cars if not (ROOT / "public" / c["image"].lstrip("/")).exists()]
    if LIMIT > 0:
        cars = cars[:LIMIT]

    print(f"Targets: {len(cars)}")
    ok = 0
    fail = 0
    for car in cars:
        output = ROOT / "public" / car["image"].lstrip("/")
        output.parent.mkdir(parents=True, exist_ok=True)
        prompt = prompt_for(car)
        try:
            image, provider, model = try_generate_image(prompt)
            image.save(output, format="PNG")
            ok += 1
            print(f"OK [{provider}] [{model}] {car['brand']} {car['model']} {car['year']} -> {car['image']}")
        except Exception as exc:
            fail += 1
            print(f"ERR {car['brand']} {car['model']} {car['year']}: {exc}")

    write_manifest()
    print(f"Done. success={ok} fail={fail}")


if __name__ == "__main__":
    main()

