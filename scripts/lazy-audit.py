#!/usr/bin/env python3
"""
██████╗ ██╗   ██╗██╗     ██╗     ███╗   ███╗ ██████╗ ███╗   ██╗███████╗██╗   ██╗
██╔══██╗██║   ██║██║     ██║     ████╗ ████║██╔═══██╗████╗  ██║██╔════╝╚██╗ ██╔╝
██████╔╝██║   ██║██║     ██║     ██╔████╔██║██║   ██║██╔██╗ ██║█████╗   ╚████╔╝
██╔══██╗██║   ██║██║     ██║     ██║╚██╔╝██║██║   ██║██║╚██╗██║██╔══╝    ╚██╔╝
██████╔╝╚██████╔╝███████╗███████╗██║ ╚═╝ ██║╚██████╔╝██║ ╚████║███████╗   ██║
╚═════╝  ╚═════╝ ╚══════╝╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝   ╚═╝

  🦥  LAZY LOAD AUDITOR  –  Find components that should be dynamically imported.

    python3 scripts/lazy-audit.py              ← audit (default)
    python3 scripts/lazy-audit.py --fix        ← auto-wrap heavy imports with next/dynamic
    python3 scripts/lazy-audit.py --strict     ← also flag framer-motion static imports
"""

from __future__ import annotations

import argparse
import os
import re
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
    MAGENTA  = "\033[38;2;217;130;255m"

DIVIDER = f"{C.AMBER}{'━' * 64}{C.RESET}"

ROOT = Path(__file__).resolve().parent.parent

SKIP_DIRS = {
    "node_modules", ".next", ".git", "static-app", "my-app",
    "portfolio-overlay", ".venv", "__pycache__", ".turbo", ".vercel",
    "dist", "build", ".cache",
}

CODE_EXTS = {".tsx", ".ts", ".jsx", ".js"}

# ═══════════════════════════════════════════════════════════════════════════
# HEAVY LIBRARIES — these should almost always be dynamically imported
# ═══════════════════════════════════════════════════════════════════════════

# (package_pattern, display_name, estimated_bundle_kb, severity)
HEAVY_IMPORTS = [
    # 3D / WebGL — massive bundles
    (r"from ['\"]three['\"]", "three.js", 650, "critical"),
    (r"from ['\"]@react-three/fiber['\"]", "@react-three/fiber", 200, "critical"),
    (r"from ['\"]@react-three/drei['\"]", "@react-three/drei", 300, "critical"),
    (r"from ['\"]@react-three/postprocessing['\"]", "r3f-postprocessing", 150, "critical"),
    (r"from ['\"]postprocessing['\"]", "postprocessing", 200, "critical"),
    (r"from ['\"]@splinetool", "@splinetool", 400, "critical"),

    # Particle engines
    (r"from ['\"]@tsparticles", "@tsparticles", 180, "critical"),
    (r"from ['\"]tsparticles", "tsparticles", 180, "critical"),

    # Animation — heavy
    (r"from ['\"]gsap", "gsap", 80, "high"),

    # Charts
    (r"from ['\"]chart\.js", "chart.js", 200, "high"),
    (r"from ['\"]recharts['\"]", "recharts", 300, "high"),

    # Globe
    (r"from ['\"]cobe['\"]", "cobe (3D globe)", 40, "high"),

    # Others
    (r"from ['\"]lottie", "lottie", 150, "high"),
    (r"from ['\"]@lottiefiles", "lottie", 150, "high"),
    (r"from ['\"]d3['\"]", "d3", 250, "high"),
    (r"from ['\"]monaco-editor", "monaco-editor", 2000, "critical"),
    (r"from ['\"]@monaco-editor", "monaco-editor", 2000, "critical"),
]

# Optional: also audit framer-motion (in --strict mode since it's everywhere)
STRICT_IMPORTS = [
    (r"from ['\"]framer-motion['\"]", "framer-motion", 120, "medium"),
    (r"from ['\"]motion/react['\"]", "framer-motion/v12", 120, "medium"),
]

# Patterns that mean a component is ALREADY dynamically loaded
DYNAMIC_PATTERNS = [
    r"next/dynamic",
    r"React\.lazy",
    r"dynamic\(\s*\(\)\s*=>",
    r"lazy\(\s*\(\)\s*=>",
]

# Script strategy patterns
SCRIPT_PATTERNS = [
    (r'<Script\b(?![^>]*strategy\s*=)', "Script tag missing strategy", "high"),
    (r'strategy\s*=\s*["\']afterInteractive["\']', "Script afterInteractive (could be lazyOnload)", "medium"),
]


def should_skip(path: Path) -> bool:
    return any(part in SKIP_DIRS for part in path.parts)


# ═══════════════════════════════════════════════════════════════════════════
# ANALYSIS
# ═══════════════════════════════════════════════════════════════════════════

def analyze_file(fpath: Path, strict: bool = False) -> list[dict]:
    """Analyze a single file for heavy static imports."""
    try:
        content = fpath.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return []

    rel = str(fpath.relative_to(ROOT))
    issues = []

    # Check if the file itself uses dynamic imports already
    is_dynamic_wrapper = any(re.search(p, content) for p in DYNAMIC_PATTERNS)

    # Check heavy imports
    imports_to_check = HEAVY_IMPORTS + (STRICT_IMPORTS if strict else [])

    for pattern, name, size_kb, severity in imports_to_check:
        matches = list(re.finditer(pattern, content))
        if not matches:
            continue

        # If file already has dynamic() for THIS import, skip
        # (file might have some dynamic and some static)
        for match in matches:
            line_num = content[:match.start()].count('\n') + 1
            line_text = content.split('\n')[line_num - 1].strip()

            # Skip if this is inside a dynamic() call or comment
            if line_text.startswith("//") or line_text.startswith("*"):
                continue

            # Check if there's a corresponding dynamic import for this module
            # Look for: dynamic(() => import('module'))
            dynamic_for_module = False
            for dp in DYNAMIC_PATTERNS:
                # Search near this import for a dynamic wrapper
                if re.search(rf"dynamic\(.*{re.escape(name.split('/')[0])}", content):
                    dynamic_for_module = True
                    break

            if dynamic_for_module:
                continue

            issues.append({
                "file": rel,
                "line": line_num,
                "library": name,
                "size_kb": size_kb,
                "severity": severity,
                "import_text": line_text[:120],
                "is_dynamic_wrapper": is_dynamic_wrapper,
            })

    # Check Script tags
    if "Script" in content or "<script" in content.lower():
        for pattern, desc, severity in SCRIPT_PATTERNS:
            for match in re.finditer(pattern, content):
                line_num = content[:match.start()].count('\n') + 1
                line_text = content.split('\n')[line_num - 1].strip()

                # Skip JSON-LD scripts — they're lightweight and safe as afterInteractive
                if 'application/ld+json' in line_text:
                    continue

                issues.append({
                    "file": rel,
                    "line": line_num,
                    "library": "Script",
                    "size_kb": 0,
                    "severity": severity,
                    "import_text": desc + ": " + line_text[:80],
                    "is_dynamic_wrapper": False,
                })

    # Check for Suspense boundaries around heavy components
    if is_dynamic_wrapper and "<Suspense" not in content:
        has_heavy = any(re.search(p, content) for p, *_ in HEAVY_IMPORTS)
        if has_heavy:
            issues.append({
                "file": rel,
                "line": 0,
                "library": "Suspense",
                "size_kb": 0,
                "severity": "medium",
                "import_text": "Dynamic import without <Suspense> fallback",
                "is_dynamic_wrapper": True,
            })

    return issues


def analyze_all(strict: bool = False) -> list[dict]:
    """Scan entire codebase for lazy-loading opportunities."""
    all_issues = []

    for ext in CODE_EXTS:
        for fpath in sorted(ROOT.rglob(f"*{ext}")):
            if should_skip(fpath):
                continue
            if not fpath.is_file():
                continue
            issues = analyze_file(fpath, strict)
            all_issues.extend(issues)

    return all_issues


# ═══════════════════════════════════════════════════════════════════════════
# REPORT
# ═══════════════════════════════════════════════════════════════════════════

SEVERITY_COLORS = {
    "critical": C.RED,
    "high": C.YELLOW,
    "medium": C.CYAN,
}

SEVERITY_ICONS = {
    "critical": "🔴",
    "high": "🟡",
    "medium": "🔵",
}


def print_report(issues: list[dict]):
    print()
    print(DIVIDER)
    print(f"  {C.GOLD_B}🦥  LAZY LOAD AUDIT{C.RESET}")
    print(DIVIDER)

    if not issues:
        print(f"\n  {C.GREEN}✔{C.RESET}  All heavy imports are properly code-split! 🎉\n")
        return

    # Sort by severity, then size
    severity_order = {"critical": 0, "high": 1, "medium": 2}
    issues.sort(key=lambda x: (severity_order.get(x["severity"], 3), -x["size_kb"]))

    # Summary
    by_severity = {}
    for issue in issues:
        by_severity.setdefault(issue["severity"], []).append(issue)

    total_wasted_kb = sum(i["size_kb"] for i in issues)

    print(f"\n  {C.RED}{len(issues)}{C.RESET} lazy-loading issues found")
    print(f"  {C.GOLD_B}~{total_wasted_kb:,} KB{C.RESET} of unnecessary client-side JS\n")

    for sev in ["critical", "high", "medium"]:
        group = by_severity.get(sev, [])
        if not group:
            continue
        color = SEVERITY_COLORS[sev]
        icon = SEVERITY_ICONS[sev]
        print(f"  {icon} {color}{C.BOLD}{sev.upper()}{C.RESET}  ({len(group)} issues)")
        print(f"  {C.DARK}{'─' * 55}{C.RESET}")

        # Group by library
        by_lib: dict[str, list] = {}
        for issue in group:
            by_lib.setdefault(issue["library"], []).append(issue)

        for lib, lib_issues in sorted(by_lib.items(), key=lambda x: -sum(i["size_kb"] for i in x[1])):
            size = lib_issues[0]["size_kb"]
            size_str = f"~{size}KB" if size else ""
            print(f"\n    {color}{lib}{C.RESET}  {C.DIM}{size_str}{C.RESET}")
            for issue in lib_issues[:8]:
                line_str = f"L{issue['line']}" if issue["line"] else ""
                print(f"      {C.DIM}{issue['file']}{C.RESET}"
                      f"{'  ' + C.DARK + line_str + C.RESET if line_str else ''}")
                if issue["import_text"] and "missing" not in issue["import_text"].lower():
                    print(f"        {C.DIM}{issue['import_text'][:100]}{C.RESET}")
            if len(lib_issues) > 8:
                print(f"      {C.DIM}… and {len(lib_issues) - 8} more{C.RESET}")

        print()

    # Recommendations
    print(DIVIDER)
    print(f"  {C.GOLD_B}💡  HOW TO FIX{C.RESET}")
    print(DIVIDER)
    print(f"""
  {C.CYAN}1. Wrap heavy component imports with next/dynamic:{C.RESET}

     {C.DIM}// Before (blocks initial load):{C.RESET}
     {C.RED}import SolarSystem3D from './SolarSystem3D'{C.RESET}

     {C.DIM}// After (loads on demand):{C.RESET}
     {C.GREEN}import dynamic from 'next/dynamic'{C.RESET}
     {C.GREEN}const SolarSystem3D = dynamic(() => import('./SolarSystem3D'), {'{'}
       ssr: false,
       loading: () => <div className="animate-pulse bg-black/20 rounded-xl h-96" />
     {'}'}){C.RESET}

  {C.CYAN}2. Add <Suspense> around dynamic components:{C.RESET}

     {C.GREEN}<Suspense fallback={'{<LoadingSkeleton />}'}>
       <SolarSystem3D />
     </Suspense>{C.RESET}

  {C.CYAN}3. For three.js components, always use ssr: false{C.RESET}
     {C.DIM}(WebGL APIs don't exist on the server){C.RESET}

  {C.CYAN}4. For Script tags, use strategy="lazyOnload":{C.RESET}
     {C.GREEN}<Script strategy="lazyOnload" ...>{C.RESET}
""")


# ═══════════════════════════════════════════════════════════════════════════
# AUTO-FIX: Wrap imports with dynamic()
# ═══════════════════════════════════════════════════════════════════════════

def auto_fix_file(fpath: Path, issues: list[dict]) -> int:
    """Add dynamic() wrappers to static imports of heavy libraries."""
    try:
        content = fpath.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return 0

    # Only fix actual imports (not Script issues, not Suspense issues)
    fixable = [i for i in issues if i["size_kb"] > 0 and i["line"] > 0]
    if not fixable:
        return 0

    lines = content.split('\n')
    fixed = 0
    already_has_dynamic = "from 'next/dynamic'" in content or 'from "next/dynamic"' in content

    # Collect import lines to replace
    replacements: list[tuple[int, str, str]] = []  # (line_idx, old_line, new_lines)

    for issue in fixable:
        line_idx = issue["line"] - 1
        if line_idx >= len(lines):
            continue

        line = lines[line_idx]

        # Parse: import ComponentName from './path'
        # or: import { X } from 'module'
        default_import = re.match(
            r"^(\s*)import\s+(\w+)\s+from\s+['\"]([^'\"]+)['\"];?\s*$", line
        )
        if default_import:
            indent = default_import.group(1)
            name = default_import.group(2)
            path = default_import.group(3)

            # Build dynamic replacement
            new_line = (
                f"{indent}const {name} = dynamic(() => import('{path}'), {{\n"
                f"{indent}  ssr: false,\n"
                f"{indent}  loading: () => <div className=\"animate-pulse bg-black/10 rounded-xl h-64\" />\n"
                f"{indent}}});"
            )
            replacements.append((line_idx, line, new_line))
            fixed += 1

    if not replacements:
        return 0

    # Apply replacements in reverse order to preserve line numbers
    for line_idx, old_line, new_line in sorted(replacements, reverse=True):
        lines[line_idx] = new_line

    # Add dynamic import if not present
    if not already_has_dynamic:
        # Find first import line
        for i, line in enumerate(lines):
            if line.strip().startswith("import "):
                lines.insert(i, "import dynamic from 'next/dynamic';")
                break

    fpath.write_text('\n'.join(lines), encoding="utf-8")
    return fixed


def auto_fix_all(issues: list[dict]) -> int:
    """Apply auto-fixes across all files."""
    by_file: dict[str, list] = {}
    for issue in issues:
        by_file.setdefault(issue["file"], []).append(issue)

    total_fixed = 0
    for rel_path, file_issues in by_file.items():
        fpath = ROOT / rel_path
        if not fpath.exists():
            continue
        n = auto_fix_file(fpath, file_issues)
        if n:
            print(f"  {C.GREEN}✔{C.RESET}  Fixed {n} import(s) in {C.DIM}{rel_path}{C.RESET}")
            total_fixed += n

    return total_fixed


# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="🐂 Bullmoney Lazy Load Auditor")
    parser.add_argument("--fix", action="store_true",
                        help="Auto-wrap heavy static imports with next/dynamic")
    parser.add_argument("--strict", action="store_true",
                        help="Also flag framer-motion static imports")
    args = parser.parse_args()

    os.system('cls' if os.name == 'nt' else 'clear')
    print(f"\n{C.GOLD}  🦥  BULLMONEY LAZY LOAD AUDITOR{C.RESET}")

    issues = analyze_all(strict=args.strict)
    print_report(issues)

    if args.fix:
        print()
        print(DIVIDER)
        print(f"  {C.GOLD_B}🔧  AUTO-FIX{C.RESET}")
        print(DIVIDER)
        print()

        # Only auto-fix critical/high severity
        fixable = [i for i in issues if i["severity"] in ("critical", "high")]
        if fixable:
            n = auto_fix_all(fixable)
            print(f"\n  {C.GREEN}✔{C.RESET}  Fixed {C.GOLD_B}{n}{C.RESET} imports across the codebase")
            print(f"  {C.YELLOW}⚠{C.RESET}  Review changes and test — some components may need ssr: true")
        else:
            print(f"  {C.GREEN}✔{C.RESET}  Nothing to auto-fix!")
        print()

    print()


if __name__ == "__main__":
    main()
