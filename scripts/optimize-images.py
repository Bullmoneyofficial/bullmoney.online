#!/usr/bin/env python3
"""
██████╗ ██╗   ██╗██╗     ██╗     ███╗   ███╗ ██████╗ ███╗   ██╗███████╗██╗   ██╗
██╔══██╗██║   ██║██║     ██║     ████╗ ████║██╔═══██╗████╗  ██║██╔════╝╚██╗ ██╔╝
██████╔╝██║   ██║██║     ██║     ██╔████╔██║██║   ██║██╔██╗ ██║█████╗   ╚████╔╝
██╔══██╗██║   ██║██║     ██║     ██║╚██╔╝██║██║   ██║██║╚██╗██║██╔══╝    ╚██╔╝
██████╔╝╚██████╔╝███████╗███████╗██║ ╚═╝ ██║╚██████╔╝██║ ╚████║███████╗   ██║
╚═════╝  ╚═════╝ ╚══════╝╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝   ╚═╝

  📸  IMAGE OPTIMIZER  –  Audit & compress public/ images.

    python3 scripts/optimize-images.py              ← audit only (default)
    python3 scripts/optimize-images.py --fix        ← convert to WebP + resize
    python3 scripts/optimize-images.py --audit-code ← also scan for <img> without next/image
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

# ═══════════════════════════════════════════════════════════════════════════
# COLORS
# ═══════════════════════════════════════════════════════════════════════════

class C:
    RESET    = "\033[0m"
    BOLD     = "\033[1m"
    DIM      = "\033[2m"
    GOLD     = "\033[38;2;217;189;106m"
    GOLD_B   = "\033[1;38;2;246;231;182m"
    AMBER    = "\033[38;2;184;152;58m"
    GREEN    = "\033[38;2;74;222;128m"
    RED      = "\033[38;2;248;113;113m"
    YELLOW   = "\033[38;2;250;204;21m"
    CYAN     = "\033[38;2;103;232;249m"
    GRAY     = "\033[38;2;120;120;120m"
    DARK     = "\033[38;2;40;36;20m"

DIVIDER = f"{C.AMBER}{'━' * 64}{C.RESET}"

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"

SKIP_DIRS = {
    "node_modules", ".next", ".git", "static-app", "my-app",
    "portfolio-overlay", ".venv", "__pycache__", ".turbo", ".vercel",
    "dist", "build", ".cache",
}

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff", ".tif"}
MODERN_EXTS = {".webp", ".avif"}
ALL_IMAGE_EXTS = IMAGE_EXTS | MODERN_EXTS | {".svg"}
CODE_EXTS = {".tsx", ".ts", ".jsx", ".js"}

# Thresholds
WARN_SIZE_KB = 200       # Flag images > 200KB
CRITICAL_SIZE_KB = 500   # Critical: images > 500KB
MAX_DIMENSION = 2048     # Recommend resize if > 2048px
SVG_WARN_KB = 100        # SVGs > 100KB are likely embedded rasters


def fmt_size(size_bytes: int) -> str:
    if size_bytes >= 1_048_576:
        return f"{size_bytes / 1_048_576:.1f} MB"
    elif size_bytes >= 1024:
        return f"{size_bytes / 1024:.0f} KB"
    return f"{size_bytes} B"


def should_skip(path: Path) -> bool:
    return any(part in SKIP_DIRS for part in path.parts)


# ═══════════════════════════════════════════════════════════════════════════
# AUDIT: Public images
# ═══════════════════════════════════════════════════════════════════════════

def audit_public_images() -> dict:
    """Scan public/ for image sizes, formats, and optimization opportunities."""
    results = {
        "total_files": 0,
        "total_bytes": 0,
        "by_format": {},
        "oversized": [],       # > WARN_SIZE_KB
        "critical": [],        # > CRITICAL_SIZE_KB
        "no_modern": [],       # Files that could be WebP/AVIF
        "bloated_svgs": [],    # SVGs > SVG_WARN_KB (likely embedded rasters)
        "all_images": [],
    }

    if not PUBLIC.exists():
        return results

    for img in sorted(PUBLIC.rglob("*")):
        if not img.is_file():
            continue
        if img.suffix.lower() not in ALL_IMAGE_EXTS:
            continue
        if should_skip(img):
            continue

        size = img.stat().st_size
        ext = img.suffix.lower()
        rel = str(img.relative_to(ROOT))

        results["total_files"] += 1
        results["total_bytes"] += size
        results["by_format"][ext] = results["by_format"].get(ext, 0) + 1
        results["all_images"].append((rel, size, ext))

        size_kb = size / 1024

        if ext in IMAGE_EXTS:
            results["no_modern"].append((rel, size))

        if ext == ".svg" and size_kb > SVG_WARN_KB:
            results["bloated_svgs"].append((rel, size))

        if size_kb > CRITICAL_SIZE_KB:
            results["critical"].append((rel, size))
        elif size_kb > WARN_SIZE_KB:
            results["oversized"].append((rel, size))

    return results


def print_image_audit(audit: dict):
    print()
    print(DIVIDER)
    print(f"  {C.GOLD_B}📸  IMAGE AUDIT  —  public/{C.RESET}")
    print(DIVIDER)

    print(f"\n  {C.GOLD_B}{audit['total_files']}{C.RESET} images totaling "
          f"{C.GOLD_B}{fmt_size(audit['total_bytes'])}{C.RESET}")
    print()

    # Format breakdown
    print(f"  {C.AMBER}Format breakdown:{C.RESET}")
    for ext, count in sorted(audit["by_format"].items(), key=lambda x: -x[1]):
        bar = "█" * min(count, 30)
        print(f"    {C.GOLD_B}{count:4d}{C.RESET}  {ext:6s}  {C.DARK}{bar}{C.RESET}")
    print()

    # Critical files
    if audit["critical"]:
        print(f"  {C.RED}🚨  CRITICAL ({len(audit['critical'])} files > {CRITICAL_SIZE_KB}KB):{C.RESET}")
        for rel, size in sorted(audit["critical"], key=lambda x: -x[1]):
            print(f"    {C.RED}●{C.RESET}  {fmt_size(size):>8s}  {C.DIM}{rel}{C.RESET}")
        print()

    # Oversized
    if audit["oversized"]:
        print(f"  {C.YELLOW}⚠  OVERSIZED ({len(audit['oversized'])} files > {WARN_SIZE_KB}KB):{C.RESET}")
        for rel, size in sorted(audit["oversized"], key=lambda x: -x[1]):
            print(f"    {C.YELLOW}●{C.RESET}  {fmt_size(size):>8s}  {C.DIM}{rel}{C.RESET}")
        print()

    # Bloated SVGs
    if audit["bloated_svgs"]:
        print(f"  {C.YELLOW}🎨  BLOATED SVGs ({len(audit['bloated_svgs'])} > {SVG_WARN_KB}KB — likely embedded rasters):{C.RESET}")
        for rel, size in sorted(audit["bloated_svgs"], key=lambda x: -x[1]):
            print(f"    {C.YELLOW}●{C.RESET}  {fmt_size(size):>8s}  {C.DIM}{rel}{C.RESET}")
        print(f"    {C.DIM}Tip: Export these as PNG→WebP instead of huge SVGs{C.RESET}")
        print()

    # No modern format
    legacy_count = len(audit["no_modern"])
    legacy_size = sum(s for _, s in audit["no_modern"])
    if legacy_count:
        print(f"  {C.CYAN}📦  {legacy_count} legacy format files ({fmt_size(legacy_size)}) could be WebP/AVIF{C.RESET}")
        potential = legacy_size * 0.6  # ~40% savings typical
        print(f"    {C.GREEN}Estimated savings: ~{fmt_size(int(potential))}{C.RESET}")
        print()


# ═══════════════════════════════════════════════════════════════════════════
# AUDIT: Code — <img> tags not using next/image
# ═══════════════════════════════════════════════════════════════════════════

def audit_code_images() -> list[dict]:
    """Find <img> tags in code that should use next/image instead."""
    issues = []

    img_tag_re = re.compile(r'<img\b', re.IGNORECASE)
    next_image_re = re.compile(r"from ['\"]next/image['\"]")
    alt_re = re.compile(r'\balt\s*=')
    width_re = re.compile(r'\bwidth\s*=')
    height_re = re.compile(r'\bheight\s*=')
    loading_re = re.compile(r'\bloading\s*=\s*["\']lazy["\']')

    for ext in CODE_EXTS:
        for fpath in sorted(ROOT.rglob(f"*{ext}")):
            if should_skip(fpath):
                continue
            try:
                content = fpath.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue

            img_matches = list(img_tag_re.finditer(content))
            if not img_matches:
                continue

            has_next_image = bool(next_image_re.search(content))
            rel = str(fpath.relative_to(ROOT))

            lines = content.split('\n')
            for match in img_matches:
                line_num = content[:match.start()].count('\n') + 1
                # Get surrounding context (the whole tag, roughly)
                tag_end = content.find('>', match.start())
                if tag_end == -1:
                    tag_end = match.start() + 200
                tag_text = content[match.start():tag_end + 1]

                missing = []
                if not alt_re.search(tag_text):
                    missing.append("alt")
                if not width_re.search(tag_text):
                    missing.append("width")
                if not height_re.search(tag_text):
                    missing.append("height")
                if not loading_re.search(tag_text):
                    missing.append("loading=lazy")

                issues.append({
                    "file": rel,
                    "line": line_num,
                    "has_next_image_import": has_next_image,
                    "missing_attrs": missing,
                })

    return issues


def print_code_audit(issues: list[dict]):
    print()
    print(DIVIDER)
    print(f"  {C.GOLD_B}🔍  CODE AUDIT  —  Native <img> tags{C.RESET}")
    print(DIVIDER)

    if not issues:
        print(f"\n  {C.GREEN}✔{C.RESET}  All images use next/image! 🎉\n")
        return

    print(f"\n  {C.RED}{len(issues)}{C.RESET} native <img> tags found "
          f"(should use {C.CYAN}next/image{C.RESET} for auto WebP/AVIF + lazy loading)")
    print()

    # Group by file
    by_file: dict[str, list] = {}
    for issue in issues:
        by_file.setdefault(issue["file"], []).append(issue)

    for fpath, file_issues in sorted(by_file.items(), key=lambda x: -len(x[1])):
        count = len(file_issues)
        has_import = file_issues[0]["has_next_image_import"]
        import_badge = f"{C.GREEN}has import{C.RESET}" if has_import else f"{C.RED}no import{C.RESET}"
        print(f"  {C.GOLD_B}{count:3d}{C.RESET}  {C.DIM}{fpath}{C.RESET}  [{import_badge}]")
        for issue in file_issues[:5]:
            missing = ", ".join(issue["missing_attrs"])
            if missing:
                print(f"       {C.DIM}L{issue['line']}{C.RESET}  missing: {C.YELLOW}{missing}{C.RESET}")
        if count > 5:
            print(f"       {C.DIM}… and {count - 5} more{C.RESET}")

    # Summary
    no_alt = sum(1 for i in issues if "alt" in i["missing_attrs"])
    no_dims = sum(1 for i in issues if "width" in i["missing_attrs"])
    no_lazy = sum(1 for i in issues if "loading=lazy" in i["missing_attrs"])

    print(f"\n  {C.AMBER}Missing attributes:{C.RESET}")
    if no_alt:
        print(f"    {C.RED}{no_alt:3d}{C.RESET}  missing alt    {C.DIM}(accessibility + SEO){C.RESET}")
    if no_dims:
        print(f"    {C.YELLOW}{no_dims:3d}{C.RESET}  missing width/height  {C.DIM}(causes CLS){C.RESET}")
    if no_lazy:
        print(f"    {C.CYAN}{no_lazy:3d}{C.RESET}  missing loading=lazy  {C.DIM}(blocks LCP){C.RESET}")

    print(f"\n  {C.DIM}Fix: Replace <img> with <Image> from 'next/image' for auto optimization{C.RESET}")
    print()


# ═══════════════════════════════════════════════════════════════════════════
# FIX: Convert images to WebP (requires cwebp or sharp-cli)
# ═══════════════════════════════════════════════════════════════════════════

def has_cwebp() -> bool:
    try:
        subprocess.run(["cwebp", "-version"], capture_output=True, timeout=5)
        return True
    except (FileNotFoundError, Exception):
        return False


def has_sharp() -> bool:
    try:
        result = subprocess.run(
            ["npx", "sharp-cli", "--version"],
            capture_output=True, text=True, timeout=15, cwd=str(ROOT)
        )
        return result.returncode == 0
    except Exception:
        return False


def convert_to_webp(apply: bool):
    """Convert legacy images in public/ to WebP format."""
    if not apply:
        print(f"\n  {C.YELLOW}ℹ{C.RESET}  Dry-run. Use --fix to actually convert.\n")
        return

    use_cwebp = has_cwebp()
    if not use_cwebp:
        print(f"\n  {C.YELLOW}⚠{C.RESET}  'cwebp' not found. Install with: {C.CYAN}brew install webp{C.RESET}")
        print(f"     Or: {C.CYAN}npm install -g sharp-cli{C.RESET}")
        print(f"     Skipping conversion.\n")
        return

    converted = 0
    saved_bytes = 0

    for img in sorted(PUBLIC.rglob("*")):
        if not img.is_file() or img.suffix.lower() not in IMAGE_EXTS:
            continue
        if should_skip(img):
            continue

        webp_path = img.with_suffix(".webp")
        if webp_path.exists():
            continue  # Already converted

        original_size = img.stat().st_size
        rel = str(img.relative_to(ROOT))

        try:
            if use_cwebp:
                result = subprocess.run(
                    ["cwebp", "-q", "85", "-m", "6", str(img), "-o", str(webp_path)],
                    capture_output=True, text=True, timeout=30,
                )
            else:
                continue

            if result.returncode == 0 and webp_path.exists():
                new_size = webp_path.stat().st_size
                savings = original_size - new_size
                saved_bytes += savings
                converted += 1
                pct = (savings / original_size * 100) if original_size else 0
                print(f"  {C.GREEN}✔{C.RESET}  {rel}  →  .webp  "
                      f"{C.DIM}({fmt_size(original_size)} → {fmt_size(new_size)}, "
                      f"{C.GREEN}-{pct:.0f}%{C.RESET}{C.DIM}){C.RESET}")
        except Exception as e:
            print(f"  {C.RED}✖{C.RESET}  {rel}: {e}")

    if converted:
        print(f"\n  {C.GREEN}✔{C.RESET}  Converted {C.GOLD_B}{converted}{C.RESET} images, "
              f"saved {C.GREEN}{fmt_size(saved_bytes)}{C.RESET}")
        print(f"  {C.DIM}Note: Update your code to reference .webp files, "
              f"or use <Image> which auto-serves WebP{C.RESET}")
    else:
        print(f"\n  {C.GREEN}✔{C.RESET}  No images to convert.")
    print()


# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="🐂 Bullmoney Image Optimizer")
    parser.add_argument("--fix", action="store_true", help="Convert images to WebP")
    parser.add_argument("--audit-code", action="store_true", help="Also audit <img> tags in code")
    parser.add_argument("--code-only", action="store_true", help="Only audit code, skip public/")
    args = parser.parse_args()

    os.system('cls' if os.name == 'nt' else 'clear')
    print(f"\n{C.GOLD}  📸  BULLMONEY IMAGE OPTIMIZER{C.RESET}")

    if not args.code_only:
        audit = audit_public_images()
        print_image_audit(audit)

        if args.fix:
            convert_to_webp(apply=True)

    if args.audit_code or args.code_only:
        issues = audit_code_images()
        print_code_audit(issues)

    # Always show quick summary
    print(DIVIDER)
    if not args.audit_code and not args.code_only:
        print(f"  {C.DIM}Tip: Run with --audit-code to also find <img> tags in your components{C.RESET}")
    print(f"  {C.DIM}Tip: Run with --fix to convert PNG/JPG → WebP (requires: brew install webp){C.RESET}")
    print(DIVIDER)
    print()


if __name__ == "__main__":
    main()
