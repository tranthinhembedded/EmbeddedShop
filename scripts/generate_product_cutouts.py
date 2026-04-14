from __future__ import annotations

from collections import deque
from pathlib import Path
from statistics import median

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
ASSET_ROOT = ROOT / "assets" / "images"
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MARGIN = 18


def collect_border_reference(image: Image.Image) -> tuple[int, int, int]:
    width, height = image.size
    step_x = max(1, width // 24)
    step_y = max(1, height // 24)
    border_samples: list[tuple[int, int, int]] = []

    for x in range(0, width, step_x):
      border_samples.append(image.getpixel((x, 0))[:3])
      border_samples.append(image.getpixel((x, height - 1))[:3])

    for y in range(0, height, step_y):
      border_samples.append(image.getpixel((0, y))[:3])
      border_samples.append(image.getpixel((width - 1, y))[:3])

    return tuple(int(median(channel)) for channel in zip(*border_samples))


def is_background(pixel: tuple[int, int, int, int], reference: tuple[int, int, int]) -> bool:
    if pixel[3] == 0:
        return True

    diffs = [abs(pixel[index] - reference[index]) for index in range(3)]
    brightness = sum(reference) / 3
    tolerance = 30 if brightness >= 210 or brightness <= 40 else 24
    total_delta = sum(diffs)

    return max(diffs) <= tolerance and total_delta <= tolerance * 2.25


def create_cutout(source: Path) -> Path:
    image = Image.open(source).convert("RGBA")
    width, height = image.size
    pixels = image.load()
    visited = bytearray(width * height)
    queue: deque[tuple[int, int]] = deque()
    reference = collect_border_reference(image)

    def push(x: int, y: int) -> None:
        index = y * width + x
        if visited[index]:
            return
        visited[index] = 1
        if is_background(pixels[x, y], reference):
            queue.append((x, y))

    for x in range(width):
        push(x, 0)
        push(x, height - 1)

    for y in range(height):
        push(0, y)
        push(width - 1, y)

    while queue:
        x, y = queue.popleft()
        red, green, blue, _ = pixels[x, y]
        pixels[x, y] = (red, green, blue, 0)

        if x > 0:
            push(x - 1, y)
        if x < width - 1:
            push(x + 1, y)
        if y > 0:
            push(x, y - 1)
        if y < height - 1:
            push(x, y + 1)

    alpha = image.getchannel("A")
    bounds = alpha.getbbox()
    if bounds:
        left = max(0, bounds[0] - MARGIN)
        top = max(0, bounds[1] - MARGIN)
        right = min(width, bounds[2] + MARGIN)
        bottom = min(height, bounds[3] + MARGIN)
        image = image.crop((left, top, right, bottom))

    destination = source.with_suffix("").with_name(f"{source.stem}-cutout.png")
    image.save(destination)
    return destination


def iter_product_assets() -> list[Path]:
    files = [
        path
        for path in ASSET_ROOT.rglob("*")
        if path.is_file()
        and path.suffix.lower() in SUPPORTED_EXTENSIONS
        and "cutout" not in path.stem
        and path.name != "hero_banner.png"
    ]
    return sorted(files)


def main() -> None:
    generated = []
    for source in iter_product_assets():
        destination = create_cutout(source)
        generated.append((source.relative_to(ROOT), destination.relative_to(ROOT)))

    for source, destination in generated:
        print(f"{source} -> {destination}")

    print(f"Generated {len(generated)} cutout images.")


if __name__ == "__main__":
    main()
