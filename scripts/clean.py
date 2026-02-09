#!/usr/bin/env python3
"""
██████╗ ██╗   ██╗██╗     ██╗     ███╗   ███╗ ██████╗ ███╗   ██╗███████╗██╗   ██╗
██╔══██╗██║   ██║██║     ██║     ████╗ ████║██╔═══██╗████╗  ██║██╔════╝╚██╗ ██╔╝
██████╔╝██║   ██║██║     ██║     ██╔████╔██║██║   ██║██╔██╗ ██║█████╗   ╚████╔╝
██╔══██╗██║   ██║██║     ██║     ██║╚██╔╝██║██║   ██║██║╚██╗██║██╔══╝    ╚██╔╝
██████╔╝╚██████╔╝███████╗███████╗██║ ╚═╝ ██║╚██████╔╝██║ ╚████║███████╗   ██║
╚═════╝  ╚═════╝ ╚══════╝╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝   ╚═╝

  ⚡  WORKSPACE CLEANER  –  Run after every build / code change.
  
    python3 scripts/clean.py          ← preview without writing (default)
    python3 scripts/clean.py --apply  ← apply everything
    python3 scripts/clean.py --dry    ← preview without writing
"""

from __future__ import annotations

from _thread import lock
import argparse
import itertools
import json
import os
import platform
import re
import shutil
import subprocess
import sys
import threading
import time
from concurrent.futures import Future, ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any, Callable, Match, Pattern

# ═══════════════════════════════════════════════════════════════════════════
# BRANDING
# ═══════════════════════════════════════════════════════════════════════════

BULL_LOGO = r"""
                                  ╔══════════════════════════════════════════╗
    ██████╗ ██╗   ██╗██╗     ██╗  ║                                          ║
    ██╔══██╗██║   ██║██║     ██║  ║   ███╗   ███╗ ██████╗ ███╗   ██╗██╗   ██║
    ██████╔╝██║   ██║██║     ██║  ║   ████╗ ████║██╔═══██╗████╗  ██║╚██╗ ██╔║
    ██╔══██╗██║   ██║██║     ██║  ║   ██╔████╔██║██║   ██║██╔██╗ ██║ ╚████╔╝║
    ██████╔╝╚██████╔╝███████╗██║  ║   ██║╚██╔╝██║╚██████╔╝██║╚████║  ╚██╔╝ ║
    ╚═════╝  ╚═════╝ ╚══════╝╚═╝ ║   ╚═╝ ╚═╝ ╚═╝ ╚═════╝ ╚═╝  ╚═══╝  ╚═╝  ║
                                  ╚══════════════════════════════════════════╝
"""

BULL_ASCII = r"""
                            \.
                             \\      /
                              \\ ___//
                               (o  o)
                          ____ /    |
                         / ___\  /\ \   🐂  BULLMONEY
                        / /   | |  \ \      WORKSPACE CLEANER
                        \ \   | |   / /
                         \ \  | |  / /
                          \___| |_/ /
                              | |
                             _| |_
                            (_____)
"""

# ═══════════════════════════════════════════════════════════════════════════
# COLORS (ANSI escape codes — gold/amber theme)
# ═══════════════════════════════════════════════════════════════════════════

class C:
    """Bullmoney brand colors for terminal."""
    RESET    = "\033[0m"
    BOLD     = "\033[1m"
    DIM      = "\033[2m"
    ITALIC   = "\033[3m"
    UNDER    = "\033[4m"
    # Brand colors
    GOLD     = "\033[38;2;217;189;106m"    # #D9BD6A
    GOLD_B   = "\033[1;38;2;246;231;182m"  # #F6E7B6 bold
    AMBER    = "\033[38;2;184;152;58m"     # #B8983A
    DARK     = "\033[38;2;40;36;20m"       # dark gold
    # Standard
    WHITE    = "\033[97m"
    GREEN    = "\033[38;2;74;222;128m"     # modern green
    RED      = "\033[38;2;248;113;113m"    # modern red
    YELLOW   = "\033[38;2;250;204;21m"     # modern yellow
    CYAN     = "\033[38;2;103;232;249m"    # modern cyan
    GRAY     = "\033[38;2;120;120;120m"
    # Backgrounds
    BG_GOLD  = "\033[48;2;217;189;106m"
    BG_BLACK = "\033[48;2;10;10;10m"
    BG_DARK  = "\033[48;2;26;26;10m"


def gold(s: str) -> str:
    return f"{C.GOLD}{s}{C.RESET}"

def gold_bold(s: str) -> str:
    return f"{C.GOLD_B}{s}{C.RESET}"

def amber(s: str) -> str:
    return f"{C.AMBER}{s}{C.RESET}"

def green(s: str) -> str:
    return f"{C.GREEN}{s}{C.RESET}"

def red(s: str) -> str:
    return f"{C.RED}{s}{C.RESET}"

def dim(s: str) -> str:
    return f"{C.DIM}{s}{C.RESET}"

def bold(s: str) -> str:
    return f"{C.BOLD}{s}{C.RESET}"

def cyan(s: str) -> str:
    return f"{C.CYAN}{s}{C.RESET}"

# ═══════════════════════════════════════════════════════════════════════════
# TERMINAL UI
# ═══════════════════════════════════════════════════════════════════════════

DIVIDER: str      = f"{C.AMBER}{'━' * 64}{C.RESET}"
DIVIDER_THIN: str = f"{C.DARK}{'─' * 64}{C.RESET}"

def clear_screen() -> None:
    os.system('cls' if os.name == 'nt' else 'clear')

def print_logo() -> None:
    for line in BULL_ASCII.split('\n'):
        print(f"{C.GOLD}{line}{C.RESET}")

def print_header(title: str) -> None:
    print()
    print(DIVIDER)
    print(f"  {C.GOLD_B}⚡  {title}{C.RESET}")
    print(DIVIDER)

def print_phase(title: str) -> None:
    print()
    print(f"  {C.AMBER}▸{C.RESET}  {C.BOLD}{title}{C.RESET}")
    print(f"  {C.DARK}{'─' * 50}{C.RESET}")

def print_stat(label: str, value: int, color: str = C.GREEN) -> None:
    bar: str = "█" * min(value // 10, 30) if value > 0 else ""
    num: str = f"{color}{C.BOLD}{value:,}{C.RESET}" if value > 0 else f"{C.DIM}0{C.RESET}"
    print(f"    {num}  {label}  {C.DARK}{bar}{C.RESET}")

def success(text: str) -> None:
    print(f"  {C.GREEN}✔{C.RESET}  {text}")

def warn(text: str) -> None:
    print(f"  {C.YELLOW}⚠{C.RESET}  {text}")

# ═══════════════════════════════════════════════════════════════════════════
# ANIMATED SPINNER
# ═══════════════════════════════════════════════════════════════════════════

SPINNER_BULL: list[str] = ["🐂", "🐂", "🐂", "💰", "💰", "📈", "📈", "⚡", "⚡", "🔥"]
SPINNER_FRAMES: list[str] = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]

PHASE_MESSAGES: dict[str, list[str]] = {
    "scan": [
        "Scanning the bull's workspace…",
        "Crawling through every file…",
        "Hunting for issues like a bull…",
        "Reading source code…",
        "Indexing the entire codebase…",
        "Nothing escapes the bull's eye…",
    ],
    "tailwind": [
        "Fixing Tailwind v4 classes…",
        "Migrating gradient utilities…",
        "Converting arbitrary values…",
        "Modernizing class names…",
        "Cleaning up opacity syntax…",
        "Tailwind errors don't stand a chance…",
        "Making CSS classes pristine…",
    ],
    "lint": [
        "Fixing lint & type issues…",
        "Stripping trailing whitespace…",
        "Replacing @ts-ignore…",
        "Normalizing null checks…",
        "Ensuring final newlines…",
        "TypeScript purity achieved…",
        "Making ESLint happy…",
    ],
    "junk": [
        "Deleting backup files…",
        "Clearing .bak and .old…",
        "Removing root clutter…",
        "Sweeping temp files…",
        "Taking out the trash…",
        "Keeping the repo lean…",
    ],
    "rename": [
        "Fixing filenames with spaces…",
        "Renaming directories…",
        "Updating import paths…",
        "Cleaning file references…",
        "Normalizing file names…",
    ],
    "cache": [
        "Clearing stale .next build cache…",
        "Wiping TypeScript build info…",
        "Removing stale compiled output…",
        "Flushing old build artifacts…",
        "Busting the cache like a bull…",
        "Clearing Next.js hot-reload state…",
    ],
    "errors": [
        "Re-checking for TypeScript errors…",
        "Running type checker (tsc --noEmit)…",
        "Validating the codebase…",
        "Ensuring zero type errors…",
        "The bull demands type safety…",
    ],
    "refresh": [
        "Triggering browser hot-reload…",
        "Forcing Next.js to refresh…",
        "Kicking the dev server…",
        "Auto-refreshing your browser…",
    ],
    "done": [
        "Wrapping up…",
        "Almost there…",
        "Finishing touches…",
        "Polishing the workspace…",
    ],
    "deploy": [
        "Running next build for deploy check…",
        "Compiling all pages and routes…",
        "Verifying production build…",
        "The bull demands a clean deploy…",
    ],
}


class LiveSpinner:
    def __init__(self) -> None:
        self._phase = "scan"
        self._running = False
        self._thread: threading.Thread | None = None
        self._lock: lock = threading.Lock()
        self._fix_count = 0
        self._file_count = 0
        self._current_file: str = ""

    def _render(self) -> None:
        spin: itertools.cycle[str] = itertools.cycle(SPINNER_FRAMES)
        bull: itertools.cycle[str] = itertools.cycle(SPINNER_BULL)
        msg_idx = 0
        tick = 0
        while self._running:
            frame: str = next(spin)
            emoji: str = next(bull) if tick % 3 == 0 else ""
            with self._lock:
                msgs: list[str] = PHASE_MESSAGES.get(self._phase, PHASE_MESSAGES["scan"])
                msg: str = msgs[msg_idx % len(msgs)]
                parts: list[str] = [f"{C.GOLD}{frame}{C.RESET}  {msg}"]
                if self._fix_count:
                    parts.append(f"{C.GREEN}{self._fix_count:,} fixes{C.RESET}")
                if self._file_count:
                    parts.append(f"{C.CYAN}{self._file_count} files{C.RESET}")
                if self._current_file:
                    short: str = self._current_file
                    if len(short) > 38:
                        short: str = "…" + short[-37:]
                    parts.append(f"{C.DIM}{short}{C.RESET}")
                if emoji:
                    parts.append(emoji)

            line: str = "  " + "  │  ".join(parts)
            sys.stdout.write(f"\033[2K\r{line}")
            sys.stdout.flush()
            time.sleep(0.08)
            tick += 1
            if tick % 25 == 0:
                msg_idx += 1

    def start(self) -> None:
        self._running = True
        self._thread = threading.Thread(target=self._render, daemon=True)
        self._thread.start()

    def stop(self) -> None:
        self._running = False
        if self._thread:
            self._thread.join(timeout=1)
        sys.stdout.write("\033[2K\r")
        sys.stdout.flush()

    def set_phase(self, phase: str) -> None:
        with self._lock:
            self._phase: str = phase

    def set_file(self, name: str) -> None:
        with self._lock:
            self._current_file: str = name

    def set_counts(self, fixes: int = 0, files: int = 0) -> None:
        with self._lock:
            self._fix_count: int = fixes
            self._file_count: int = files


spinner = LiveSpinner()


# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

ROOT: Path = Path(__file__).resolve().parent.parent

SKIP_DIRS: set[str] = {
    "node_modules", ".next", ".git", "static-app", "my-app",
    "portfolio-overlay", ".venv", "__pycache__", ".turbo", ".vercel",
    "dist", "build", ".cache", ".bullclean",
}

CODE_EXTENSIONS: set[str] = {".tsx", ".ts", ".jsx", ".js", ".css", ".mdx", ".html", ".vue", ".svelte"}

ROOT_JUNK_PATTERNS: set[str] = {
    "CAROUSEL_SETUP_INSTRUCTIONS.md", "COMPLETION_SUMMARY.md",
    "DASHBOARD_SETTINGS_GUIDE.md", "IMPLEMENTATION_NEXT_STEPS.md",
    "PERFORMANCE_OPTIMIZATIONS.md", "REFACTORING_VISUAL_SUMMARY.txt",
    "SETTINGS_SYSTEM_VISUAL_SUMMARY.md", "VISUAL_SUMMARY.txt",
    "COMPLETE_SECTION_EXAMPLE.tsx", "ENHANCED_SETTINGS_MODAL.tsx",
}


# ═══════════════════════════════════════════════════════════════════════════
# STATS
# ═══════════════════════════════════════════════════════════════════════════

class Stats:
    def __init__(self) -> None:
        self.tailwind_fixes = 0
        self.lint_fixes = 0
        self.files_modified = 0
        self.files_deleted: list[str] = []
        self.files_renamed: list[tuple[str, str]] = []
        self.changed_files: dict[str, int] = {}
        self.cache_cleared: list[str] = []
        self.ts_errors: int | None = None
        self.hot_reloaded = False
        self.deploy_ok: bool | None = None
        self.deploy_output: str = ""

    @property
    def total(self) -> int:
        return self.tailwind_fixes + self.lint_fixes

    def report(self) -> None:
        print_header("RESULTS")

        has_code_changes: list[str] | list[tuple[str, str]] | bool = self.total > 0 or self.files_deleted or self.files_renamed

        if has_code_changes:
            print()
            print_stat("Tailwind fixes", self.tailwind_fixes, C.CYAN)
            print_stat("Lint / type fixes", self.lint_fixes, C.YELLOW)
            print()
            print(f"  {C.AMBER}{'─' * 40}{C.RESET}")
            print_stat("TOTAL CODE FIXES", self.total, C.GOLD_B)
            print()
            print_stat("Files modified", self.files_modified, C.GREEN)
            print_stat("Files deleted", len(self.files_deleted), C.RED)
            print_stat("Files renamed", len(self.files_renamed), C.CYAN)
            print()
        else:
            print()
            print(f"  {C.GREEN}{'━' * 50}{C.RESET}")
            print(f"  {C.GREEN}✔{C.RESET}  {C.GOLD_B}Code is already clean!{C.RESET}  🐂💰")
            print(f"  {C.GREEN}{'━' * 50}{C.RESET}")
            print()

        # Always show cache / health / HMR status
        if self.cache_cleared:
            print(f"  {C.YELLOW}🗑{C.RESET}  Cleared stale caches: {C.CYAN}{', '.join(self.cache_cleared)}{C.RESET}")

        if self.ts_errors is None:
            print(f"  {C.YELLOW}⚠{C.RESET}  TypeScript: {C.YELLOW}skipped{C.RESET}")
        elif self.ts_errors == 0:
            print(f"  {C.GREEN}✔{C.RESET}  TypeScript: {C.GREEN}0 errors{C.RESET}")
        else:
            print(f"  {C.RED}✖{C.RESET}  TypeScript: {C.RED}{self.ts_errors} error(s) remaining{C.RESET}")

        if self.hot_reloaded:
            print(f"  {C.GREEN}✔{C.RESET}  Browser hot-reload triggered  {C.DIM}(touched next.config.mjs){C.RESET}")

        if self.deploy_ok is True:
            print(f"  {C.GREEN}✔{C.RESET}  {C.GREEN}Deploy check PASSED{C.RESET}  —  ready for production 🚀")
        elif self.deploy_ok is False:
            print(f"  {C.RED}✖{C.RESET}  {C.RED}Deploy check FAILED{C.RESET}")
            if self.deploy_output:
                for line in self.deploy_output.strip().split('\n')[-5:]:
                    print(f"    {C.DIM}{line}{C.RESET}")
        print()

        if self.changed_files:
            top: list[tuple[str, int]] = sorted(self.changed_files.items(), key=lambda x: -x[1])[:15]
            print(f"  {C.AMBER}Top changed files:{C.RESET}")
            for fname, c in top:
                bar_len: int = min(c // 3, 25)
                bar: str = f"{C.GOLD}{'█' * bar_len}{C.RESET}"
                print(f"    {C.GOLD_B}{c:4d}{C.RESET}  {bar}  {C.DIM}{fname}{C.RESET}")
            if len(self.changed_files) > 15:
                print(f"    {C.DIM}… and {len(self.changed_files) - 15} more{C.RESET}")
            print()

        if self.files_deleted:
            print(f"  {C.AMBER}Deleted:{C.RESET}")
            for f in sorted(self.files_deleted):
                print(f"    {C.RED}🗑{C.RESET}  {f}")
            print()

        if self.files_renamed:
            print(f"  {C.AMBER}Renamed:{C.RESET}")
            for old, new in sorted(self.files_renamed):
                print(f"    {old}  {C.GOLD}→{C.RESET}  {new}")
            print()


stats = Stats()


# ═══════════════════════════════════════════════════════════════════════════
# UNDO SUPPORT
# ═══════════════════════════════════════════════════════════════════════════

class UndoManager:
    def __init__(self, root: Path) -> None:
        self.root: Path = root
        self.enabled = False
        self.entries: dict[str, dict[str, str | None]] = {}
        self.undo_root: Path = root / ".bullclean"
        self.files_dir: Path = self.undo_root / "undo-files"
        self.manifest_path: Path = self.undo_root / "undo-manifest.json"

    def enable(self) -> None:
        self.enabled = True
        if self.undo_root.exists():
            try:
                shutil.rmtree(self.undo_root)
            except Exception:
                pass
        self.files_dir.mkdir(parents=True, exist_ok=True)

    def backup(self, path: Path, action: str, new_path: Path | None = None) -> None:
        if not self.enabled:
            return
        try:
            rel = str(path.relative_to(self.root))
        except ValueError:
            return
        if rel in self.entries:
            return

        backup_path: Path = self.files_dir / rel
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        if path.exists() and path.is_file():
            try:
                shutil.copy2(path, backup_path)
            except Exception:
                return

        entry: dict[str, str | None] = {
            "path": rel,
            "backup": str(backup_path.relative_to(self.root)),
            "action": action,
            "new_path": None,
        }
        if new_path is not None:
            try:
                entry["new_path"] = str(new_path.relative_to(self.root))
            except ValueError:
                entry["new_path"] = None
        self.entries[rel] = entry

    def write_manifest(self) -> None:
        if not self.enabled:
            return
        payload: dict[str, Any] = {
            "root": str(self.root),
            "created": time.time(),
            "entries": list(self.entries.values()),
        }
        try:
            self.manifest_path.parent.mkdir(parents=True, exist_ok=True)
            self.manifest_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        except Exception:
            pass

    def apply_undo(self) -> None:
        if not self.manifest_path.exists():
            warn("No undo manifest found.")
            return

        try:
            payload = json.loads(self.manifest_path.read_text(encoding="utf-8"))
        except Exception:
            warn("Undo manifest is unreadable.")
            return

        entries = payload.get("entries", [])
        # Remove renamed targets first to avoid conflicts
        for entry in entries:
            new_rel = entry.get("new_path")
            if not new_rel:
                continue
            new_abs = self.root / new_rel
            if new_abs.exists():
                try:
                    if new_abs.is_dir():
                        shutil.rmtree(new_abs)
                    else:
                        new_abs.unlink()
                except Exception:
                    pass

        for entry in entries:
            rel = entry.get("path")
            backup_rel = entry.get("backup")
            if not rel or not backup_rel:
                continue
            backup = self.root / backup_rel
            target = self.root / rel
            if backup.exists() and backup.is_file():
                try:
                    target.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(backup, target)
                except Exception:
                    pass


UNDO = UndoManager(ROOT)


def prompt_yes_no(message: str, default: bool = False) -> bool:
    if not sys.stdin.isatty():
        return default
    prompt: str = "[y/N]" if not default else "[Y/n]"
    try:
        resp: str = input(f"  {message} {prompt} ").strip().lower()
    except EOFError:
        return default
    if not resp:
        return default
    return resp in {"y", "yes"}


# ═══════════════════════════════════════════════════════════════════════════
# TAILWIND v4 FIXES
# ═══════════════════════════════════════════════════════════════════════════

def px_to_tw(px: float) -> str:
    val: float = px / 4
    if val == int(val):
        return str(int(val))
    return f"{val:.2f}".rstrip("0").rstrip(".")


## PRE-COMPILED: known rem→spacing, viewport shorthands, etc.
_REM_TO_SPACING: dict[str, str] = {
    "0.5rem": "2", "1rem": "4", "1.5rem": "6", "2rem": "8", "2.5rem": "10",
    "3rem": "12", "3.5rem": "14", "4rem": "16", "5rem": "20", "6rem": "24",
    "7rem": "28", "8rem": "32", "9rem": "36", "10rem": "40", "11rem": "44",
    "12rem": "48", "13rem": "52", "14rem": "56", "15rem": "60", "16rem": "64",
    "18rem": "72", "20rem": "80", "22rem": "88", "24rem": "96",
    "28rem": "112", "32rem": "128",
}
_REM_TO_NAMED: dict[str, str] = {
    "20rem": "xs", "24rem": "sm", "28rem": "md", "32rem": "lg",
    "36rem": "xl", "42rem": "2xl", "48rem": "3xl", "56rem": "4xl",
    "64rem": "5xl", "72rem": "6xl", "80rem": "7xl",
}
_VIEWPORT_MAP: dict[str, str] = {
    "h-[100dvh]": "h-dvh", "h-[100vh]": "h-screen", "h-[100svh]": "h-svh",
    "h-[100lvh]": "h-lvh", "w-[100vw]": "w-screen", "w-[100dvw]": "w-dvw",
    "min-h-[100dvh]": "min-h-dvh", "min-h-[100vh]": "min-h-screen",
    "min-h-[100svh]": "min-h-svh", "max-h-[100dvh]": "max-h-dvh",
}


def apply_tailwind_fixes(text: str, ext: str = "") -> tuple[str, int]:
    count = 0

    def counted_sub(
        pattern: str | Pattern[str],
        repl: str | Callable[[Match[str]], str],
        s: str,
        flags: int = 0,
    ) -> str:
        nonlocal count
        new, n = re.subn(pattern, repl, s, flags=flags)
        count += n
        return new

    # ── Gradient / decoration (v3 → v4) ──────────────────────────────
    text = counted_sub(r'\bbg-gradient-to-', 'bg-linear-to-', text)
    text = counted_sub(r'(?<!box-)\bdecoration-clone\b', 'box-decoration-clone', text)
    text = counted_sub(r'(?<!box-)\bdecoration-slice\b', 'box-decoration-slice', text)

    # ── Opacity shorthand: class/[0.05] → class/5 ───────────────────
    def fix_opacity(m: Match[str]) -> str:
        return f"{m.group(1)}/{round(float(m.group(2)) * 100)}"
    text = counted_sub(r'([\w:.-]+)/\[(\d+\.\d+)\]', fix_opacity, text)

    # ── Z-index: do NOT rewrite (allow all values) ──────────────────

    # ── Pixel values to spacing tokens ───────────────────────────────
    # Prefer `*-px` for 1px spacing utilities
    def fix_one_px(m: Match[str]) -> str:
        return f"{m.group(1)}px"
    text = counted_sub(
        r'((?:[\w]+:)*(?:max-|min-)?(?:w|h|top|bottom|left|right|inset|inset-x|inset-y|'
        r'gap|space-x|space-y|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|size|basis|indent|'
        r'scroll-m|scroll-p|rounded|border-spacing|translate-x|translate-y)-)\[1px\]',
        fix_one_px, text
    )
    def fix_px(m: Match[str]) -> str:
        return f"{m.group(1)}{px_to_tw(float(m.group(2)))}"
    text = counted_sub(
        r'((?:[\w]+:)*(?:max-|min-)?(?:w|h|top|bottom|left|right|inset|gap|space-x|space-y|'
        r'p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|size|basis|indent|scroll-m|scroll-p|'
        r'rounded|border-spacing|translate-x|translate-y)-)\[(\d+(?:\.\d+)?)px\]',
        fix_px, text
    )

    def fix_neg_px(m: Match[str]) -> str:
        return f"{m.group(1) or ''}-{m.group(2)}-{px_to_tw(float(m.group(3)))}"
    text = counted_sub(
        r'((?:[\w]+:)*)(top|bottom|left|right|inset|translate-x|translate-y)-\[-(\d+(?:\.\d+)?)px\]',
        fix_neg_px, text
    )

    def fix_border_px(m: Match[str]) -> str:
        px_val = float(m.group(2))
        if px_val == 1:
            return f"{m.group(1)}border"
        return f"{m.group(1)}border-{px_to_tw(px_val)}"
    text = counted_sub(r'((?:[\w]+:)*)border-\[(\d+(?:\.\d+)?)px\]', fix_border_px, text)

    # ── Flex utilities ───────────────────────────────────────────────
    text = counted_sub(r'\bflex-grow-0\b', 'grow-0', text)
    text = counted_sub(r'\bflex-grow\b(?!-)', 'grow', text)
    text = counted_sub(r'\bflex-shrink-0\b', 'shrink-0', text)
    text = counted_sub(r'\bflex-shrink\b(?!-)', 'shrink', text)

    # ── Renamed utilities (v4) ───────────────────────────────────────
    text = counted_sub(r'\boverflow-ellipsis\b', 'text-ellipsis', text)
    text = counted_sub(r'\bbreak-words\b', 'wrap-break-word', text)
    text = counted_sub(r'\bbreak-all\b', 'wrap-break-all', text)
    text = counted_sub(r'\bbreak-normal\b', 'wrap-normal', text)

    # ── Important modifier: !prefix → prefix! (v4) ──────────────────
    # Matches things like !max-w-none, !p-0, !mt-4, etc. in className contexts
    # SAFETY: requires a hyphen in the class name to avoid matching JS negation (!key, !password)
    # SAFETY: skip .js files entirely — they never contain Tailwind class names
    if ext not in {'.js'}:
        def fix_important(m: Match[str]) -> str:
            return f"{m.group(1)}{m.group(2)}!"
        text = counted_sub(
            r'(?<=[\s"\'`{])!((?:[\w]+:)*)([\w]+(?:-[\w-]+)+)',
            fix_important, text
        )

    # ── Descendant variant: [&_*]: → **: and [&>*]: → >*: ──────────
    text = counted_sub(r'\[&_\*\]:', '**:', text)
    text = counted_sub(r'\[&>\*\]:', '>*:', text)
    text = counted_sub(r'\[&_p\]:', '**:p-', text)  # common descendant

    # ── Arbitrary properties → native utilities ──────────────────────
    # [mask-image:X] → mask-[X]
    def fix_mask(m: Match[str]) -> str:
        return f"{m.group(1) or ''}mask-[{m.group(2)}]"
    text = counted_sub(r'((?:[\w]+:)*)\[mask-image:([^\]]+)\]', fix_mask, text)

    # [perspective:X] → perspective-[X]
    def fix_perspective(m: Match[str]) -> str:
        return f"{m.group(1) or ''}perspective-[{m.group(2)}]"
    text = counted_sub(r'((?:[\w]+:)*)\[perspective:([^\]]+)\]', fix_perspective, text)

    # [transform-style:preserve-3d] → transform-3d
    text = counted_sub(r'\[transform-style:preserve-3d\]', 'transform-3d', text)
    text = counted_sub(r'\[transform-style:flat\]', 'transform-flat', text)

    # [backface-visibility:hidden] → backface-hidden
    text = counted_sub(r'\[backface-visibility:hidden\]', 'backface-hidden', text)
    text = counted_sub(r'\[backface-visibility:visible\]', 'backface-visible', text)

    # bg-[length:X] → bg-size-[X]
    def fix_bg_length(m: Match[str]) -> str:
        return f"{m.group(1) or ''}bg-size-[{m.group(2)}]"
    text = counted_sub(r'((?:[\w]+:)*)bg-\[length:([^\]]+)\]', fix_bg_length, text)

    # [background-size:X] → bg-size-[X]  (arbitrary property form)
    def fix_bg_size_arb(m: Match[str]) -> str:
        return f"{m.group(1) or ''}bg-size-[{m.group(2)}]"
    text = counted_sub(r'((?:[\w]+:)*)\[background-size:([^\]]+)\]', fix_bg_size_arb, text)

    # ── Negative zero → plain zero ──────────────────────────────────
    # -right-0 → right-0,  -translate-x-0 → translate-x-0, etc.
    def fix_neg_zero(m: Match[str]) -> str:
        return f"{m.group(1) or ''}{m.group(2)}-0"
    text = counted_sub(
        r'((?:[\w]+:)*)-(top|bottom|left|right|inset|inset-x|inset-y|'
        r'translate-x|translate-y|mx|my|mt|mb|ml|mr|m|scroll-m|scroll-p)-0\b',
        fix_neg_zero, text
    )

    # ── Viewport shorthand: h-[100dvh] → h-dvh ─────────────────────
    for old, new in _VIEWPORT_MAP.items():
        # Handle with optional variant prefix
        pattern: str = r'((?:[\w]+:)*)' + re.escape(old)
        replacement: str = r'\1' + new
        text = counted_sub(pattern, replacement, text)

    # ── Rem values → spacing / named widths ─────────────────────────
    def fix_rem_value(m: Match[str]) -> str:
        prefix = m.group(1)
        prop = m.group(2)
        rem_str = m.group(3)
        rem_key = rem_str + "rem"

        # For width props, prefer named sizes (xs, sm, md, lg, etc.)
        if prop in ("w", "max-w", "min-w"):
            if rem_key in _REM_TO_NAMED:
                return f"{prefix}{prop}-{_REM_TO_NAMED[rem_key]}"
        # Fall back to numeric spacing
        if rem_key in _REM_TO_SPACING:
            return f"{prefix}{prop}-{_REM_TO_SPACING[rem_key]}"
        return m.group(0)  # no change

    text = counted_sub(
        r'((?:[\w]+:)*)((?:max-|min-)?(?:w|h|size|gap|p|px|py|pt|pb|pl|pr|'
        r'm|mx|my|mt|mb|ml|mr))-\[(\d+(?:\.\d+)?)rem\]',
        fix_rem_value, text
    )

    # ── Specific common replacements ─────────────────────────────────
    # inset-[-100%] → -inset-full  (common pattern)
    text = counted_sub(r'((?:[\w]+:)*)inset-\[-100%\]', r'\1-inset-full', text)

    # aspect-[3/2] → aspect-3/2
    text = counted_sub(r'((?:[\w]+:)*)aspect-\[(\d+/\d+)\]', r'\1aspect-\2', text)

    return text, count


# ═══════════════════════════════════════════════════════════════════════════
# LINT / TYPE FIXES
# ═══════════════════════════════════════════════════════════════════════════

def apply_lint_fixes(text: str, ext: str) -> tuple[str, int]:
    count = 0
    lines: list[str] = text.split('\n')
    new_lines: list[str] = []

    for line in lines:
        stripped: str = line.rstrip()
        if stripped != line and line.strip():
            line: str = stripped
            count += 1
        new_lines.append(line)

    text = '\n'.join(new_lines)

    if text.startswith('\ufeff'):
        text = text[1:]
        count += 1

    if text and not text.endswith('\n'):
        text += '\n'
        count += 1
    while text.endswith('\n\n'):
        text = text[:-1]
        count += 1

    if ext in {'.ts', '.tsx', '.js', '.jsx'}:
        old_text: str = text
        text = re.sub(r'//\s*@ts-ignore\b', '// @ts-expect-error', text)
        count += len(re.findall(r'//\s*@ts-ignore\b', old_text))

        old_text: str = text
        text = re.sub(r'(?<!=)\b==\s*null\b', '=== null', text)
        text = re.sub(r'(?<!=)\b!=\s*null\b', '!== null', text)
        count += len(re.findall(r'(?<!=)\b==\s*null\b', old_text))
        count += len(re.findall(r'(?<!=)\b!=\s*null\b', old_text))

        # NOTE: Do not rewrite non-null assertions ("!") in JSX.
        # It can invert runtime logic for booleans like disabled/aria-hidden.

        # Note: skipping auto-alt injection for <img> tags — it breaks JSX arrow
        # functions like onLoad={() => ...} because `>` appears in the callback.

    return text, count


def contains_sql(text: str) -> bool:
    # Heuristic to avoid mutating embedded SQL in JS/TS strings.
    return bool(re.search(r"\b(select|insert|update|delete|from|where|join|group\s+by|order\s+by)\b", text, re.IGNORECASE))


def contains_scroll_sensitive(text: str) -> bool:
    # Avoid touching files with scroll/overflow rules to prevent scroll regressions.
    return bool(re.search(r"\b(overflow-|overscroll-|scroll-|scrollbar|touch-action|scroll-snap)\b", text))


def contains_supabase_query(text: str) -> bool:
    # Heuristic to avoid mutating Supabase query chains in client/server code.
    return bool(re.search(r"\.(from|select|insert|update|delete)\(\s*['\"]", text))


SQL_SENSITIVE_PATH_SUBSTRINGS: tuple[str, ...] = (
    "/app/api/",
    "/app/admin/",
    "/components/Admin",
    "/components/admin/",
    "/components/REGISTER_USERS/",
    "/contexts/",
    "/context/",
    "/lib/supabase",
    "/models/",
    "/sql/",
    "/supabase/",
    "/VIP/",
    "/recruit/",
    "/products/",
)


def is_sql_sensitive_path(path: Path) -> bool:
    path_str = str(path.as_posix())
    return any(segment in path_str for segment in SQL_SENSITIVE_PATH_SUBSTRINGS)


ROUTE_FILENAMES: set[str] = {"route.ts", "route.tsx", "route.js", "route.jsx"}


def is_route_file(path: Path) -> bool:
    return path.name in ROUTE_FILENAMES


PROTECTED_PATH_SUBSTRINGS: tuple[str, ...] = (
    "/components/store/StoreHeader.tsx",
    "/app/globals.css",
    "/app/page.tsx",
    "/app/store/page.tsx",
)


def is_protected_path(path: Path) -> bool:
    path_str = str(path.as_posix())
    return any(segment in path_str for segment in PROTECTED_PATH_SUBSTRINGS)


RENAME_SKIP_EXTENSIONS: set[str] = {".sql"}
RENAME_SKIP_PREFIXES: tuple[str, ...] = (".env",)
RENAME_SKIP_PATH_SUBSTRINGS: tuple[str, ...] = (
    "/supabase/migrations/",
    "/sql/",
    "/components/store/",
    "/app/",
)


def should_skip_rename(path: Path) -> bool:
    if should_skip(path):
        return True
    if path.suffix.lower() in RENAME_SKIP_EXTENSIONS:
        return True
    if path.name.startswith(RENAME_SKIP_PREFIXES):
        return True
    path_str = str(path.as_posix())
    return any(segment in path_str for segment in RENAME_SKIP_PATH_SUBSTRINGS)


# ═══════════════════════════════════════════════════════════════════════════
# FILE SYSTEM CLEANUP
# ═══════════════════════════════════════════════════════════════════════════

def should_skip(path: Path) -> bool:
    return any(part in SKIP_DIRS for part in path.parts)

def find_backup_files() -> list[Path]:
    results: list[Path] = []
    for suffix in (".bak", ".old"):
        for p in ROOT.rglob(f"*{suffix}"):
            if not should_skip(p) and p.is_file():
                results.append(p)
    return list(set(results))

def find_root_junk() -> list[Path]:
    return [ROOT / n for n in ROOT_JUNK_PATTERNS if (ROOT / n).exists()]

def find_files_with_spaces() -> list[Path]:
    results: list[Path] = []
    for p in ROOT.rglob("*"):
        if should_skip_rename(p):
            continue
        if " " in p.name:
            results.append(p)
    return sorted(results, key=lambda p: len(p.parts), reverse=True)

def rename_path_no_spaces(path: Path) -> Path:
    return path.parent / path.name.replace(" ", "_")

def update_imports_for_rename(old_name: str, new_name: str) -> None:
    old_base: str = Path(old_name).name
    new_base: str = Path(new_name).name
    if old_base == new_base:
        return
    for ext in CODE_EXTENSIONS:
        for fpath in ROOT.rglob(f"*{ext}"):
            if should_skip(fpath):
                continue
            try:
                content: str = fpath.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
            new_content: str = content.replace(old_base, new_base)
            if new_content != content:
                if UNDO.enabled:
                    UNDO.backup(fpath, "modify")
                fpath.write_text(new_content, encoding="utf-8")


# ═══════════════════════════════════════════════════════════════════════════
# PROCESSORS
# ═══════════════════════════════════════════════════════════════════════════

def process_code_files(apply: bool, only_files: set[Path] | None = None) -> None:
    spinner.set_phase("scan")

    files: list[Path] = []
    for ext in CODE_EXTENSIONS:
        for fpath in ROOT.rglob(f"*{ext}"):
            if not should_skip(fpath) and fpath.is_file():
                if only_files is None or fpath in only_files:
                    files.append(fpath)

    spinner.set_phase("tailwind")

    # ── Parallel file processing for speed ───────────────────────────
    def process_one(fpath: Path) -> tuple[str, int, int, str] | None:
        rel = str(fpath.relative_to(ROOT))
        try:
            content: str = fpath.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            return None

        if fpath.suffix in {'.ts', '.tsx', '.js', '.jsx', '.css', '.mdx', '.html', '.vue', '.svelte'}:
            if (
                is_route_file(fpath)
                or is_protected_path(fpath)
                or is_sql_sensitive_path(fpath)
                or contains_sql(content)
                or contains_supabase_query(content)
                or contains_scroll_sensitive(content)
            ):
                # Skip all edits when SQL-like strings or scroll-sensitive rules are present.
                return None

        tw_fixed, tw_count = apply_tailwind_fixes(content, fpath.suffix)
        lint_fixed, lint_count = apply_lint_fixes(tw_fixed, fpath.suffix)

        total: int = tw_count + lint_count
        if total == 0:
            return None

        if apply:
            if UNDO.enabled:
                UNDO.backup(fpath, "modify")
            fpath.write_text(lint_fixed, encoding="utf-8")

        return (rel, tw_count, lint_count, lint_fixed)

    workers: int = min(8, max(1, len(files) // 20))
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures: list[Future[tuple[str, int, int, str] | None]] = [
            pool.submit(process_one, f) for f in files
        ]
        for future in as_completed(futures):
            result: tuple[str, int, int, str] | None = future.result()
            if result is None:
                continue
            rel, tw_count, lint_count, _ = result
            stats.tailwind_fixes += tw_count
            stats.lint_fixes += lint_count
            stats.files_modified += 1
            stats.changed_files[rel] = tw_count + lint_count
            spinner.set_file(rel)
            spinner.set_counts(stats.total, stats.files_modified)


def process_junk_files(apply: bool) -> None:
    spinner.set_phase("junk")
    for p in find_backup_files() + find_root_junk():
        rel = str(p.relative_to(ROOT))
        spinner.set_file(rel)
        if apply:
            if UNDO.enabled:
                UNDO.backup(p, "delete")
            try:
                p.unlink()
                stats.files_deleted.append(rel)
            except Exception:
                pass
        else:
            stats.files_deleted.append(rel)


def process_file_renames(apply: bool) -> None:
    spinner.set_phase("rename")
    for p in find_files_with_spaces():
        new_path: Path = rename_path_no_spaces(p)
        rel_old = str(p.relative_to(ROOT))
        rel_new = str(new_path.relative_to(ROOT))
        spinner.set_file(rel_old)
        if apply:
            try:
                if UNDO.enabled:
                    UNDO.backup(p, "rename", new_path)
                p.rename(new_path)
                stats.files_renamed.append((rel_old, rel_new))
                update_imports_for_rename(p.name, new_path.name)
            except Exception:
                pass
        else:
            stats.files_renamed.append((rel_old, rel_new))


def clean_empty_dirs(apply: bool) -> None:
    for dirpath in sorted(ROOT.rglob("*"), key=lambda p: len(p.parts), reverse=True):
        if not dirpath.is_dir() or should_skip(dirpath):
            continue
        try:
            if not any(dirpath.iterdir()):
                if apply:
                    dirpath.rmdir()
        except Exception:
            pass


# ═══════════════════════════════════════════════════════════════════════════
# STALE BUILD / CACHE CLEARING
# ═══════════════════════════════════════════════════════════════════════════


# Directories & files that accumulate stale state
STALE_TARGETS: list[str] = [
    ".next",                  # Next.js build cache
    "tsconfig.tsbuildinfo",   # TypeScript incremental build info
    ".tsbuildinfo",           # alt location
    ".eslintcache",           # ESLint cache
    ".swc",                   # SWC compiler cache
]


def clear_stale_builds(apply: bool) -> None:
    """Remove stale build caches so the dev server picks up fresh state."""
    spinner.set_phase("cache")

    for target_name in STALE_TARGETS:
        target: Path = ROOT / target_name
        spinner.set_file(target_name)
        if not target.exists():
            continue

        if apply:
            try:
                if target.is_dir():
                    shutil.rmtree(target)
                else:
                    target.unlink()
                stats.cache_cleared.append(target_name)
            except Exception as e:
                warn(f"Could not remove {target_name}: {e}")
        else:
            stats.cache_cleared.append(target_name)


# ═══════════════════════════════════════════════════════════════════════════
# SINGLE TSC RUN  (cached — only called ONCE per session for speed)
# ═══════════════════════════════════════════════════════════════════════════

_tsc_output_cache: str | None = None


def run_tsc_once(force: bool = False, timeout: int = 180) -> str:
    """Run tsc --noEmit and cache the result for this session."""
    global _tsc_output_cache
    if _tsc_output_cache is not None and not force:
        return _tsc_output_cache

    spinner.set_phase("errors")
    spinner.set_file("tsc --noEmit")

    tsc_bin: Path = ROOT / "node_modules" / ".bin" / "tsc"
    cmd: list[str] = [str(tsc_bin), "--noEmit"] if tsc_bin.exists() else ["npx", "tsc", "--noEmit"]

    try:
        result: subprocess.CompletedProcess[str] = subprocess.run(
            cmd, cwd=str(ROOT), capture_output=True, text=True, timeout=timeout,
        )
        _tsc_output_cache = result.stdout + result.stderr
    except (FileNotFoundError, subprocess.TimeoutExpired, Exception):
        _tsc_output_cache = ""

    return _tsc_output_cache


def invalidate_tsc_cache() -> None:
    """Force a fresh tsc run on next call."""
    global _tsc_output_cache
    _tsc_output_cache = None


def _count_tsc_errors(output: str) -> int:
    error_match: re.Match[str] | None = re.search(r'Found\s+(\d+)\s+error', output)
    if error_match:
        return int(error_match.group(1))
    return len(re.findall(r'error TS\d+', output))


def extract_tsc_error_files(output: str) -> set[Path]:
    files: set[Path] = set()
    if not output:
        return files
    pattern: Pattern[str] = re.compile(r'^(.+?)\(\d+,\d+\):\s*error TS\d+:', re.MULTILINE)
    for m in pattern.finditer(output):
        fpath = Path(m.group(1))
        if not fpath.is_absolute():
            fpath: Path = ROOT / fpath
        if fpath.exists():
            files.add(fpath)
    return files


def recheck_errors(force: bool = False) -> str:
    """Run tsc --noEmit to re-check for type errors after all fixes."""
    output: str = run_tsc_once(force=force)
    stats.ts_errors = _count_tsc_errors(output)
    return output


def remove_unused_ts_expect_errors(apply: bool) -> None:
    """Run tsc, find TS2578 (unused @ts-expect-error), and remove those lines."""
    spinner.set_phase("errors")
    spinner.set_file("Scanning for stale @ts-expect-error…")

    output: str = run_tsc_once()
    if not output:
        return

    # Parse TS2578 errors: "file.tsx(123,5): error TS2578: Unused '@ts-expect-error' directive."
    pattern: Pattern[str] = re.compile(r'^(.+?)\((\d+),\d+\):\s*error TS2578:', re.MULTILINE)
    # Group by file → set of 1-based line numbers
    removals: dict[str, set[int]] = {}
    for m in pattern.finditer(output):
        fpath_str: str = m.group(1)
        lineno = int(m.group(2))
        removals.setdefault(fpath_str, set()).add(lineno)

    if not removals:
        return

    for fpath_str, line_numbers in removals.items():
        fpath = Path(fpath_str)
        if not fpath.is_absolute():
            fpath: Path = ROOT / fpath_str
        if not fpath.exists():
            continue

        rel = str(fpath.relative_to(ROOT))
        spinner.set_file(rel)

        try:
            lines: list[str] = fpath.read_text(encoding="utf-8", errors="ignore").split('\n')
        except Exception:
            continue

        # Remove lines at 1-based indices
        new_lines: list[str] = [line for i, line in enumerate(lines, 1) if i not in line_numbers]

        removed_count: int = len(lines) - len(new_lines)
        if removed_count == 0:
            continue

        stats.lint_fixes += removed_count
        stats.files_modified += 1
        stats.changed_files[rel] = stats.changed_files.get(rel, 0) + removed_count
        spinner.set_counts(stats.total, stats.files_modified)

        if apply:
            if UNDO.enabled:
                UNDO.backup(fpath, "modify")
            fpath.write_text('\n'.join(new_lines), encoding="utf-8")


# ═══════════════════════════════════════════════════════════════════════════
# HOT-RELOAD TRIGGER
# ═══════════════════════════════════════════════════════════════════════════

def trigger_hot_reload() -> None:
    """Touch a file to force Next.js dev server to hot-reload."""
    spinner.set_phase("refresh")
    spinner.set_file("Triggering HMR…")

    # Touch next.config.mjs — Next.js watches this and does a full refresh
    config_file: Path = ROOT / "next.config.mjs"
    if config_file.exists():
        try:
            config_file.touch()
            stats.hot_reloaded = True
            return
        except Exception:
            pass

    # Fallback: touch layout.tsx
    layout_file: Path = ROOT / "app" / "layout.tsx"
    if layout_file.exists():
        try:
            layout_file.touch()
            stats.hot_reloaded = True
            return
        except Exception:
            pass

    # Last resort: touch any page
    page_file: Path = ROOT / "app" / "page.tsx"
    if page_file.exists():
        try:
            page_file.touch()
            stats.hot_reloaded = True
        except Exception:
            pass


# ═══════════════════════════════════════════════════════════════════════════
# AUTO-INSTALL MISSING TYPE PACKAGES
# ═══════════════════════════════════════════════════════════════════════════

_TYPE_PACKAGES: dict[str, str] = {
    "bcryptjs": "@types/bcryptjs",
    "lodash": "@types/lodash",
    "jsonwebtoken": "@types/jsonwebtoken",
    "cookie": "@types/cookie",
    "uuid": "@types/uuid",
    "cors": "@types/cors",
}


def install_missing_types() -> None:
    """Check tsc output for TS7016 (missing declarations) and auto-install types."""
    spinner.set_phase("errors")
    spinner.set_file("Checking for missing type packages…")

    output: str = run_tsc_once()
    if not output:
        return

    # Find TS7016 errors: "Could not find a declaration file for module 'bcryptjs'"
    missing: set[str] = set()
    for m in re.finditer(r"error TS7016.*?module '([^']+)'", output):
        module_name: str = m.group(1).split("/")[0]
        if module_name in _TYPE_PACKAGES:
            missing.add(_TYPE_PACKAGES[module_name])

    if not missing:
        return

    spinner.set_file(f"Installing {', '.join(missing)}…")
    try:
        subprocess.run(
            ["npm", "install", "--save-dev"] + sorted(missing),
            cwd=str(ROOT), capture_output=True, text=True, timeout=60,
        )
    except Exception:
        pass


# ═══════════════════════════════════════════════════════════════════════════
# DEPLOY CHECK  (runs next build to verify deployability)
# ═══════════════════════════════════════════════════════════════════════════

def deploy_check() -> None:
    """Run next build to verify the project is deployable."""
    spinner.set_phase("errors")
    spinner.set_file("Running next build (deploy check)…")

    next_bin: Path = ROOT / "node_modules" / ".bin" / "next"
    cmd: list[str] = [str(next_bin), "build"] if next_bin.exists() else ["npx", "next", "build"]

    try:
        result: subprocess.CompletedProcess[str] = subprocess.run(
            cmd, cwd=str(ROOT), capture_output=True, text=True, timeout=600,
        )
        if result.returncode == 0:
            stats.deploy_ok = True
        else:
            stats.deploy_ok = False
            stats.deploy_output = result.stderr[-500:] if result.stderr else result.stdout[-500:]
    except subprocess.TimeoutExpired:
        stats.deploy_ok = False
        stats.deploy_output = "Build timed out (10 minutes)"
    except Exception as e:
        stats.deploy_ok = False
        stats.deploy_output = str(e)


# ═══════════════════════════════════════════════════════════════════════════
# POP-UP LAUNCHER  (opens a native terminal window on macOS / Windows)
# ═══════════════════════════════════════════════════════════════════════════

def launch_popup() -> None:
    """Re-launch this script in a dedicated native terminal window."""
    script = str(Path(__file__).resolve())
    system: str = platform.system()

    if system == "Darwin":
        # macOS — use osascript to open Terminal.app with a custom title
        apple_script: str = f'''
        tell application "Terminal"
            activate
            set newTab to do script "clear && printf '\\033]0;🐂 BULLMONEY CLEANER\\007' && python3 '{script}' --no-popup; echo ''; echo '  Press any key to close…'; read -n 1"
        end tell
        '''
        subprocess.Popen(["osascript", "-e", apple_script])

    elif system == "Windows":
        # Windows — use start cmd with title
        subprocess.Popen(
            f'start "🐂 BULLMONEY CLEANER" cmd /k "python \"{script}\" --no-popup & echo. & echo   Press any key to close... & pause >nul & exit"',
            shell=True
        )
    else:
        # Linux — try common terminals
        for term_cmd in [
            ["gnome-terminal", "--title=🐂 BULLMONEY CLEANER", "--", "python3", script, "--no-popup"],
            ["xterm", "-T", "🐂 BULLMONEY CLEANER", "-e", f"python3 {script} --no-popup; read"],
            ["konsole", "--title", "🐂 BULLMONEY CLEANER", "-e", f"python3 {script} --no-popup"],
        ]:
            try:
                subprocess.Popen(term_cmd)
                break
            except FileNotFoundError:
                continue


# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

def main() -> None:
    parser = argparse.ArgumentParser(description="🐂 Bullmoney Workspace Cleaner")
    parser.add_argument("--dry", action="store_true", help="Preview only")
    parser.add_argument("--apply", action="store_true", help="Apply changes")
    parser.add_argument("--no-tsc", action="store_true", help="Skip tsc checks")
    parser.add_argument("--tsc-timeout", type=int, default=180, help="tsc timeout in seconds")
    parser.add_argument("--popup", action="store_true", help="Open in a new native terminal window")
    parser.add_argument("--no-popup", action="store_true", help=argparse.SUPPRESS)  # internal
    parser.add_argument("--deploy", action="store_true", help="Full deploy check (tsc + next build)")
    parser.add_argument("--undo", action="store_true", help="Undo last clean.py changes")
    args: argparse.Namespace = parser.parse_args()

    # If --popup, re-launch in a native terminal window and exit
    if args.popup:
        launch_popup()
        return

    if args.undo:
        print_header("UNDO")
        UNDO.apply_undo()
        return

    apply: Any | bool = args.apply and not args.dry
    mode_label: str = "APPLY" if apply else "DRY-RUN"
    if args.deploy:
        mode_label += " + DEPLOY CHECK"

    clear_screen()
    print_logo()
    print_header(f"WORKSPACE CLEANER  —  {mode_label}")

    if not apply:
        print(f"\n  {C.YELLOW}ℹ{C.RESET}  Dry-run mode. Use --apply to write changes.\n")

    # System info bar
    py_ver: str = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    os_name: str = platform.system()
    print(f"  {C.DIM}Python {py_ver}  │  {os_name} {platform.machine()}  │  {ROOT.name}/{C.RESET}")
    print()

    if apply:
        if prompt_yes_no("Enable undo backups for this run?", default=False):
            UNDO.enable()

    t0: float = time.time()
    spinner.start()

    tsc_enabled: bool = not args.no_tsc
    baseline_output: str = ""
    baseline_error_files: set[Path] = set()
    if apply and tsc_enabled:
        baseline_output: str = run_tsc_once(force=True, timeout=args.tsc_timeout)
        baseline_error_files = extract_tsc_error_files(baseline_output)

    try:
        # Phase 1: Fix code (parallel)
        process_code_files(apply)

        # Phase 2: Delete junk
        process_junk_files(apply)

        # Phase 3: Rename files
        process_file_renames(apply)

        if apply:
            # Phase 4: Clean empty dirs
            clean_empty_dirs(apply)

            # Phase 5: Clear stale builds & caches
            clear_stale_builds(apply)

            if tsc_enabled:
                # Phase 6: Run tsc ONCE, then process results
                tsc_output: str = run_tsc_once(force=True, timeout=args.tsc_timeout)
                new_error_files: set[Path] = extract_tsc_error_files(tsc_output)

                # If new error files appeared, re-run fixes only for those files
                introduced_files: set[Path] = new_error_files - baseline_error_files
                if introduced_files:
                    process_code_files(apply, only_files=introduced_files)
                    invalidate_tsc_cache()
                    tsc_output: str = run_tsc_once(force=True, timeout=args.tsc_timeout)

                # Phase 7: Auto-install missing type packages (uses cached tsc)
                types_before: int = stats.lint_fixes
                install_missing_types()

                # Phase 8: Remove unused @ts-expect-error (uses cached tsc)
                expect_before: int = stats.lint_fixes
                remove_unused_ts_expect_errors(apply)
                phase78_changed: bool = (stats.lint_fixes != types_before) or (stats.lint_fixes != expect_before)

                # Phase 9: Re-run tsc only if phases 7-8 made changes
                if phase78_changed:
                    invalidate_tsc_cache()  # force fresh check
                    tsc_output: str = run_tsc_once(force=True, timeout=args.tsc_timeout)
                stats.ts_errors = _count_tsc_errors(tsc_output)
            else:
                stats.ts_errors = None

            # Phase 10: Deploy check (optional)
            if args.deploy:
                deploy_check()

            # Phase 11: Trigger browser hot-reload
            trigger_hot_reload()
    finally:
        spinner.set_phase("done")
        time.sleep(0.3)
        spinner.stop()
        if UNDO.enabled:
            UNDO.write_manifest()

    elapsed: float = time.time() - t0

    stats.report()

    # Final banner
    print(DIVIDER)
    print(f"  {C.GREEN}✔{C.RESET}  {gold_bold('Done')} in {C.GOLD}{elapsed:.1f}s{C.RESET}  🐂")
    print(DIVIDER)

    # ── Quick usage hint ─────────────────────────────────────────────
    print()
    if os_name == "Darwin":
        print(f"  {C.DIM}Quick access:  npm run clean   │   bullclean   │   double-click bullmoney-clean.command{C.RESET}")
    elif os_name == "Windows":
        print(f"  {C.DIM}Quick access:  npm run clean   │   bullclean   │   double-click bullmoney-clean.bat{C.RESET}")
    else:
        print(f"  {C.DIM}Quick access:  npm run clean   │   bullclean{C.RESET}")
    print()


if __name__ == "__main__":
    main()
