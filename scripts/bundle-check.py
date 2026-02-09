#!/usr/bin/env python3
"""
██████╗ ██╗   ██╗██╗     ██╗     ███╗   ███╗ ██████╗ ███╗   ██╗███████╗██╗   ██╗
██╔══██╗██║   ██║██║     ██║     ████╗ ████║██╔═══██╗████╗  ██║██╔════╝╚██╗ ██╔╝
██████╔╝██║   ██║██║     ██║     ██╔████╔██║██║   ██║██╔██╗ ██║█████╗   ╚████╔╝
██╔══██╗██║   ██║██║     ██║     ██║╚██╔╝██║██║   ██║██║╚██╗██║██╔══╝    ╚██╔╝
██████╔╝╚██████╔╝███████╗███████╗██║ ╚═╝ ██║╚██████╔╝██║ ╚████║███████╗   ██║
╚═════╝  ╚═════╝ ╚══════╝╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝   ╚═╝

  📦  BUNDLE CHECKER  –  Analyze bundle size & find heavy imports.

    python3 scripts/bundle-check.py              ← analyze (default)
    python3 scripts/bundle-check.py --build      ← run next build + analyze
    python3 scripts/bundle-check.py --deps       ← check for lighter alternatives
"""

from __future__ import annotations

import argparse
import json
import os
import re
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

SKIP_DIRS = {
    "node_modules", ".next", ".git", "static-app", "my-app",
    "portfolio-overlay", ".venv", "__pycache__", ".turbo", ".vercel",
    "dist", "build", ".cache",
}

CODE_EXTS = {".tsx", ".ts", ".jsx", ".js"}

# ═══════════════════════════════════════════════════════════════════════════
# LIGHTER ALTERNATIVES DATABASE
# ═══════════════════════════════════════════════════════════════════════════

LIGHTER_ALTERNATIVES = {
    "moment": {
        "size": "329KB",
        "alternative": "dayjs",
        "alt_size": "7KB",
        "savings": "98%",
    },
    "lodash": {
        "size": "531KB",
        "alternative": "lodash-es (tree-shakeable) or native",
        "alt_size": "tree-shaken",
        "savings": "~90%",
    },
    "axios": {
        "size": "29KB",
        "alternative": "native fetch (built-in)",
        "alt_size": "0KB",
        "savings": "100%",
    },
    "uuid": {
        "size": "12KB",
        "alternative": "crypto.randomUUID() (built-in)",
        "alt_size": "0KB",
        "savings": "100%",
    },
    "classnames": {
        "size": "1.8KB",
        "alternative": "clsx",
        "alt_size": "0.5KB",
        "savings": "72%",
    },
    "date-fns": {
        "size": "75KB (full)",
        "alternative": "import only needed functions",
        "alt_size": "tree-shaken",
        "savings": "~80%",
    },
    "animate.css": {
        "size": "80KB",
        "alternative": "Tailwind animations / CSS @keyframes",
        "alt_size": "0KB",
        "savings": "100%",
    },
    "@fortawesome/fontawesome-free": {
        "size": "1.5MB",
        "alternative": "lucide-react or heroicons",
        "alt_size": "tree-shaken",
        "savings": "~95%",
    },
    "react-icons": {
        "size": "varies (can be huge)",
        "alternative": "lucide-react (tree-shakeable)",
        "alt_size": "tree-shaken",
        "savings": "~80%",
    },
}

# ═══════════════════════════════════════════════════════════════════════════
# COMPONENT SIZE ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════

def get_file_sizes() -> list[dict]:
    """Get all component file sizes for analysis."""
    files = []
    for ext in CODE_EXTS:
        for fpath in sorted(ROOT.rglob(f"*{ext}")):
            if any(part in SKIP_DIRS for part in fpath.parts):
                continue
            if not fpath.is_file():
                continue
            size = fpath.stat().st_size
            rel = str(fpath.relative_to(ROOT))
            files.append({
                "path": rel,
                "size": size,
                "ext": ext,
            })
    return sorted(files, key=lambda x: -x["size"])


def analyze_large_components(files: list[dict], threshold_kb: int = 50):
    """Find components that are suspiciously large."""
    large = [f for f in files if f["size"] > threshold_kb * 1024]
    return large


# ═══════════════════════════════════════════════════════════════════════════
# IMPORT GRAPH — find which packages are imported the most
# ═══════════════════════════════════════════════════════════════════════════

def analyze_imports() -> dict[str, dict]:
    """Build a map of package → files that import it."""
    import_map: dict[str, dict] = {}

    import_re = re.compile(
        r"""(?:import\s+(?:(?:\{[^}]*\}|\w+|\*\s+as\s+\w+)\s*,?\s*)*\s+from\s+['"]([^'"./][^'"]*?)['"]"""
        r"""|require\s*\(\s*['"]([^'"./][^'"]*?)['"]\))""",
        re.MULTILINE,
    )

    for ext in CODE_EXTS:
        for fpath in sorted(ROOT.rglob(f"*{ext}")):
            if any(part in SKIP_DIRS for part in fpath.parts):
                continue
            if not fpath.is_file():
                continue

            try:
                content = fpath.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue

            rel = str(fpath.relative_to(ROOT))

            for match in import_re.finditer(content):
                pkg = match.group(1) or match.group(2)
                if not pkg:
                    continue

                # Normalize to package root: @scope/pkg/subpath → @scope/pkg
                if pkg.startswith("@"):
                    parts = pkg.split("/")
                    pkg = "/".join(parts[:2]) if len(parts) > 1 else parts[0]
                else:
                    pkg = pkg.split("/")[0]

                # Skip Next.js built-ins and React
                if pkg in {"react", "react-dom", "next", "next/image", "next/link",
                          "next/font", "next/navigation", "next/dynamic", "next/script",
                          "next/headers", "next/server"}:
                    continue

                if pkg not in import_map:
                    import_map[pkg] = {"count": 0, "files": []}
                import_map[pkg]["count"] += 1
                if len(import_map[pkg]["files"]) < 10:
                    import_map[pkg]["files"].append(rel)

    return import_map


# ═══════════════════════════════════════════════════════════════════════════
# DUPLICATE IMPORT CHECK
# ═══════════════════════════════════════════════════════════════════════════

# Packages that do the same thing
DUPLICATE_GROUPS = [
    ({"clsx", "classnames", "cn", "twMerge"}, "class merging"),
    ({"axios", "got", "ky", "node-fetch"}, "HTTP client (use native fetch)"),
    ({"moment", "dayjs", "date-fns", "luxon"}, "date library"),
    ({"uuid", "nanoid", "cuid", "ulid"}, "ID generation"),
    ({"lodash", "lodash-es", "underscore", "ramda"}, "utility library"),
    ({"zustand", "jotai", "recoil", "valtio"}, "state management"),
]


def find_duplicate_deps(import_map: dict) -> list[tuple[str, list[str]]]:
    """Find packages that duplicate each other's functionality."""
    dupes = []
    for group, category in DUPLICATE_GROUPS:
        found = [pkg for pkg in group if pkg in import_map]
        if len(found) > 1:
            dupes.append((category, found))
    return dupes


# ═══════════════════════════════════════════════════════════════════════════
# BUILD OUTPUT ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════

def parse_build_output(output: str) -> list[dict]:
    """Parse next build output for route/chunk sizes."""
    routes = []

    # Match lines like: ○ /about    5.2 kB    89.3 kB
    route_re = re.compile(
        r'[○●◐λƒ]\s+(/\S*)\s+(\d+(?:\.\d+)?)\s*(kB|B|MB)\s+(\d+(?:\.\d+)?)\s*(kB|B|MB)'
    )

    for match in route_re.finditer(output):
        route = match.group(1)
        size_val = float(match.group(2))
        size_unit = match.group(3)
        total_val = float(match.group(4))
        total_unit = match.group(5)

        # Normalize to KB
        if size_unit == "B":
            size_val /= 1024
        elif size_unit == "MB":
            size_val *= 1024

        if total_unit == "B":
            total_val /= 1024
        elif total_unit == "MB":
            total_val *= 1024

        routes.append({
            "route": route,
            "size_kb": size_val,
            "total_kb": total_val,
        })

    return sorted(routes, key=lambda x: -x["total_kb"])


def run_build_analysis():
    """Run next build and analyze the output."""
    print(f"\n  {C.CYAN}Running next build (this may take a few minutes)…{C.RESET}\n")

    next_bin = ROOT / "node_modules" / ".bin" / "next"
    cmd = [str(next_bin), "build"] if next_bin.exists() else ["npx", "next", "build"]

    try:
        result = subprocess.run(
            cmd, cwd=str(ROOT), capture_output=True, text=True, timeout=600,
            env={**os.environ, "NODE_OPTIONS": "--max-old-space-size=8192"},
        )
        output = result.stdout + result.stderr
        return output, result.returncode == 0
    except subprocess.TimeoutExpired:
        return "Build timed out", False
    except Exception as e:
        return str(e), False


# ═══════════════════════════════════════════════════════════════════════════
# PACKAGE.JSON SIZE ESTIMATES
# ═══════════════════════════════════════════════════════════════════════════

# Known package sizes (minified + gzip, approximate KB)
KNOWN_SIZES: dict[str, int] = {
    "three": 160, "@react-three/fiber": 55, "@react-three/drei": 80,
    "framer-motion": 40, "gsap": 28, "@splinetool/react-spline": 90,
    "@tsparticles/react": 12, "@tsparticles/slim": 45,
    "recharts": 100, "chart.js": 65,
    "postprocessing": 50, "cobe": 12,
    "zustand": 3, "jotai": 4,
    "supabase": 30, "@supabase/supabase-js": 30,
    "stripe": 40, "@stripe/stripe-js": 15,
    "lodash": 72, "date-fns": 20,
    "react-hot-toast": 5, "sonner": 5,
    "lucide-react": 0,  # tree-shaken
    "clsx": 0.5, "tailwind-merge": 4,
}


# ═══════════════════════════════════════════════════════════════════════════
# REPORT
# ═══════════════════════════════════════════════════════════════════════════

def fmt_size(kb: float) -> str:
    if kb >= 1024:
        return f"{kb / 1024:.1f} MB"
    return f"{kb:.1f} KB"


def print_report(
    files: list[dict],
    import_map: dict,
    dupes: list,
    build_routes: list[dict] | None = None,
    check_deps: bool = False,
):
    os.system('cls' if os.name == 'nt' else 'clear')

    print(f"\n{C.GOLD}  📦  BULLMONEY BUNDLE CHECKER{C.RESET}")
    print()
    print(DIVIDER)
    print(f"  {C.GOLD_B}📊  COMPONENT SIZE ANALYSIS{C.RESET}")
    print(DIVIDER)

    # Large files
    large = analyze_large_components(files, threshold_kb=30)
    if large:
        print(f"\n  {C.YELLOW}{len(large)}{C.RESET} components over 30KB (consider code-splitting):\n")
        for f in large[:20]:
            size_kb = f["size"] / 1024
            bar_len = min(int(size_kb / 5), 30)
            color = C.RED if size_kb > 100 else C.YELLOW if size_kb > 50 else C.CYAN
            bar = f"{color}{'█' * bar_len}{C.RESET}"
            print(f"    {color}{size_kb:7.1f} KB{C.RESET}  {bar}  {C.DIM}{f['path']}{C.RESET}")
        if len(large) > 20:
            print(f"    {C.DIM}… and {len(large) - 20} more{C.RESET}")
    else:
        print(f"\n  {C.GREEN}✔{C.RESET}  All components under 30KB")
    print()

    # Total code size
    total_kb = sum(f["size"] for f in files) / 1024
    total_files = len(files)
    print(f"  {C.DIM}Total: {total_files:,} files, {fmt_size(total_kb)} of source code{C.RESET}")

    # Import analysis
    print()
    print(DIVIDER)
    print(f"  {C.GOLD_B}📡  MOST IMPORTED PACKAGES{C.RESET}")
    print(DIVIDER)

    top_imports = sorted(import_map.items(), key=lambda x: -x[1]["count"])[:25]
    print()
    for pkg, data in top_imports:
        count = data["count"]
        known_size = KNOWN_SIZES.get(pkg, None)
        size_str = f"  {C.DIM}(~{known_size}KB gzip){C.RESET}" if known_size else ""
        bar_len = min(count // 3, 25)
        bar = f"{C.GOLD}{'█' * bar_len}{C.RESET}"
        print(f"    {C.GOLD_B}{count:4d}{C.RESET}  {bar}  {pkg}{size_str}")
    print()

    # Duplicates
    if dupes:
        print(DIVIDER)
        print(f"  {C.GOLD_B}⚠  DUPLICATE DEPENDENCIES{C.RESET}")
        print(DIVIDER)
        print()
        for category, pkgs in dupes:
            print(f"  {C.YELLOW}●{C.RESET}  {category}: {C.RED}{', '.join(pkgs)}{C.RESET}")
            print(f"    {C.DIM}Consider consolidating to one package{C.RESET}")
        print()

    # Lighter alternatives
    if check_deps:
        print(DIVIDER)
        print(f"  {C.GOLD_B}🪶  LIGHTER ALTERNATIVES{C.RESET}")
        print(DIVIDER)
        print()

        found_any = False
        for pkg, info in LIGHTER_ALTERNATIVES.items():
            if pkg in import_map:
                found_any = True
                count = import_map[pkg]["count"]
                print(f"  {C.YELLOW}●{C.RESET}  {C.BOLD}{pkg}{C.RESET}  ({info['size']}, {count} imports)")
                print(f"    → {C.GREEN}{info['alternative']}{C.RESET}  ({info['alt_size']}, {info['savings']} smaller)")
                print()

        if not found_any:
            print(f"  {C.GREEN}✔{C.RESET}  No heavy packages with lighter alternatives found\n")

    # Build routes
    if build_routes:
        print(DIVIDER)
        print(f"  {C.GOLD_B}🛣  ROUTE SIZES{C.RESET}")
        print(DIVIDER)
        print()

        for route in build_routes[:20]:
            size = route["total_kb"]
            color = C.RED if size > 300 else C.YELLOW if size > 150 else C.GREEN
            bar_len = min(int(size / 10), 30)
            bar = f"{color}{'█' * bar_len}{C.RESET}"
            print(f"    {color}{size:7.1f} KB{C.RESET}  {bar}  {route['route']}")

        # Threshold warnings
        heavy = [r for r in build_routes if r["total_kb"] > 300]
        if heavy:
            print(f"\n  {C.RED}🚨  {len(heavy)} routes over 300KB — will load slowly on 3G{C.RESET}")
        print()

    # Summary
    print(DIVIDER)
    print(f"  {C.GOLD_B}💡  QUICK WINS{C.RESET}")
    print(DIVIDER)
    print()

    # Estimate biggest wins
    three_imports = import_map.get("three", {}).get("count", 0)
    framer_imports = import_map.get("framer-motion", {}).get("count", 0)
    gsap_imports = import_map.get("gsap", {}).get("count", 0)

    if three_imports:
        print(f"  {C.CYAN}1.{C.RESET}  three.js in {three_imports} files — dynamic import with ssr:false")
    if framer_imports > 50:
        print(f"  {C.CYAN}2.{C.RESET}  framer-motion in {framer_imports} files — use 'motion' sub-import for smaller bundle")
    if gsap_imports:
        print(f"  {C.CYAN}3.{C.RESET}  gsap in {gsap_imports} files — dynamic import animation-heavy components")

    if large:
        biggest = large[0]
        print(f"  {C.CYAN}4.{C.RESET}  Split {biggest['path']} ({biggest['size'] / 1024:.0f}KB) into sub-components")

    print(f"\n  {C.DIM}Run: python3 scripts/lazy-audit.py  for detailed dynamic import recommendations{C.RESET}")
    print()


# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="🐂 Bullmoney Bundle Checker")
    parser.add_argument("--build", action="store_true",
                        help="Run next build and analyze route sizes")
    parser.add_argument("--deps", action="store_true",
                        help="Check for lighter package alternatives")
    args = parser.parse_args()

    files = get_file_sizes()
    import_map = analyze_imports()
    dupes = find_duplicate_deps(import_map)

    build_routes = None
    if args.build:
        output, success = run_build_analysis()
        if success:
            build_routes = parse_build_output(output)
        else:
            print(f"\n  {C.RED}✖{C.RESET}  Build failed. Run 'npm run build' to see errors.\n")

    print_report(
        files=files,
        import_map=import_map,
        dupes=dupes,
        build_routes=build_routes,
        check_deps=args.deps,
    )


if __name__ == "__main__":
    main()
