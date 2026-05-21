from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "pet" / "spritesheet.webp"
OUTPUT = ROOT / "pet" / "spritesheet-24fps.webp"

FRAME_WIDTH = 192
FRAME_HEIGHT = 208
SOURCE_COLUMNS = 8
ROWS = 9
TARGET_COLUMNS = 24


@dataclass(frozen=True)
class RowSpec:
    source_frames: int
    loop: bool


ROW_SPECS = {
    0: RowSpec(source_frames=6, loop=True),
    1: RowSpec(source_frames=8, loop=True),
    2: RowSpec(source_frames=8, loop=True),
    3: RowSpec(source_frames=4, loop=False),
    4: RowSpec(source_frames=5, loop=True),
    5: RowSpec(source_frames=8, loop=False),
    6: RowSpec(source_frames=6, loop=True),
    7: RowSpec(source_frames=6, loop=True),
    8: RowSpec(source_frames=6, loop=True),
}


def clean_transparent_pixels(frame: Image.Image) -> np.ndarray:
    rgba = np.asarray(frame.convert("RGBA"), dtype=np.float32)
    alpha = rgba[..., 3:4] / 255.0
    # Transparent WebP pixels can retain old color data; premultiplication keeps
    # those hidden colors from bleeding into interpolated edges.
    rgba[..., :3] *= alpha
    return rgba


def unpremultiply(rgba: np.ndarray) -> Image.Image:
    alpha = np.clip(rgba[..., 3:4], 0, 255)
    color = rgba[..., :3]
    safe_alpha = np.maximum(alpha / 255.0, 1e-6)
    color = np.where(alpha > 0, color / safe_alpha, 0)
    out = np.concatenate([color, alpha], axis=2)
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))


def to_gray(rgba: np.ndarray) -> np.ndarray:
    alpha = rgba[..., 3:4] / 255.0
    rgb = np.where(alpha > 0, rgba[..., :3] / np.maximum(alpha, 1e-6), 0)
    composite = rgb * alpha + 255.0 * (1.0 - alpha)
    return cv2.cvtColor(np.clip(composite, 0, 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)


def remap_with_flow(rgba: np.ndarray, flow: np.ndarray, amount: float) -> np.ndarray:
    height, width = rgba.shape[:2]
    grid_x, grid_y = np.meshgrid(np.arange(width), np.arange(height))
    map_x = (grid_x + flow[..., 0] * amount).astype(np.float32)
    map_y = (grid_y + flow[..., 1] * amount).astype(np.float32)
    return cv2.remap(
        rgba,
        map_x,
        map_y,
        interpolation=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=(0, 0, 0, 0),
    )


def interpolate_frame(first: np.ndarray, second: np.ndarray, amount: float) -> Image.Image:
    if amount <= 0:
        return unpremultiply(first)
    if amount >= 1:
        return unpremultiply(second)

    first_gray = to_gray(first)
    second_gray = to_gray(second)
    forward = cv2.calcOpticalFlowFarneback(
        first_gray,
        second_gray,
        None,
        pyr_scale=0.5,
        levels=3,
        winsize=21,
        iterations=5,
        poly_n=7,
        poly_sigma=1.5,
        flags=0,
    )
    backward = cv2.calcOpticalFlowFarneback(
        second_gray,
        first_gray,
        None,
        pyr_scale=0.5,
        levels=3,
        winsize=21,
        iterations=5,
        poly_n=7,
        poly_sigma=1.5,
        flags=0,
    )

    # A full cross-dissolve makes Mika look like she leaves a ghost trail.
    # Use the nearest warped keyframe so the extra frames smooth motion without
    # drawing two semi-transparent characters at once.
    if amount < 0.5:
        return unpremultiply(remap_with_flow(first, forward, amount))

    return unpremultiply(remap_with_flow(second, backward, 1.0 - amount))


def sample_pair(source_count: int, target_index: int, loop: bool) -> tuple[int, int, float]:
    if loop:
        position = target_index * source_count / TARGET_COLUMNS
        left = int(np.floor(position)) % source_count
        return left, (left + 1) % source_count, position - np.floor(position)

    if TARGET_COLUMNS == 1 or source_count == 1:
        return 0, 0, 0.0

    position = target_index * (source_count - 1) / (TARGET_COLUMNS - 1)
    left = int(np.floor(position))
    right = min(left + 1, source_count - 1)
    return left, right, position - left


def main() -> None:
    source = Image.open(SOURCE).convert("RGBA")
    output = Image.new("RGBA", (FRAME_WIDTH * TARGET_COLUMNS, FRAME_HEIGHT * ROWS), (0, 0, 0, 0))

    for row in range(ROWS):
        spec = ROW_SPECS[row]
        frames = [
            clean_transparent_pixels(
                source.crop(
                    (
                        col * FRAME_WIDTH,
                        row * FRAME_HEIGHT,
                        (col + 1) * FRAME_WIDTH,
                        (row + 1) * FRAME_HEIGHT,
                    )
                )
            )
            for col in range(spec.source_frames)
        ]

        for target_col in range(TARGET_COLUMNS):
            left, right, amount = sample_pair(spec.source_frames, target_col, spec.loop)
            frame = interpolate_frame(frames[left], frames[right], amount)
            output.paste(frame, (target_col * FRAME_WIDTH, row * FRAME_HEIGHT), frame)

    output.save(OUTPUT, "WEBP", lossless=True, quality=100, method=6)
    print(f"Wrote {OUTPUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
