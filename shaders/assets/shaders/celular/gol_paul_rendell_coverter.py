#!/usr/bin/env python3
"""Convert Life 1.05 or RLE .lif files into WGSL shader triplets.

Defaults match the Paul Rendell shader setup:
- 16:10 grid with padding
- centered pattern
- compute-only header comments (author + source links)
"""

from __future__ import annotations

import argparse
import math
import re
from pathlib import Path
from typing import Dict, Iterable, List, Tuple


def parse_ratio(value: str) -> Tuple[int, int]:
    if ":" not in value:
        raise argparse.ArgumentTypeError("ratio must be in W:H format, e.g. 16:10")
    parts = value.split(":", 1)
    try:
        w = int(parts[0])
        h = int(parts[1])
    except ValueError as exc:
        raise argparse.ArgumentTypeError("ratio must be in W:H format, e.g. 16:10") from exc
    if w <= 0 or h <= 0:
        raise argparse.ArgumentTypeError("ratio values must be positive")
    return w, h


def parse_rle(text: str) -> Tuple[int, int, List[Tuple[int, int, int]]]:
    lines = [ln.strip() for ln in text.splitlines() if ln.strip()]
    header = lines[0]
    match = re.search(r"x\s*=\s*(\d+),\s*y\s*=\s*(\d+)", header)
    if not match:
        raise ValueError("RLE header missing dimensions")
    width = int(match.group(1))
    height = int(match.group(2))
    body = "".join(lines[1:])

    x = 0
    y = 0
    num = ""
    runs: List[Tuple[int, int, int]] = []
    run_start = None
    run_len = 0

    for ch in body:
        if ch.isdigit():
            num += ch
            continue
        n = int(num) if num else 1
        num = ""

        if ch == "b":
            if run_start is not None:
                runs.append((y, run_start, run_len))
                run_start = None
                run_len = 0
            x += n
        elif ch == "o":
            if run_start is None:
                run_start = x
                run_len = n
            else:
                run_len += n
            x += n
        elif ch == "$":
            if run_start is not None:
                runs.append((y, run_start, run_len))
                run_start = None
                run_len = 0
            y += n
            x = 0
        elif ch == "!":
            break

    if run_start is not None:
        runs.append((y, run_start, run_len))

    return width, height, runs


def parse_life_105(text: str) -> Tuple[int, int, List[Tuple[int, int, int]]]:
    lines = text.splitlines()
    live: List[Tuple[int, int]] = []
    origin_x = 0
    origin_y = 0
    row = 0
    minx = miny = None
    maxx = maxy = None

    for line in lines:
        if line.startswith("#P"):
            parts = line.split()
            if len(parts) >= 3:
                origin_x = int(parts[1])
                origin_y = int(parts[2])
                row = 0
            continue
        if line.startswith("#"):
            continue

        for col, ch in enumerate(line):
            if ch == "*":
                x = origin_x + col
                y = origin_y + row
                live.append((x, y))
                minx = x if minx is None else min(minx, x)
                maxx = x if maxx is None else max(maxx, x)
                miny = y if miny is None else min(miny, y)
                maxy = y if maxy is None else max(maxy, y)
        row += 1

    if not live:
        raise ValueError("Life 1.05 file contains no live cells")

    width = maxx - minx + 1
    height = maxy - miny + 1

    rows: Dict[int, List[int]] = {}
    for x, y in live:
        sx = x - minx
        sy = y - miny
        rows.setdefault(sy, []).append(sx)

    runs: List[Tuple[int, int, int]] = []
    for y in sorted(rows.keys()):
        xs = sorted(rows[y])
        start = prev = xs[0]
        length = 1
        for x in xs[1:]:
            if x == prev + 1:
                length += 1
            else:
                runs.append((y, start, length))
                start = x
                length = 1
            prev = x
        runs.append((y, start, length))

    return width, height, runs


def parse_lif(path: Path) -> Tuple[int, int, List[Tuple[int, int, int]]]:
    text = path.read_text().strip()
    if re.search(r"^\s*x\s*=\s*\d+", text, flags=re.MULTILINE):
        return parse_rle(text)
    if text.lstrip().startswith("#Life 1.05"):
        return parse_life_105(text)
    raise ValueError(f"Unrecognized LIF format: {path}")


def compute_grid(width: int, height: int, pad: int, ratio: Tuple[int, int]) -> Tuple[int, int]:
    w_pad = width + 2 * pad
    h_pad = height + 2 * pad
    k = max(math.ceil(w_pad / ratio[0]), math.ceil(h_pad / ratio[1]))
    return ratio[0] * k, ratio[1] * k


def build_header(
    lif_path: Path,
    width: int,
    height: int,
    runs: Iterable[Tuple[int, int, int]],
    frame_interval: int,
    include_header: bool,
    author: str,
    author_site: str,
    lif_archive: str,
) -> str:
    run_list = list(runs)
    run_lines = []
    for idx, (ry, rx, rlen) in enumerate(run_list):
        suffix = "," if idx != len(run_list) - 1 else ""
        run_lines.append(f"    Run({ry}u, {rx}u, {rlen}u){suffix}")

    comment_block = ""
    if include_header:
        comment_block = (
            f"// Author: {author}\n"
            f"// Author's Website: {author_site}\n"
            f"// LIF archive: {lif_archive}\n\n"
        )

    return (
        comment_block
        + f"const COMPUTE_FRAME_INTERVAL : u32 = {frame_interval}u;\n\n"
        + f"const PATTERN_WIDTH : u32 = {width}u;\n"
        + f"const PATTERN_HEIGHT : u32 = {height}u;\n"
        + f"const PATTERN_RUN_COUNT : u32 = {len(run_list)}u;\n\n"
        + "struct Run\n"
        + "{\n"
        + "    y : u32,\n"
        + "    x : u32,\n"
        + "    len : u32,\n"
        + "};\n\n"
        + f"// Run-length encoded live cell spans from {lif_path.as_posix()} (y, x, len).\n"
        + f"const PATTERN_RUNS : array<Run, {len(run_list)}> = array<Run, {len(run_list)}>(\n"
        + "\n".join(run_lines)
        + "\n);\n\n"
    )


def read_template(path: Path, fallback: str) -> str:
    if path.exists():
        return path.read_text()
    return fallback


def main() -> int:
    parser = argparse.ArgumentParser(description="Convert .lif file to WGSL shader triplet")
    parser.add_argument("lif", type=Path, help="Path to .lif file")
    parser.add_argument("--name", help="Output shader base name")
    parser.add_argument("--prefix", default="gol_paul_rendell_", help="Name prefix")
    parser.add_argument("--output-dir", type=Path, default=None, help="Output directory")
    parser.add_argument("--pad", type=int, default=20, help="Padding around the pattern")
    parser.add_argument("--ratio", type=parse_ratio, default=(16, 10), help="Grid ratio W:H")
    parser.add_argument("--grid", nargs=2, type=int, metavar=("W", "H"), help="Override grid size")
    parser.add_argument("--frame-interval", type=int, default=3, help="Compute frame interval")
    parser.add_argument("--no-header", action="store_true", help="Omit author/source header")
    parser.add_argument("--author", default="Paul Rendell", help="Author name")
    parser.add_argument("--author-site", default="http://rendell-attic.org/gol/tm.htm", help="Author website")
    parser.add_argument(
        "--lif-archive",
        default="https://d-k-ivanov.github.io/shaders/assets/shaders/celular/gol_paul_rendell_lifs.zip",
        help="LIF archive URL",
    )

    args = parser.parse_args()

    width, height, runs = parse_lif(args.lif)

    script_dir = Path(__file__).resolve().parent
    output_dir = args.output_dir or script_dir

    base_name = args.name or f"{args.prefix}{args.lif.stem.lower()}"

    if args.grid:
        grid_w, grid_h = args.grid
    else:
        grid_w, grid_h = compute_grid(width, height, args.pad, args.ratio)

    compute_template_path = script_dir / "gol_paul_rendell_comp.compute.wgsl"
    vertex_template_path = script_dir / "gol_paul_rendell_comp.vertex.wgsl"
    fragment_template_path = script_dir / "gol_paul_rendell_comp.fragment.wgsl"

    compute_template = read_template(compute_template_path, "")
    if "struct ShaderUniforms" not in compute_template:
        raise SystemExit("Compute template missing struct ShaderUniforms")

    rest = "struct ShaderUniforms" + compute_template.split("struct ShaderUniforms", 1)[1]
    rest = (rest
        .replace("COMP_WIDTH", "PATTERN_WIDTH")
        .replace("COMP_HEIGHT", "PATTERN_HEIGHT")
        .replace("COMP_RUN_COUNT", "PATTERN_RUN_COUNT")
        .replace("COMP_RUNS", "PATTERN_RUNS")
    )

    header = build_header(
        args.lif,
        width,
        height,
        runs,
        args.frame_interval,
        not args.no_header,
        args.author,
        args.author_site,
        args.lif_archive,
    )

    compute_text = header + rest

    vertex_template = read_template(vertex_template_path, "")
    vertex_text = re.sub(
        r"const\s+GRID_SIZE\s*:\s*vec3u\s*=\s*vec3u\([^\)]*\);",
        f"const GRID_SIZE : vec3u = vec3u({grid_w}u, {grid_h}u, 1u);",
        vertex_template,
        count=1,
    )

    fragment_text = read_template(fragment_template_path, "")

    output_dir.mkdir(parents=True, exist_ok=True)

    (output_dir / f"{base_name}.compute.wgsl").write_text(compute_text)
    (output_dir / f"{base_name}.vertex.wgsl").write_text(vertex_text)
    (output_dir / f"{base_name}.fragment.wgsl").write_text(fragment_text)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
