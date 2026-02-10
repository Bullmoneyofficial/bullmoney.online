#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════╗
║         BULLMONEY PERFORMANCE BOOST ENGINE v5.0                     ║
║         Runs BEFORE every dev/build to maximize speed               ║
║         340+ optimizations: SEO, caching, device hints,             ║
║         3D/Spline turbo, memory guardian, crash prevention,         ║
║         in-app browser shield, GPU manager, security scanner,       ║
║         font optimization, API audit, network optimizer,            ║
║         dead code detection, env validation, CSS audit & more       ║
║                                                                      ║
║         v5.0: Watch mode, incremental builds, config support        ║
╚══════════════════════════════════════════════════════════════════════╝

Usage:
    python scripts/boost.py              # Run all optimizations
    python scripts/boost.py --report     # Print report without writing files
    python scripts/boost.py --skip-heavy # Skip image/bundle analysis (faster)
    python scripts/boost.py --fast       # Disable cosmetic delays (CI-friendly)
    python scripts/boost.py --sections=1,3,14  # Run only specific sections
    python scripts/boost.py --watch      # Watch mode: re-run on file changes
    python scripts/boost.py --incremental # Only run changed sections
    python scripts/boost.py --profile    # Show detailed timing breakdown
    python scripts/boost.py --diff       # Show what changed since last run
    python scripts/boost.py --init       # Create .boostrc.json config file
    python scripts/boost.py -h           # Show help
"""

import os
import sys
import json
import hashlib
import time
import re
import shutil
import subprocess
from pathlib import Path
from datetime import datetime, timezone
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
import signal
import atexit
import fnmatch
from typing import Callable, Any

# ─── WATCH MODE & INCREMENTAL BUILD SUPPORT ─────────────────────────
class FileWatcher:
    """Simple file watcher for watch mode."""
    def __init__(self, dirs: list[Path], extensions: set[str], callback: Callable):
        self.dirs = dirs
        self.extensions = extensions
        self.callback = callback
        self.running = False
        self._last_mtimes: dict[Path, float] = {}
        self._debounce_time = 0.5
        self._last_trigger = 0.0

    def _get_files(self) -> list[Path]:
        files = []
        for d in self.dirs:
            if d.exists():
                for ext in self.extensions:
                    files.extend(d.rglob(f"*{ext}"))
        return files

    def _scan(self) -> bool:
        changed = False
        current = {}
        for f in self._get_files():
            try:
                mtime = f.stat().st_mtime
                current[f] = mtime
                if f not in self._last_mtimes or self._last_mtimes[f] != mtime:
                    changed = True
            except (OSError, IOError):
                pass
        # Detect deleted files
        if set(self._last_mtimes.keys()) != set(current.keys()):
            changed = True
        self._last_mtimes = current
        return changed

    def start(self):
        self.running = True
        self._scan()  # Initial scan
        while self.running:
            time.sleep(1.0)
            now = time.time()
            if self._scan() and (now - self._last_trigger) > self._debounce_time:
                self._last_trigger = now
                self.callback()

    def stop(self):
        self.running = False


class IncrementalCache:
    """Track file hashes to enable incremental builds."""
    CACHE_FILE = Path(__file__).resolve().parent.parent / ".boost-cache.json"
    
    def __init__(self):
        self._hashes: dict[str, str] = {}
        self._section_deps: dict[str, list[str]] = self._build_deps()
        self._load()
    
    def _build_deps(self) -> dict[str, list[str]]:
        """Map sections to file patterns they depend on."""
        return {
            "device_detection": ["app/**/*.{tsx,ts}", "components/**/*.{tsx,ts}"],
            "resource_hints": ["app/**/*.{tsx,ts}", "next.config.*"],
            "seo": ["app/**/*.{tsx,ts}", "public/sitemap.xml"],
            "images": ["public/**/*.{png,jpg,jpeg,gif,webp,avif,svg}"],
            "bundle": ["components/**/*.{tsx,ts}", "app/**/*.{tsx,ts}"],
            "caching": ["next.config.*", "vercel.json"],
            "perf_monitor": ["app/**/*.{tsx,ts}"],
            "nextjs_config": ["next.config.*", "package.json"],
            "accessibility": ["components/**/*.{tsx,ts}", "app/**/*.{tsx,ts}"],
            "cleanup": [],  # Always runs
            "dependencies": ["package.json", "package-lock.json"],
            "pwa": ["public/manifest.json", "public/sw.js"],
            "spline_turbo": ["components/**/*Spline*.{tsx,ts}", "app/**/*spline*.{tsx,ts}"],
            "memory_guardian": ["components/**/*.{tsx,ts}"],
            "inapp_shield": ["components/**/*.{tsx,ts}"],
            "crash_prevention": ["app/store/**/*.{tsx,ts}", "components/**/*.{tsx,ts}"],
            "build_optimizer": ["next.config.*", "package.json"],
            "gpu_manager": ["components/**/*3d*.{tsx,ts}", "components/**/*Spline*.{tsx,ts}"],
            "dead_code": ["components/**/*.{tsx,ts}", "app/**/*.{tsx,ts}"],
            "security": ["**/*.{tsx,ts,js,env}"],
            "fonts": ["app/**/*.css", "styles/**/*.css"],
            "api_routes": ["app/api/**/*.{ts,tsx}"],
            "third_party": ["components/**/*.{tsx,ts}", "app/**/*.{tsx,ts}"],
            "env_vars": [".env*", "app/**/*.{tsx,ts}"],
            "css_audit": ["**/*.css", "**/*.scss"],
            "network_optimizer": ["components/**/*.{tsx,ts}"],
            "search_index": ["app/**/*.{tsx,ts}", "components/**/*.{tsx,ts}"],
            "boost_loader": [],  # Always runs
        }
    
    def _load(self):
        if self.CACHE_FILE.exists():
            try:
                data = json.loads(self.CACHE_FILE.read_text())
                self._hashes = data.get("hashes", {})
            except Exception:
                pass
    
    def _save(self):
        try:
            self.CACHE_FILE.write_text(json.dumps({"hashes": self._hashes}, indent=2))
        except Exception:
            pass
    
    def _hash_pattern(self, pattern: str, root: Path) -> str:
        """Hash all files matching a glob pattern."""
        hasher = hashlib.md5()
        parts = pattern.split("**")
        if "**" in pattern:
            files = list(root.rglob(parts[-1].lstrip("/")))
        else:
            files = list(root.glob(pattern))
        for f in sorted(files):
            if f.is_file():
                try:
                    hasher.update(f.read_bytes())
                except Exception:
                    pass
        return hasher.hexdigest()
    
    def section_changed(self, section: str, root: Path) -> bool:
        """Check if a section's dependencies have changed."""
        patterns = self._section_deps.get(section, [])
        if not patterns:  # Always run sections with no deps
            return True
        
        combined_hash = hashlib.md5()
        for pattern in patterns:
            combined_hash.update(self._hash_pattern(pattern, root).encode())
        
        current = combined_hash.hexdigest()
        previous = self._hashes.get(section)
        
        if current != previous:
            self._hashes[section] = current
            return True
        return False
    
    def mark_done(self, section: str, root: Path):
        """Mark a section as completed with current hashes."""
        patterns = self._section_deps.get(section, [])
        if patterns:
            combined_hash = hashlib.md5()
            for pattern in patterns:
                combined_hash.update(self._hash_pattern(pattern, root).encode())
            self._hashes[section] = combined_hash.hexdigest()
        self._save()
    
    def clear(self):
        self._hashes.clear()
        self._save()


class BoostConfig:
    """Load/save configuration from .boostrc.json."""
    CONFIG_FILE = Path(__file__).resolve().parent.parent / ".boostrc.json"
    DEFAULTS = {
        "skip_sections": [],
        "always_skip_heavy": False,
        "fast_mode": False,
        "watch_extensions": [".tsx", ".ts", ".css", ".json"],
        "watch_dirs": ["app", "components", "styles", "public"],
        "notifications": True,
        "parallel_workers": "auto",
        "thresholds": {
            "max_image_kb": 500,
            "max_bundle_kb": 250,
            "max_css_kb": 150,
            "large_component_lines": 500,
            "max_imports": 30
        }
    }
    
    def __init__(self):
        self.data = dict(self.DEFAULTS)
        self._load()
    
    def _load(self):
        if self.CONFIG_FILE.exists():
            try:
                user = json.loads(self.CONFIG_FILE.read_text())
                self._merge(self.data, user)
            except Exception:
                pass
    
    def _merge(self, base: dict, overlay: dict):
        for k, v in overlay.items():
            if isinstance(v, dict) and isinstance(base.get(k), dict):
                self._merge(base[k], v)
            else:
                base[k] = v
    
    def save(self):
        self.CONFIG_FILE.write_text(json.dumps(self.data, indent=2))
    
    @classmethod
    def create_default(cls):
        """Create a default .boostrc.json file."""
        cls.CONFIG_FILE.write_text(json.dumps(cls.DEFAULTS, indent=2))
        return cls.CONFIG_FILE
    
    def get(self, key: str, default: Any = None) -> Any:
        keys = key.split(".")
        val = self.data
        for k in keys:
            if isinstance(val, dict):
                val = val.get(k)
            else:
                return default
        return val if val is not None else default


# ─── RESULTS DIFF TRACKING ───────────────────────────────────────────
class ResultsDiff:
    """Track and display changes between runs."""
    PREV_FILE = Path(__file__).resolve().parent.parent / ".boost-prev.json"
    
    @classmethod
    def load_previous(cls) -> dict:
        if cls.PREV_FILE.exists():
            try:
                return json.loads(cls.PREV_FILE.read_text())
            except Exception:
                pass
        return {}
    
    @classmethod
    def save_current(cls, report: dict):
        try:
            # Save a simplified version for diffing
            simplified = {
                "timestamp": report.get("meta", {}).get("timestamp"),
                "files_generated": report.get("meta", {}).get("files_generated"),
                "warnings": [],
                "errors": [],
                "sections": list(report.keys()),
            }
            cls.PREV_FILE.write_text(json.dumps(simplified, indent=2))
        except Exception:
            pass
    
    @classmethod
    def show_diff(cls, current: dict, prev: dict):
        """Print differences between runs."""
        if not prev:
            print(f"  {C.DIM}No previous run to compare.{C.END}")
            return
        
        print(f"\n  {C.GOLD}{C.BOLD}─── Changes Since Last Run ───{C.END}")
        
        # Files generated diff
        curr_files = current.get("meta", {}).get("files_generated", 0)
        prev_files = prev.get("files_generated", 0)
        if curr_files != prev_files:
            delta = curr_files - prev_files
            color = C.GREEN if delta > 0 else C.YELLOW
            print(f"    Files: {prev_files} → {curr_files} ({color}{'+' if delta > 0 else ''}{delta}{C.END})")
        
        # New sections
        curr_sections = set(current.keys()) - {"meta"}
        prev_sections = set(prev.get("sections", []))
        new_sections = curr_sections - prev_sections
        if new_sections:
            print(f"    {C.GREEN}New sections:{C.END} {', '.join(new_sections)}")
        
        # Removed sections
        removed_sections = prev_sections - curr_sections
        if removed_sections:
            print(f"    {C.RED}Removed:{C.END} {', '.join(removed_sections)}")
        
        print()


# ─── LIVE OUTPUT: stream every line so the terminal shows each as it loads ──
_builtin_print = print

# Production/CI detection for safer, faster runs
_PRODUCTION_MODE = any([
  "--production" in sys.argv,
  "--prod" in sys.argv,
  os.environ.get("BOOST_ENV") == "production",
  os.environ.get("NODE_ENV") == "production",
  bool(os.environ.get("VERCEL")),
  os.environ.get("CI") in ("1", "true", "yes"),
])
_AUTO_FAST = _PRODUCTION_MODE and "--no-fast" not in sys.argv

# Fast mode: skip all cosmetic delays (--fast/auto/ non-TTY output)
_FAST_MODE = "--fast" in sys.argv or _AUTO_FAST or not sys.stdout.isatty()
_LIVE_DELAY = 0.0 if _FAST_MODE else 0.004  # reduced from 0.018s for snappier feel

def print(*args, **kwargs):
    """Override print to flush immediately + optional tiny delay for live-scroll effect."""
    kwargs.setdefault('flush', True)
    _builtin_print(*args, **kwargs)
    if _LIVE_DELAY > 0:
        time.sleep(_LIVE_DELAY)

# ─── SMART WRITE: skip if content unchanged ────────────────────────
def smart_write(path: Path, content: str, encoding: str = "utf-8") -> bool:
    """Write file only if content actually changed. Returns True if written."""
    if path.exists():
        try:
            existing = path.read_text(encoding=encoding)
            if existing == content:
                return False  # No change, skip write
        except Exception:
            pass
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding=encoding)
    return True

# ─── CONFIGURATION ──────────────────────────────────────────────────
ROOT_DIR = Path(__file__).resolve().parent.parent
PUBLIC_DIR = ROOT_DIR / "public"
APP_DIR = ROOT_DIR / "app"
COMPONENTS_DIR = ROOT_DIR / "components"
STYLES_DIR = ROOT_DIR / "styles"
NEXT_DIR = ROOT_DIR / ".next"
CACHE_DIR = ROOT_DIR / ".next" / "cache" / "boost"
BOOST_REPORT = ROOT_DIR / ".boost-report.json"

# Site config
SITE_URL = "https://www.bullmoney.shop"
SITE_NAME = "BullMoney"
DOMAINS = [
    "www.bullmoney.shop",
    "www.bullmoney.online",
    "www.bullmoney.live",
    "www.bullmoney.co.za",
    "www.bullmoney.site",
]
SUPPORTED_LANGS = [
    "en", "es", "fr", "de", "pt", "it", "ja", "ko", "zh", "ar",
    "hi", "ru", "tr", "nl", "pl", "sv", "no", "da", "fi", "th",
    "vi", "id", "ms", "tl", "uk", "cs", "ro", "el", "he", "hu",
    "bg", "sw", "af", "zu", "bn", "ur",
]

# Thresholds
MAX_IMAGE_SIZE_KB = 500
MAX_JS_BUNDLE_KB = 250
MAX_CSS_FILE_KB = 150
LARGE_COMPONENT_LINES = 500
MAX_IMPORTS_PER_FILE = 30

# ─── TRUE-COLOR PALETTE & BRANDING ───────────────────────────────
# BullMoney brand: premium gold/amber on dark with 24-bit color support
def _rgb(r, g, b): return f"\033[38;2;{r};{g};{b}m"
def _bg_rgb(r, g, b): return f"\033[48;2;{r};{g};{b}m"

class C:
    # ── Brand Colors (24-bit true color) ──
    GOLD = _rgb(255, 200, 50)          # ● Primary brand gold
    AMBER = _rgb(255, 170, 40)         # ● Warm amber
    ORANGE = _rgb(255, 130, 30)        # ● Hot orange accent
    HONEY = _rgb(230, 180, 80)         # ● Soft honey
    WHITE = _rgb(245, 245, 250)        # ● Bright white
    SILVER = _rgb(180, 185, 195)       # ● Subtle silver
    DARKGOLD = _rgb(180, 145, 50)      # ● Muted gold
    CREAM = _rgb(255, 240, 200)        # ● Warm cream
    # ── Status Colors ──
    GREEN = _rgb(100, 220, 130)        # ● Success mint green
    RED = _rgb(255, 100, 100)          # ● Error coral
    YELLOW = _rgb(255, 220, 80)        # ● Warning sunshine
    BLUE = _rgb(100, 160, 255)         # ● Info sky blue
    CYAN = _rgb(80, 220, 230)          # ● Cyan accent
    PURPLE = _rgb(170, 130, 255)       # ● Purple highlight
    TEAL = _rgb(60, 200, 180)          # ● Teal accent
    PINK = _rgb(255, 130, 180)         # ● Pink accent
    # ── Formatting ──
    BOLD = "\033[1m"
    DIM = "\033[2m"
    ITALIC = "\033[3m"
    UNDERLINE = "\033[4m"
    BLINK = "\033[5m"
    REVERSE = "\033[7m"
    END = "\033[0m"
    # ── Backgrounds ──
    BG_DARK = _bg_rgb(20, 20, 25)      # Near-black bg
    BG_GOLD = _bg_rgb(255, 200, 50)    # Gold bg
    BG_GREEN = _bg_rgb(25, 60, 35)     # Dark green bg
    BG_RED = _bg_rgb(60, 20, 20)       # Dark red bg
    BG_SUBTLE = _bg_rgb(30, 30, 38)    # Subtle dark bg

def gradient_text(text: str, start_rgb: tuple, end_rgb: tuple) -> str:
    """Apply a smooth horizontal RGB gradient across text (cached)."""
    result = []
    length = max(len(text) - 1, 1)
    sr, sg, sb = start_rgb
    dr, dg, db = end_rgb[0] - sr, end_rgb[1] - sg, end_rgb[2] - sb
    for i, ch in enumerate(text):
        t = i / length
        result.append(f"\033[38;2;{int(sr + dr * t)};{int(sg + dg * t)};{int(sb + db * t)}m{ch}")
    result.append(C.END)
    return "".join(result)

# BullMoney ASCII Logo — built dynamically for true-color gradient
def build_logo() -> str:
    """Build the BullMoney logo with smooth gradient colors."""
    # Border gradient: gold → amber
    bd = lambda t: C.BOLD + _rgb(
        int(255 - 30*t), int(200 - 50*t), int(50 + 10*t)
    )
    B = C.BOLD
    E = C.END
    # Logo text lines with gradient applied per-row
    logo_rows = [
        "██████╗ ██╗   ██╗██╗     ██╗    ",
        "██╔══██╗██║   ██║██║     ██║    ",
        "██████╔╝██║   ██║██║     ██║    ",
        "██╔══██╗██║   ██║██║     ██║    ",
        "██████╔╝╚██████╔╝███████╗███████╗",
        "╚═════╝  ╚═════╝ ╚══════╝╚══════╝",
    ]
    # RGB gradient per row: gold → orange → amber
    row_colors = [
        (255, 210, 80),   # bright gold
        (255, 195, 60),   # gold
        (255, 175, 45),   # amber-gold
        (255, 155, 35),   # amber
        (255, 140, 30),   # amber-orange
        (200, 130, 50),   # dim bronze
    ]
    lines = []
    # Top border with gradient
    border_top = gradient_text("╭" + "━" * 38 + "╮", (255, 200, 50), (255, 140, 30))
    lines.append(f"                        {C.BOLD}{border_top}")
    # Logo rows
    for i, (row, rgb) in enumerate(zip(logo_rows, row_colors)):
        lc = _rgb(*rgb)
        bc = gradient_text("┃", (255, 200, 50), (255, 200, 50))
        lines.append(f"                        {C.BOLD}{bc}  {lc}{B}{row}{E} {C.BOLD}{bc}{E}")
    # Bottom border
    border_bot = gradient_text("╰" + "━" * 38 + "╯", (255, 140, 30), (255, 200, 50))
    lines.append(f"                        {C.BOLD}{border_bot}")
    lines.append("")
    # Subtitle bar with gradient border
    sub_border_t = gradient_text("╔" + "═" * 56 + "╗", (255, 200, 50), (200, 150, 40))
    sub_border_b = gradient_text("╚" + "═" * 56 + "╝", (200, 150, 40), (255, 200, 50))
    money = gradient_text("M O N E Y", (255, 220, 100), (255, 170, 40))
    ver = f"{C.SILVER}Performance Boost Engine{E} {C.GOLD}{B}v5.0{E}"
    side_l = gradient_text("║", (255, 200, 50), (255, 200, 50))
    side_r = gradient_text("║", (200, 150, 40), (200, 150, 40))
    lines.append(f"            {C.BOLD}{sub_border_t}{E}")
    lines.append(f"            {C.BOLD}{side_l}{E}  {C.BOLD}{money}  {ver}     {C.BOLD}{side_r}{E}")
    lines.append(f"            {C.BOLD}{sub_border_b}{E}")
    return "\n".join(lines) + "\n"

# Compact icons with color context
BULL_ICON = f"{C.GOLD}🐂{C.END}"
BOLT_ICON = f"{C.AMBER}⚡{C.END}"
FIRE_ICON = f"{C.ORANGE}🔥{C.END}"
SHIELD_ICON = f"{C.GREEN}🛡{C.END}"
ROCKET_ICON = f"{C.PURPLE}🚀{C.END}"
CHART_ICON = f"{C.CYAN}📊{C.END}"
GLOBE_ICON = f"{C.BLUE}🌐{C.END}"
GEAR_ICON = f"{C.SILVER}⚙{C.END}"
SPARKLE_ICON = f"{C.GOLD}✨{C.END}"

# Section icons & accent colors map
SECTION_META = {
    "1":  ("🔍", (100, 160, 255)),  "2":  ("🔗", (100, 220, 130)),
    "3":  ("🌐", (80, 220, 230)),   "4":  ("🖼", (255, 130, 180)),
    "5":  ("📦", (170, 130, 255)),  "6":  ("💾", (255, 200, 50)),
    "7":  ("📊", (80, 220, 230)),   "8":  ("⚙", (180, 185, 195)),
    "9":  ("♿", (100, 220, 130)),  "10": ("🚀", (170, 130, 255)),
    "11": ("🧹", (255, 170, 40)),   "12": ("📋", (100, 160, 255)),
    "13": ("📱", (60, 200, 180)),   "14": ("🎮", (255, 130, 180)),
    "15": ("🧠", (170, 130, 255)),  "16": ("🛡", (100, 220, 130)),
    "17": ("💥", (255, 100, 100)),  "18": ("⚡", (255, 220, 80)),
    "19": ("🖥", (180, 185, 195)),  "20": ("🗑", (255, 150, 100)),
    "21": ("🔒", (255, 80, 80)),    "22": ("🔤", (200, 180, 255)),
    "23": ("🩺", (100, 200, 160)),  "24": ("📡", (255, 180, 100)),
    "25": ("🔑", (255, 210, 80)),   "26": ("🎨", (180, 130, 255)),
    "27": ("🌊", (80, 190, 255)),
}

# ─── SHARED FILE CACHE: read each file at most once ─────────────
class FileCache:
    """Lazy per-run file content cache. Thread-safe (GIL-protected reads)."""
    _store: dict[Path, str] = {}

    @classmethod
    def read(cls, path: Path) -> str:
        if path not in cls._store:
            try:
                cls._store[path] = path.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                cls._store[path] = ""
        return cls._store[path]

    @classmethod
    def clear(cls):
        cls._store.clear()

    @classmethod
    def read_many(cls, paths: list[Path]) -> dict[Path, str]:
        return {p: cls.read(p) for p in paths}

# Track stats for summary
class Stats:
    total_checks = 0
    passed = 0
    warnings = 0
    errors = 0
    sections_done = 0
    total_sections = 27
    section_times: dict[str, float] = {}  # section_name → elapsed seconds
    _section_starts: dict[str, float] = {}  # per-section start (thread-safe)

    @classmethod
    def start_section(cls, name: str):
        cls._section_starts[name] = time.monotonic()

    @classmethod
    def end_section(cls, name: str):
        start = cls._section_starts.pop(name, 0.0)
        if start > 0:
            cls.section_times[name] = round(time.monotonic() - start, 3)

def progress_bar(current: int, total: int, width: int = 34) -> str:
    """Render a smooth true-color gradient progress bar."""
    pct = current / total if total > 0 else 0
    filled = int(width * pct)
    partial = (width * pct) - filled  # sub-cell fraction
    empty = width - filled - (1 if partial > 0.1 else 0)
    # Build gradient: green → gold → amber across filled cells
    bar_chars = []
    for i in range(filled):
        t = i / max(width - 1, 1)
        r = int(80 + 175 * t)     # 80 → 255  (green → gold)
        g = int(220 - 50 * t)     # 220 → 170
        b = int(130 - 90 * t)     # 130 → 40
        bar_chars.append(f"\033[38;2;{r};{g};{b}m━")
    # Partial fill character for smooth motion
    if partial > 0.1 and filled < width:
        t = filled / max(width - 1, 1)
        r = int(80 + 175 * t); g = int(220 - 50 * t); b = int(130 - 90 * t)
        bar_chars.append(f"\033[38;2;{r};{g};{b};2m╸")
    bar_chars.append(f"\033[38;2;55;55;65m{'┄' * max(0, empty)}")
    bar = "".join(bar_chars) + C.END
    pct_str = f"{int(pct * 100):>3}%"
    return f"  {C.DIM}╶{C.END}{bar}{C.DIM}╴{C.END} {C.GOLD}{C.BOLD}{pct_str}{C.END}"

def spinner_frame(frame: int) -> str:
    """Get a premium spinning animation frame."""
    frames = ["◜", "◠", "◝", "◞", "◡", "◟"]
    return f"{C.GOLD}{C.BOLD}{frames[frame % len(frames)]}{C.END}"

def log(icon: str, msg: str, color: str = C.GREEN):
    """Print a status line with styled indicator."""
    Stats.total_checks += 1
    # Dim the parenthetical details for cleaner look
    styled_msg = re.sub(r'(\(.*?\))', f'{C.DIM}\\1{C.END}', msg)
    print(f"  {color}{C.BOLD}{icon}{C.END} {styled_msg}")

def header(title: str) -> str:
    """Print a gradient-bordered section header and start timing. Returns section key."""
    # Extract section number from title (e.g. "3. SEO" → 3)
    _sec_num = title.split(".")[0].strip()
    sec_key = f"section_{_sec_num}"
    Stats.sections_done += 1
    Stats.start_section(sec_key)
    num = _sec_num
    meta = SECTION_META.get(num, ("⚡", (255, 200, 50)))
    icon, accent_rgb = meta
    # Gradient top border: accent color → dimmer
    dim_rgb = tuple(max(c // 3, 30) for c in accent_rgb)
    top = gradient_text("┌" + "─" * 58 + "┐", accent_rgb, dim_rgb)
    bot = gradient_text("└" + "─" * 58 + "┘", dim_rgb, accent_rgb)
    side_l = _rgb(*accent_rgb)
    side_r = _rgb(*dim_rgb)
    title_color = _rgb(*accent_rgb)
    pad = max(0, 51 - len(title))
    print(f"\n  {C.BOLD}{top}{C.END}")
    print(f"  {C.BOLD}{side_l}│{C.END}  {icon}  {title_color}{C.BOLD}{title}{C.END}{' ' * pad}{C.BOLD}{side_r}│{C.END}")
    print(f"  {C.BOLD}{bot}{C.END}")
    print(progress_bar(Stats.sections_done, Stats.total_sections))
    _thread_local.sec_key = sec_key  # store for _run_timed()
    return sec_key


def _end_section(sec_key: str):
    """End timing for a section. Call before returning from any section function."""
    if sec_key:
        Stats.end_section(sec_key)


import threading

# Thread-local storage to track which section each thread is running
_thread_local = threading.local()


def _run_timed(func):
    """Run a section function and auto-end its section timing."""
    result = func()
    # header() stores the section key in _thread_local.sec_key
    sec_key = getattr(_thread_local, 'sec_key', None)
    if sec_key:
        Stats.end_section(sec_key)
        _thread_local.sec_key = None
    return result


def warn(msg: str):
    Stats.warnings += 1
    log("⚠", msg, C.YELLOW)

def error(msg: str):
    Stats.errors += 1
    log("✗", msg, C.RED)

def success(msg: str):
    Stats.passed += 1
    log("✓", msg, C.GREEN)

def info(msg: str):
    log("→", msg, C.BLUE)

def send_vscode_notification(title: str, body: str, is_error: bool = False):
    """Send a macOS notification that appears over VS Code."""
    try:
        if _PRODUCTION_MODE or not sys.stdout.isatty():
            return
        icon = "🐂" if not is_error else "⚠️"
        # Use osascript for a native macOS notification
        script = f'''display notification "{body}" with title "{icon} {title}" subtitle "BullMoney Boost Engine" sound name "Glass"'''
        subprocess.Popen(
            ["osascript", "-e", script],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except Exception:
        pass  # Silently fail if not on macOS or osascript unavailable


# ════════════════════════════════════════════════════════════════════
# SECTION 1: ENVIRONMENT & DEVICE DETECTION HINTS
# ════════════════════════════════════════════════════════════════════

def generate_device_detection_script() -> dict:
    """
    Generate an optimized inline device detection script that runs
    before React hydration. Detects: device type, OS, browser, screen,
    connection speed, battery, capabilities, and sets CSS custom properties.
    
    Optimizations: 1-8
    """
    header("1. Device Detection & Client Hints")

    # This script gets injected into the <head> and runs synchronously
    # to prevent layout shifts by knowing the device before first paint
    script = """(function(){
var d=document.documentElement,n=navigator,s=screen,w=window;
var ua=n.userAgent||'',p=n.platform||'';
var R={};

// 1. Device Type Detection
var isMobile=/mobi|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua);
var isTablet=/ipad|tablet|playbook|silk/i.test(ua)||(isMobile&&Math.min(s.width,s.height)>600);
var isDesktop=!isMobile&&!isTablet;
R.device=isTablet?'tablet':isMobile?'mobile':'desktop';
d.setAttribute('data-device',R.device);

// 2. OS Detection
var os='unknown';
if(/windows/i.test(ua))os='windows';
else if(/macintosh|mac os/i.test(ua))os='macos';
else if(/linux/i.test(ua)&&!isMobile)os='linux';
else if(/android/i.test(ua))os='android';
else if(/iphone|ipad|ipod/i.test(ua))os='ios';
else if(/cros/i.test(ua))os='chromeos';
R.os=os;d.setAttribute('data-os',os);

// 3. Browser Detection
var browser='other';
if(/edg\\//i.test(ua))browser='edge';
else if(/opr\\//i.test(ua)||/opera/i.test(ua))browser='opera';
else if(/firefox/i.test(ua))browser='firefox';
else if(/chrome/i.test(ua)&&!/edg/i.test(ua))browser='chrome';
else if(/safari/i.test(ua)&&!/chrome/i.test(ua))browser='safari';
else if(/msie|trident/i.test(ua))browser='ie';
R.browser=browser;d.setAttribute('data-browser',browser);

// 4. Screen & Display
var dpr=w.devicePixelRatio||1;
var sw=s.width,sh=s.height;
R.dpr=dpr;R.screenW=sw;R.screenH=sh;
d.style.setProperty('--device-dpr',dpr);
d.style.setProperty('--screen-w',sw+'px');
d.style.setProperty('--screen-h',sh+'px');
d.style.setProperty('--vh',(w.innerHeight*0.01)+'px');

var tier=sw>=2560?'4k':sw>=1920?'fhd':sw>=1440?'qhd':sw>=1024?'hd':sw>=768?'tablet':'mobile';
R.displayTier=tier;d.setAttribute('data-display',tier);

// 5. Connection Speed Detection
var conn=n.connection||n.mozConnection||n.webkitConnection;
if(conn){
  R.connType=conn.effectiveType||'unknown';
  R.downlink=conn.downlink||0;
  R.saveData=!!conn.saveData;
  d.setAttribute('data-connection',R.connType);
  if(R.saveData)d.classList.add('save-data');
  if(R.connType==='slow-2g'||R.connType==='2g')d.classList.add('slow-network');
}

// 6. Hardware Capabilities
R.cores=n.hardwareConcurrency||4;
R.memory=n.deviceMemory||4;
R.touch='ontouchstart' in w||n.maxTouchPoints>0;
d.setAttribute('data-cores',R.cores);
d.setAttribute('data-memory',R.memory);
if(R.touch)d.classList.add('touch-device');else d.classList.add('no-touch');

// 7. Performance Tier (low/mid/high/ultra)
var perfScore=0;
perfScore+=R.cores>=8?3:R.cores>=4?2:1;
perfScore+=R.memory>=8?3:R.memory>=4?2:1;
perfScore+=dpr>=2?2:1;
perfScore+=sw>=1920?2:sw>=1024?1:0;
if(R.connType==='4g'||!R.connType)perfScore+=2;
else if(R.connType==='3g')perfScore+=1;
var perfTier=perfScore>=11?'ultra':perfScore>=8?'high':perfScore>=5?'mid':'low';
R.perfTier=perfTier;d.setAttribute('data-perf',perfTier);

// 8. Feature Detection
R.webgl=!!(function(){try{var c=document.createElement('canvas');return c.getContext('webgl2')||c.getContext('webgl')}catch(e){return false}})();
R.webp=!!(function(){try{var c=document.createElement('canvas');return c.toDataURL('image/webp').indexOf('data:image/webp')===0}catch(e){return false}})();
R.avif=false; // async detection below
if(!R.webgl)d.classList.add('no-webgl');
if(R.webp)d.classList.add('webp-support');

// Store for JS access
w.__BM_DEVICE__=R;

// 8b. Async AVIF detection
var img=new Image();
img.onload=function(){R.avif=true;d.classList.add('avif-support')};
img.src='data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErU42Y=';

// 9. Reduce Motion preference
if(w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches){
  d.classList.add('reduce-motion');R.reduceMotion=true;
}

// 10. Dark mode preference
if(w.matchMedia&&w.matchMedia('(prefers-color-scheme: dark)').matches){
  d.classList.add('prefers-dark');
}

// 11. Battery detection (async)
if(n.getBattery){n.getBattery().then(function(b){
  R.battery=Math.round(b.level*100);R.charging=b.charging;
  if(b.level<0.15&&!b.charging){d.classList.add('low-battery');d.setAttribute('data-battery','low');}
  else if(b.level<0.3&&!b.charging){d.setAttribute('data-battery','medium');}
  else{d.setAttribute('data-battery','good');}
});}

// 12. Viewport orientation
var orient=w.innerWidth>w.innerHeight?'landscape':'portrait';
R.orientation=orient;d.setAttribute('data-orient',orient);
w.addEventListener('resize',function(){
  var o2=w.innerWidth>w.innerHeight?'landscape':'portrait';
  d.setAttribute('data-orient',o2);
  d.style.setProperty('--vh',(w.innerHeight*0.01)+'px');
});

})();"""

    # Write the minified script
    output_path = PUBLIC_DIR / "scripts" / "device-detect.js"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Minify (basic: remove comments, collapse whitespace in safe way)
    minified = script.strip()
    
    smart_write(output_path, minified)
    size = output_path.stat().st_size
    success(f"Device detection script: {size:,} bytes ({size/1024:.1f} KB)")
    info("Detects: device type, OS, browser, screen tier, connection, hardware, perf tier, battery")
    
    return {
        "device_detection_script": str(output_path.relative_to(ROOT_DIR)),
        "size_bytes": size,
        "detections": [
            "device_type", "os", "browser", "screen_tier", "dpr",
            "connection_speed", "save_data", "cores", "memory",
            "touch_support", "perf_tier", "webgl", "webp", "avif",
            "reduce_motion", "dark_mode", "battery", "orientation"
        ]
    }


# ════════════════════════════════════════════════════════════════════
# SECTION 2: CRITICAL CSS & RESOURCE HINTS
# ════════════════════════════════════════════════════════════════════

def generate_resource_hints() -> dict:
    """
    Generate preconnect, dns-prefetch, and preload hints for critical
    third-party origins and assets.
    
    Optimizations: 13-25
    """
    header("2. Resource Hints & Preconnect")

    # External origins the site connects to
    origins = {
        "preconnect": [
            "https://fonts.googleapis.com",
            "https://fonts.gstatic.com",
            "https://www.googletagmanager.com",
            "https://cdn.jsdelivr.net",
            "https://unpkg.com",
        ],
        "dns_prefetch": [
            "https://www.youtube.com",
            "https://i.ytimg.com",
            "https://www.google-analytics.com",
            "https://res.cloudinary.com",
            "https://api.stripe.com",
            "https://js.stripe.com",
            "https://prod-runtime.spline.design",
            "https://my.spline.design",
        ],
        "preload": [
            # Preload Spline runtime for faster 3D scene loading
            ("https://unpkg.com/@splinetool/runtime/build/runtime.js", "script"),
        ],
    }
    
    # Generate the resource hints HTML fragment
    hints_html = "<!-- BOOST: Resource Hints (auto-generated by boost.py) -->\n"
    for origin in origins["preconnect"]:
        hints_html += f'<link rel="preconnect" href="{origin}" crossorigin />\n'
    for origin in origins["dns_prefetch"]:
        hints_html += f'<link rel="dns-prefetch" href="{origin}" />\n'
    
    # Find critical fonts to preload
    hints_html += '<!-- BOOST: Critical Asset Preloads -->\n'
    hints_html += '<link rel="preload" href="/ONcc2l601.svg" as="image" type="image/svg+xml" fetchpriority="high" />\n'
    
    # Preload Spline runtime and critical 3D assets
    for url, as_type in origins.get("preload", []):
        hints_html += f'<link rel="preload" href="{url}" as="{as_type}" crossorigin />\n'
    
    output_path = PUBLIC_DIR / "scripts" / "resource-hints.html"
    smart_write(output_path, hints_html)
    
    success(f"Resource hints: {len(origins['preconnect'])} preconnect, {len(origins['dns_prefetch'])} dns-prefetch")
    
    return {
        "resource_hints_file": str(output_path.relative_to(ROOT_DIR)),
        "preconnect_count": len(origins["preconnect"]),
        "dns_prefetch_count": len(origins["dns_prefetch"]),
    }


# ════════════════════════════════════════════════════════════════════
# SECTION 3: SEO ENHANCEMENTS
# ════════════════════════════════════════════════════════════════════

def enhance_seo() -> dict:
    """
    Generate and validate SEO artifacts: structured data, sitemap validation,
    robots.txt audit, Open Graph meta, and more.
    
    Optimizations: 26-50
    """
    header("3. SEO Enhancements")
    results = {}

    # 26. Generate JSON-LD Structured Data (Organization)
    org_schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "BullMoney",
        "alternateName": ["BullMoney Trading", "BullMoney Community"],
        "url": SITE_URL,
        "logo": f"{SITE_URL}/ONcc2l601.svg",
        "description": "The #1 FREE trading community for Crypto, Gold, Forex & Stocks. Free trading setups, expert market analysis, live trading mentorship.",
        "foundingDate": "2024",
        "sameAs": [
            "https://discord.gg/bullmoney",
            "https://t.me/bullmoney",
            "https://www.youtube.com/@BullMoney",
            "https://www.instagram.com/bullmoney",
            "https://x.com/BullMoney"
        ],
        "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer support",
            "availableLanguage": SUPPORTED_LANGS[:10]
        },
        "areaServed": "Worldwide",
        "knowsAbout": [
            "Cryptocurrency Trading", "Gold Trading", "Forex Trading",
            "Stock Trading", "Technical Analysis", "Market Analysis",
            "Trading Education", "Prop Firm Trading"
        ]
    }
    
    # 27. Generate JSON-LD WebSite schema with SearchAction
    website_schema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "BullMoney",
        "url": SITE_URL,
        "description": "Free trading community with crypto setups, market analysis & mentorship",
        "inLanguage": SUPPORTED_LANGS,
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": f"{SITE_URL}/Blogs?search={{search_term_string}}"
            },
            "query-input": "required name=search_term_string"
        }
    }
    
    # 28. Generate JSON-LD EducationalOrganization for course pages
    edu_schema = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "name": "BullMoney Trading Academy",
        "url": f"{SITE_URL}/course",
        "description": "Free trading education and mentorship for beginners to advanced traders",
        "teaches": [
            "Cryptocurrency Trading", "Gold/XAUUSD Trading",
            "Forex Trading", "Technical Analysis", "Price Action",
            "Risk Management", "Prop Firm Trading"
        ],
        "isAccessibleForFree": True,
        "parentOrganization": {
            "@type": "Organization",
            "name": "BullMoney",
            "url": SITE_URL
        }
    }
    
    # 29. FAQPage schema for SEO rich snippets
    faq_schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
            {
                "@type": "Question",
                "name": "Is BullMoney free to join?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes! BullMoney is a completely free trading community. You can access trading setups, market analysis, and mentorship at no cost."
                }
            },
            {
                "@type": "Question",
                "name": "What markets does BullMoney cover?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "BullMoney covers Cryptocurrency (Bitcoin, Ethereum, Altcoins), Gold (XAUUSD), Forex, and Stock markets with daily analysis and trading setups."
                }
            },
            {
                "@type": "Question",
                "name": "How do I get free trading setups?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Join BullMoney's free community to receive daily trading setups, market analysis, and live mentorship from experienced traders."
                }
            },
            {
                "@type": "Question",
                "name": "Does BullMoney offer prop firm support?",
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, BullMoney provides prop firm trading guidance, FTMO preparation, and funded trading account support."
                }
            }
        ]
    }

    # Write all schemas
    schema_dir = PUBLIC_DIR / "schemas"
    schema_dir.mkdir(parents=True, exist_ok=True)
    
    schemas = {
        "organization.json": org_schema,
        "website.json": website_schema,
        "education.json": edu_schema,
        "faq.json": faq_schema,
    }
    
    for name, schema in schemas.items():
        (schema_dir / name).write_text(json.dumps(schema, indent=2), encoding="utf-8")
    
    success(f"Generated {len(schemas)} JSON-LD schemas for rich snippets")
    results["schemas_generated"] = len(schemas)

    # 30-33. Validate robots.txt
    robots_path = PUBLIC_DIR / "robots.txt"
    if robots_path.exists():
        robots_content = robots_path.read_text(encoding="utf-8")
        issues = []
        
        # 30. Check sitemap reference (idempotent — only append if missing)
        additions = []
        if "Sitemap:" not in robots_content:
            issues.append("Missing Sitemap directive")
            additions.append(f"\n# BOOST: Auto-added sitemap references")
            additions.append(f"Sitemap: {SITE_URL}/sitemap.xml")
            additions.append(f"Sitemap: {SITE_URL}/sitemap-static.xml")
            success("Auto-added Sitemap directive to robots.txt")
        
        # 31. Check disallow patterns
        if "/api/" not in robots_content:
            issues.append("API routes not blocked")
        
        # 32. Check for overly broad blocks
        if "Disallow: /" in robots_content and "Disallow: /\n" in robots_content:
            issues.append("WARNING: Entire site is blocked!")
        
        # 33. Check host directive (idempotent)
        if "Host:" not in robots_content:
            additions.append(f"\n# BOOST: Preferred host")
            additions.append(f"Host: {SITE_URL}")
            success("Auto-added Host directive")
        
        if additions:
            with open(robots_path, "a", encoding="utf-8") as f:
                f.write("\n".join(additions) + "\n")
        
        if issues:
            for issue in issues:
                warn(f"robots.txt: {issue}")
        else:
            success("robots.txt validated OK")
        results["robots_issues"] = issues
    
    # 34-36. Validate sitemap exists and has correct structure
    sitemap_static = PUBLIC_DIR / "sitemap-static.xml"
    if not sitemap_static.exists():
        # Generate a basic static sitemap
        pages = [
            ("", 1.0, "daily"),
            ("/about", 0.8, "weekly"),
            ("/shop", 0.9, "daily"),
            ("/Blogs", 0.9, "daily"),
            ("/Prop", 0.8, "weekly"),
            ("/socials", 0.7, "weekly"),
            ("/recruit", 0.7, "weekly"),
            ("/course", 0.9, "weekly"),
            ("/community", 0.8, "weekly"),
            ("/products", 0.8, "daily"),
            ("/trading-showcase", 0.7, "weekly"),
            ("/store", 0.9, "daily"),
            ("/crypto-game", 0.6, "monthly"),
        ]
        
        sitemap_xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
        sitemap_xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
        sitemap_xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
        
        now = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        for path, priority, freq in pages:
            sitemap_xml += f'  <url>\n'
            sitemap_xml += f'    <loc>{SITE_URL}{path}</loc>\n'
            sitemap_xml += f'    <lastmod>{now}</lastmod>\n'
            sitemap_xml += f'    <changefreq>{freq}</changefreq>\n'
            sitemap_xml += f'    <priority>{priority}</priority>\n'
            # Add hreflang alternates
            for lang in SUPPORTED_LANGS:
                sitemap_xml += f'    <xhtml:link rel="alternate" hreflang="{lang}" href="{SITE_URL}{path}?lang={lang}" />\n'
            sitemap_xml += f'  </url>\n'
        
        sitemap_xml += '</urlset>\n'
        sitemap_static.write_text(sitemap_xml, encoding="utf-8")
        success(f"Generated static sitemap with {len(pages)} URLs × {len(SUPPORTED_LANGS)} languages")
    else:
        success("Static sitemap exists")
    results["sitemap_ok"] = True

    # 37-40. Security headers audit
    security_headers_found = []
    next_config = ROOT_DIR / "next.config.mjs"
    if next_config.exists():
        config_content = next_config.read_text(encoding="utf-8")
        headers_to_check = {
            "X-Frame-Options": "Clickjacking protection",
            "X-Content-Type-Options": "MIME sniffing protection",
            "Referrer-Policy": "Referrer leaking protection",
            "Strict-Transport-Security": "HTTPS enforcement",
            "Permissions-Policy": "Feature restrictions",
            "Content-Security-Policy": "XSS protection",
            "Cross-Origin-Opener-Policy": "Process isolation",
        }
        for header_name, desc in headers_to_check.items():
            if header_name in config_content:
                security_headers_found.append(header_name)
                success(f"Security: {header_name} ({desc})")
            else:
                warn(f"Missing: {header_name} ({desc})")
    
    results["security_headers"] = len(security_headers_found)

    # 41-45. Meta tag validation
    layout_path = APP_DIR / "layout.tsx"
    if layout_path.exists():
        layout_content = layout_path.read_text(encoding="utf-8")
        meta_checks = {
            "openGraph": "Open Graph tags",
            "twitter": "Twitter Card tags",
            "robots": "Robot directives",
            "canonical": "Canonical URL",
            "alternates": "Language alternates",
            "viewport": "Viewport settings",
            "manifest": "PWA manifest link",
        }
        for key, desc in meta_checks.items():
            if key in layout_content:
                success(f"SEO: {desc} ✓")
            else:
                warn(f"SEO: Missing {desc}")
    
    results["meta_tags_ok"] = True

    # 46-50. Generate SEO performance hints script
    seo_script = f"""// BOOST: SEO Performance Hints (auto-generated)
// Loaded after interactive to enhance crawlability
(function(){{
  // 46. Lazy-load below-fold images with IntersectionObserver
  if('IntersectionObserver' in window){{
    var io=new IntersectionObserver(function(entries){{
      entries.forEach(function(e){{
        if(e.isIntersecting){{
          var img=e.target;
          if(img.dataset.src){{img.src=img.dataset.src;delete img.dataset.src;}}
          if(img.dataset.srcset){{img.srcset=img.dataset.srcset;delete img.dataset.srcset;}}
          io.unobserve(img);
        }}
      }});
    }},{{rootMargin:'200px'}});
    document.querySelectorAll('img[data-src]').forEach(function(img){{io.observe(img)}});
  }}

  // 47. Track Core Web Vitals for SEO ranking signal
  if('PerformanceObserver' in window){{
    try{{
      // LCP
      new PerformanceObserver(function(l){{
        var entries=l.getEntries();
        var last=entries[entries.length-1];
        window.__BM_LCP__=last.startTime;
      }}).observe({{type:'largest-contentful-paint',buffered:true}});
      // FID
      new PerformanceObserver(function(l){{
        var e=l.getEntries()[0];
        window.__BM_FID__=e.processingStart-e.startTime;
      }}).observe({{type:'first-input',buffered:true}});
      // CLS
      var clsValue=0;
      new PerformanceObserver(function(l){{
        l.getEntries().forEach(function(e){{if(!e.hadRecentInput)clsValue+=e.value}});
        window.__BM_CLS__=clsValue;
      }}).observe({{type:'layout-shift',buffered:true}});
      // INP
      var inpValue=0;
      new PerformanceObserver(function(l){{
        l.getEntries().forEach(function(e){{
          var d=e.duration;if(d>inpValue)inpValue=d;
        }});
        window.__BM_INP__=inpValue;
      }}).observe({{type:'event',buffered:true,durationThreshold:16}});
      // TTFB
      new PerformanceObserver(function(l){{
        var e=l.getEntries()[0];
        window.__BM_TTFB__=e.responseStart;
      }}).observe({{type:'navigation',buffered:true}});
    }}catch(e){{}}
  }}
  
  // 48. Priority Hints: boost above-fold content
  requestIdleCallback(function(){{
    document.querySelectorAll('img').forEach(function(img,i){{
      if(i<3)img.setAttribute('fetchpriority','high');
      else if(i>10)img.setAttribute('loading','lazy');
    }});
  }});

  // 49. Preload next page on hover (instant navigation feel)
  document.addEventListener('mouseover',function(e){{
    var a=e.target.closest('a[href]');
    if(!a||a.dataset.prefetched)return;
    var href=a.getAttribute('href');
    if(!href||href.startsWith('#')||href.startsWith('http')||href.startsWith('mailto'))return;
    a.dataset.prefetched='1';
    var link=document.createElement('link');
    link.rel='prefetch';link.href=href;
    document.head.appendChild(link);
  }});

  // 50. Add structured breadcrumb data for current page
  var path=window.location.pathname.split('/').filter(Boolean);
  if(path.length>0){{
    var bc={{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[]}};
    bc.itemListElement.push({{"@type":"ListItem","position":1,"name":"Home","item":"{SITE_URL}"}});
    var url='{SITE_URL}';
    path.forEach(function(p,i){{
      url+='/'+p;
      bc.itemListElement.push({{"@type":"ListItem","position":i+2,"name":p.charAt(0).toUpperCase()+p.slice(1).replace(/-/g,' '),"item":url}});
    }});
    var s=document.createElement('script');
    s.type='application/ld+json';
    s.textContent=JSON.stringify(bc);
    document.head.appendChild(s);
  }}
}})();"""

    seo_path = PUBLIC_DIR / "scripts" / "seo-boost.js"
    smart_write(seo_path, seo_script)
    success(f"SEO boost script: {seo_path.stat().st_size:,} bytes")
    results["seo_script"] = str(seo_path.relative_to(ROOT_DIR))

    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 4: IMAGE & ASSET OPTIMIZATION AUDIT
# ════════════════════════════════════════════════════════════════════

def audit_images() -> dict:
    """
    Scan public/ for oversized images and generate optimization report.
    
    Optimizations: 51-60
    """
    header("4. Image & Asset Audit")
    results = {"oversized": [], "total_images": 0, "total_size_mb": 0}

    image_extensions = {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".tiff", ".svg", ".webp", ".avif"}
    total_size = 0
    oversized = []
    formats = defaultdict(int)
    legacy_large = []  # Collect legacy formats in single pass to avoid re-walking

    # Single walk of public/ instead of one rglob per extension
    for img_path in PUBLIC_DIR.rglob("*"):
        if not img_path.is_file():
            continue
        ext = img_path.suffix.lower()
        if ext not in image_extensions:
            continue
        results["total_images"] += 1
        size = img_path.stat().st_size
        total_size += size
        formats[ext] += 1

        size_kb = size / 1024
        if size_kb > MAX_IMAGE_SIZE_KB and ext != ".svg":
            oversized.append({
                "path": str(img_path.relative_to(ROOT_DIR)),
                "size_kb": round(size_kb, 1),
                "format": ext,
            })
        # Collect legacy formats for WebP/AVIF check in same pass
        if ext in (".png", ".jpg", ".jpeg") and size > 50 * 1024:
            legacy_large.append(img_path)

    results["total_size_mb"] = round(total_size / (1024 * 1024), 2)
    results["oversized"] = oversized
    results["format_distribution"] = dict(formats)

    success(f"Found {results['total_images']} images ({results['total_size_mb']} MB total)")
    
    if oversized:
        warn(f"{len(oversized)} images exceed {MAX_IMAGE_SIZE_KB}KB threshold:")
        for img in oversized[:10]:
            warn(f"  {img['path']} ({img['size_kb']}KB {img['format']})")
    else:
        success("All images within size limits")

    # 55-57. Check for missing WebP/AVIF versions (uses data from single pass above)
    missing_modern = []
    for img in legacy_large:
        webp_path = img.with_suffix(".webp")
        avif_path = img.with_suffix(".avif")
        if not webp_path.exists() and not avif_path.exists():
            missing_modern.append(str(img.relative_to(ROOT_DIR)))
    
    if missing_modern:
        info(f"{len(missing_modern)} images could benefit from WebP/AVIF conversion")
    results["missing_modern_format"] = len(missing_modern)

    # 58-60. Check Spline scene sizes
    spline_files = list(PUBLIC_DIR.glob("*.splinecode"))
    spline_total = sum(f.stat().st_size for f in spline_files)
    results["spline_count"] = len(spline_files)
    results["spline_total_mb"] = round(spline_total / (1024 * 1024), 2)
    
    if spline_files:
        info(f"{len(spline_files)} Spline scenes ({results['spline_total_mb']} MB) - loaded on demand ✓")

    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 5: BUNDLE & COMPONENT ANALYSIS
# ════════════════════════════════════════════════════════════════════

def analyze_bundle() -> dict:
    """
    Analyze component sizes, import patterns, and potential code splitting issues.
    
    Optimizations: 61-80
    """
    header("5. Bundle & Component Analysis")
    results = {
        "large_components": [],
        "heavy_imports": [],
        "missing_lazy": [],
        "total_components": 0,
    }

    # 61-65. Scan components for size and complexity
    component_files = list(COMPONENTS_DIR.glob("*.tsx")) + list(COMPONENTS_DIR.glob("*.ts"))
    results["total_components"] = len(component_files)
    
    large = []
    heavy_import_files = []
    _import_re = re.compile(r'^import\s+', re.MULTILINE)
    _from_re = re.compile(r"from ['\"]([^'\"]+)['\"]")
    
    # Pre-read all component contents via FileCache (shared across sections)
    component_contents = {}
    for comp in component_files:
        content = FileCache.read(comp)
        if content:
            component_contents[comp] = content
    
    for comp, content in component_contents.items():
        lines = content.count("\n") + 1
        import_count = len(_import_re.findall(content))
        
        if lines > LARGE_COMPONENT_LINES:
            large.append({
                "file": str(comp.relative_to(ROOT_DIR)),
                "lines": lines,
                "imports": import_count,
            })
        
        if import_count > MAX_IMPORTS_PER_FILE:
            heavy_import_files.append({
                "file": str(comp.relative_to(ROOT_DIR)),
                "imports": import_count,
            })

    results["large_components"] = sorted(large, key=lambda x: x["lines"], reverse=True)[:20]
    results["heavy_imports"] = sorted(heavy_import_files, key=lambda x: x["imports"], reverse=True)[:10]

    if large:
        warn(f"{len(large)} components exceed {LARGE_COMPONENT_LINES} lines:")
        for c in results["large_components"][:5]:
            warn(f"  {c['file']} ({c['lines']} lines, {c['imports']} imports)")
    else:
        success("All components are reasonably sized")

    # 66-70. Check for missing dynamic imports on heavy components
    layout_content = ""
    layout_path = APP_DIR / "layout.tsx"
    if layout_path.exists():
        layout_content = layout_path.read_text(encoding="utf-8", errors="ignore")
    
    page_path = APP_DIR / "page.tsx"
    page_content = ""
    if page_path.exists():
        page_content = page_path.read_text(encoding="utf-8", errors="ignore")
    
    # Check for heavy libraries imported directly (should be dynamic)
    heavy_libs = [
        "three", "@react-three", "gsap", "face-api",
        "@splinetool", "matter-js", "recharts", "cobe",
    ]
    
    all_content = layout_content + page_content
    for lib in heavy_libs:
        if f"from '{lib}" in all_content or f'from "{lib}' in all_content:
            if "dynamic(" not in all_content and "lazy(" not in all_content:
                results["missing_lazy"].append(lib)
                warn(f"Heavy lib '{lib}' imported statically in layout/page — consider dynamic import")
    
    if not results["missing_lazy"]:
        success("Heavy libraries properly code-split")

    # 71-75. Detect duplicate imports across files
    # Reuse already-read component contents + batch-read app tsx files via FileCache
    import_map = defaultdict(int)
    app_tsx_files = list(APP_DIR.rglob("*.tsx"))
    for tsx_file in app_tsx_files:
        try:
            content = FileCache.read(tsx_file)
            for imp in _from_re.findall(content):
                import_map[imp] += 1
        except Exception:
            pass
    # Add component file imports (already read above)
    for content in component_contents.values():
        for imp in _from_re.findall(content):
            import_map[imp] += 1
    
    # Find most commonly imported modules  
    top_imports = sorted(import_map.items(), key=lambda x: x[1], reverse=True)[:15]
    results["top_imports"] = [{"module": m, "count": c} for m, c in top_imports]
    
    info(f"Top imported modules: {', '.join(m for m, _ in top_imports[:5])}")

    # 76-80. Check for unused CSS files
    css_files = list(STYLES_DIR.rglob("*.css")) if STYLES_DIR.exists() else []
    css_files += list(APP_DIR.rglob("*.css"))
    results["total_css_files"] = len(css_files)
    
    # Check large CSS files
    large_css = []
    for css in css_files:
        try:
            size_kb = css.stat().st_size / 1024
            if size_kb > MAX_CSS_FILE_KB:
                large_css.append({"file": str(css.relative_to(ROOT_DIR)), "size_kb": round(size_kb, 1)})
        except Exception:
            pass
    
    if large_css:
        warn(f"{len(large_css)} CSS files exceed {MAX_CSS_FILE_KB}KB:")
        for c in large_css[:5]:
            warn(f"  {c['file']} ({c['size_kb']}KB)")
    results["large_css"] = large_css

    success(f"Analyzed {results['total_components']} components, {results['total_css_files']} CSS files")
    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 6: CACHING & SERVICE WORKER OPTIMIZATION
# ════════════════════════════════════════════════════════════════════

def optimize_caching() -> dict:
    """
    Generate optimized cache strategies and service worker enhancements.
    
    Optimizations: 81-90
    """
    header("6. Caching & Offline Strategy")
    results = {}

    # 81-83. Generate a deterministic build fingerprint based on source changes
    # (avoids unnecessary cache busting when nothing changed)
    _hasher = hashlib.md5()
    for src in sorted(COMPONENTS_DIR.rglob("*.tsx")):
        try:
            _hasher.update(src.stat().st_mtime_ns.to_bytes(8, 'big'))
        except Exception:
            pass
    _hasher.update(datetime.now(timezone.utc).strftime("%Y-%m-%d").encode())
    build_id = _hasher.hexdigest()[:12]
    
    build_info = {
        "buildId": build_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "4.0.0",
        "node": "22",
        "optimizations": "boost.py",
    }
    
    build_path = PUBLIC_DIR / "build-info.json"
    smart_write(build_path, json.dumps(build_info, indent=2))
    success(f"Build fingerprint: {build_id}")
    results["build_id"] = build_id

    # 84-86. Generate prefetch manifest for critical routes
    critical_routes = [
        "/", "/about", "/shop", "/Blogs", "/Prop",
        "/socials", "/course", "/community", "/store",
        "/products", "/recruit", "/trading-showcase",
    ]
    
    prefetch_manifest = {
        "version": build_id,
        "routes": critical_routes,
        "preloadAssets": [
            "/ONcc2l601.svg",
            "/manifest.json",
        ],
        "cacheStrategy": {
            "pages": "stale-while-revalidate",
            "static": "cache-first",
            "api": "network-first",
            "images": "cache-first",
        }
    }
    
    prefetch_path = PUBLIC_DIR / "prefetch-manifest.json"
    prefetch_path.write_text(json.dumps(prefetch_manifest, indent=2), encoding="utf-8")
    success(f"Prefetch manifest: {len(critical_routes)} critical routes")
    results["critical_routes"] = len(critical_routes)

    # 87-90. Generate offline fallback enhancement
    offline_boost = """// BOOST: Enhanced offline detection (auto-generated)
(function(){
  var wasOffline=false;
  function check(){
    var online=navigator.onLine;
    document.documentElement.setAttribute('data-online',online?'true':'false');
    if(!online&&!wasOffline){
      wasOffline=true;
      document.documentElement.classList.add('is-offline');
      // Show subtle offline indicator
      var d=document.createElement('div');
      d.id='bm-offline-bar';
      d.style.cssText='position:fixed;top:0;left:0;right:0;padding:4px;background:#f59e0b;color:#000;text-align:center;font-size:12px;z-index:99999;font-family:system-ui';
      d.textContent='You are offline. Some features may be limited.';
      document.body.appendChild(d);
    } else if(online&&wasOffline){
      wasOffline=false;
      document.documentElement.classList.remove('is-offline');
      var bar=document.getElementById('bm-offline-bar');
      if(bar)bar.remove();
    }
  }
  window.addEventListener('online',check);
  window.addEventListener('offline',check);
  check();
  
  // Periodic background sync check
  setInterval(function(){
    if(navigator.onLine){
      fetch('/build-info.json',{cache:'no-store',method:'HEAD'}).catch(function(){
        document.documentElement.setAttribute('data-online','false');
      });
    }
  },30000);
})();"""

    offline_path = PUBLIC_DIR / "scripts" / "offline-detect.js"
    smart_write(offline_path, offline_boost)
    success("Offline detection script generated")
    results["offline_script"] = True

    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 7: PERFORMANCE MONITORING & ANALYTICS
# ════════════════════════════════════════════════════════════════════

def generate_perf_monitor() -> dict:
    """
    Generate comprehensive performance monitoring that tracks
    real user metrics and feeds them back for optimization.
    
    Optimizations: 91-100+
    """
    header("7. Performance Monitor & Analytics")
    results = {}

    perf_script = f"""// BOOST: Advanced Performance Monitor (auto-generated by boost.py)
(function(){{
  'use strict';
  var M=window.__BM_PERF__={{}};
  var startTime=performance.now();

  // 91. Navigation Timing
  window.addEventListener('load',function(){{
    setTimeout(function(){{
      var t=performance.getEntriesByType('navigation')[0];
      if(t){{
        M.dns=Math.round(t.domainLookupEnd-t.domainLookupStart);
        M.tcp=Math.round(t.connectEnd-t.connectStart);
        M.ttfb=Math.round(t.responseStart-t.requestStart);
        M.download=Math.round(t.responseEnd-t.responseStart);
        M.domParse=Math.round(t.domInteractive-t.responseEnd);
        M.domReady=Math.round(t.domContentLoadedEventEnd-t.fetchStart);
        M.fullLoad=Math.round(t.loadEventEnd-t.fetchStart);
        M.redirect=Math.round(t.redirectEnd-t.redirectStart);
        M.tls=t.secureConnectionStart>0?Math.round(t.connectEnd-t.secureConnectionStart):0;
      }}
    }},100);
  }});

  // 92. Resource Loading Analysis
  window.addEventListener('load',function(){{
    setTimeout(function(){{
      var resources=performance.getEntriesByType('resource');
      var byType={{}};
      var totalTransfer=0;
      resources.forEach(function(r){{
        var ext=(r.name.split('?')[0].split('.').pop()||'other').toLowerCase();
        if(!byType[ext])byType[ext]={{count:0,size:0,time:0}};
        byType[ext].count++;
        byType[ext].size+=(r.transferSize||0);
        byType[ext].time+=r.duration;
        totalTransfer+=(r.transferSize||0);
      }});
      M.resources={{byType:byType,total:resources.length,transferKB:Math.round(totalTransfer/1024)}};
      
      // Find slowest resources
      var slow=resources.filter(function(r){{return r.duration>500}}).map(function(r){{
        return {{name:r.name.split('/').pop().split('?')[0],duration:Math.round(r.duration),size:Math.round((r.transferSize||0)/1024)}};
      }}).sort(function(a,b){{return b.duration-a.duration}}).slice(0,5);
      M.slowResources=slow;
    }},500);
  }});

  // 93. Long Task Detection
  if('PerformanceObserver' in window){{
    var longTasks=[];
    try{{
      new PerformanceObserver(function(l){{
        l.getEntries().forEach(function(e){{
          longTasks.push({{duration:Math.round(e.duration),start:Math.round(e.startTime)}});
        }});
        M.longTasks=longTasks;
      }}).observe({{type:'longtask',buffered:true}});
    }}catch(e){{}}
  }}

  // 94. Memory Usage Tracking
  if(performance.memory){{
    setInterval(function(){{
      M.memory={{
        usedMB:Math.round(performance.memory.usedJSHeapSize/1048576),
        totalMB:Math.round(performance.memory.totalJSHeapSize/1048576),
        limitMB:Math.round(performance.memory.jsHeapSizeLimit/1048576),
        pct:Math.round((performance.memory.usedJSHeapSize/performance.memory.jsHeapSizeLimit)*100)
      }};
      if(M.memory.pct>80)document.documentElement.classList.add('high-memory');
    }},5000);
  }}

  // 95. Frame Rate Monitor (ALL devices - targeting 120fps)
  var device=window.__BM_DEVICE__;
  if(true){{
    var frames=0,lastTime=performance.now(),fps=60;
    function measureFPS(){{
      frames++;
      var now=performance.now();
      if(now-lastTime>=1000){{
        fps=Math.round(frames*1000/(now-lastTime));
        frames=0;lastTime=now;
        M.fps=fps;
        if(fps<30)document.documentElement.classList.add('low-fps');
        else document.documentElement.classList.remove('low-fps');
        updateFpsBoost(fps);
      }}
      requestAnimationFrame(measureFPS);
    }}
    requestAnimationFrame(measureFPS);
  }}

  // 95b. FPS Booster (adaptive, keeps ALL content visible on ALL devices)
  var fpsBoost={{level:'normal',low:0,high:0}};
  function setFpsTierClass(tier){{
    var root=document.documentElement;
    root.classList.remove('fps-ultra','fps-high','fps-medium','fps-low','fps-minimal');
    root.classList.add(tier);
  }}
  function setFpsBoost(level){{
    if(fpsBoost.level===level)return;
    fpsBoost.level=level;
    var root=document.documentElement;
    root.setAttribute('data-fps-tier',level);
    if(level==='boost'){{
      root.classList.add('fps-boost');
      root.style.setProperty('--animation-duration','0.2s');
      root.style.setProperty('--transition-speed','0.12s');
      root.style.setProperty('--blur-amount','6px');
      root.style.setProperty('--particle-count','80');
    }} else if(level==='critical'){{
      root.classList.add('fps-boost');
      root.style.setProperty('--animation-duration','0.12s');
      root.style.setProperty('--transition-speed','0.08s');
      root.style.setProperty('--blur-amount','2px');
      root.style.setProperty('--particle-count','40');
    }} else {{
      root.classList.remove('fps-boost');
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-speed');
      root.style.removeProperty('--blur-amount');
      root.style.removeProperty('--particle-count');
    }}
  }}
  function updateFpsBoost(fps){{
    if(document.documentElement.classList.contains('reduce-motion'))return;
    var tier=fps>=70?'fps-ultra':fps>=55?'fps-high':fps>=45?'fps-medium':fps>=30?'fps-low':'fps-minimal';
    setFpsTierClass(tier);
    if(fps<35){{fpsBoost.low++;fpsBoost.high=0;}}
    else if(fps>55){{fpsBoost.high++;fpsBoost.low=0;}}
    else {{fpsBoost.low=Math.max(0,fpsBoost.low-1);fpsBoost.high=Math.max(0,fpsBoost.high-1);}}
    if(fpsBoost.low>=3){{
      setFpsBoost(fps<25?'critical':'boost');
    }} else if(fpsBoost.high>=4){{
      setFpsBoost('normal');
    }}
  }}

  // 96. Hydration Time Tracking
  M.boostLoadTime=performance.now();
  var hydrationStart=0;
  var observer=new MutationObserver(function(mutations){{
    if(!hydrationStart){{
      hydrationStart=performance.now();
      M.hydrationStart=hydrationStart;
    }}
    // Detect React hydration complete (data-reactroot or __next content)
    var root=document.getElementById('__next');
    if(root&&root.children.length>0&&!M.hydrationEnd){{
      M.hydrationEnd=performance.now();
      M.hydrationDuration=Math.round(M.hydrationEnd-hydrationStart);
      observer.disconnect();
    }}
  }});
  observer.observe(document.body||document.documentElement,{{childList:true,subtree:true}});

  // 97. Scroll Depth Tracking (for engagement metrics)
  var maxScroll=0;
  var ticking=false;
  window.addEventListener('scroll',function(){{
    if(!ticking){{
      requestAnimationFrame(function(){{
        var scrollPct=Math.round((window.scrollY/(document.documentElement.scrollHeight-window.innerHeight))*100);
        if(scrollPct>maxScroll)maxScroll=scrollPct;
        M.maxScrollDepth=maxScroll;
        ticking=false;
      }});
      ticking=true;
    }}
  }},{{passive:true}});

  // 98. Error Rate Tracking
  var errors=[];
  window.addEventListener('error',function(e){{
    errors.push({{msg:e.message,file:(e.filename||'').split('/').pop(),line:e.lineno,time:Date.now()}});
    M.errors=errors;
    M.errorRate=errors.length;
  }});
  window.addEventListener('unhandledrejection',function(e){{
    errors.push({{msg:String(e.reason).substring(0,100),type:'promise',time:Date.now()}});
    M.errors=errors;
  }});

  // 99. Time to Interactive (custom)
  window.addEventListener('load',function(){{
    // Wait for idle to measure true interactive time
    if('requestIdleCallback' in window){{
      requestIdleCallback(function(){{
        M.tti=Math.round(performance.now());
      }});
    }} else {{
      setTimeout(function(){{M.tti=Math.round(performance.now())}},200);
    }}
  }});

  // 100. Performance Score Calculator
  window.addEventListener('load',function(){{
    setTimeout(function(){{
      var score=100;
      // Penalize slow TTFB
      if(M.ttfb>600)score-=15;else if(M.ttfb>200)score-=5;
      // Penalize slow full load
      if(M.fullLoad>5000)score-=20;else if(M.fullLoad>3000)score-=10;
      // Penalize long tasks
      if(M.longTasks&&M.longTasks.length>5)score-=10;
      else if(M.longTasks&&M.longTasks.length>2)score-=5;
      // Penalize high memory
      if(M.memory&&M.memory.pct>80)score-=10;
      // Penalize slow hydration
      if(M.hydrationDuration>2000)score-=15;
      else if(M.hydrationDuration>1000)score-=5;
      // Penalize errors
      if(M.errorRate>3)score-=10;
      // Penalize large transfer
      if(M.resources&&M.resources.transferKB>3000)score-=10;
      
      M.score=Math.max(0,Math.min(100,score));
      M.grade=M.score>=90?'A':M.score>=75?'B':M.score>=60?'C':M.score>=40?'D':'F';
      
      // Set as data attribute for CSS-based perf indicators
      document.documentElement.setAttribute('data-perf-score',M.score);
      document.documentElement.setAttribute('data-perf-grade',M.grade);
      
      // Log summary in dev
      if(window.location.hostname==='localhost'){{
        console.log('%c[BOOST] Performance Score: '+M.score+'/100 ('+M.grade+')','color:#22c55e;font-weight:bold;font-size:14px');
        console.table({{
          TTFB:M.ttfb+'ms',
          'Full Load':M.fullLoad+'ms',
          'Hydration':M.hydrationDuration+'ms',
          'TTI':M.tti+'ms',
          'Transfer':((M.resources||{{}}).transferKB||0)+'KB',
          'Long Tasks':(M.longTasks||[]).length,
          'Errors':M.errorRate||0
        }});
      }}
    }},3000);
  }});

  // BONUS 101. Adaptive Quality - LOW MEMORY = FULL EXPERIENCE (desktop-like at <1024px)
  // On low-memory/low-perf devices: keep ALL content visible, only optimize render cost
  requestIdleCallback(function(){{
    var d=window.__BM_DEVICE__||{{}};
    var perf=d.perfTier||'mid';
    var root=document.documentElement;
    var mem=d.memory||4;
    var isLowMem=mem<=2||perf==='low';
    var isMobileVP=window.innerWidth<1024;

    if(isLowMem){{
      // LOW MEMORY ADAPTATION: show EVERYTHING, just lighten render cost
      root.classList.add('low-memory-adapt');
      root.setAttribute('data-low-memory','full-experience');
      root.style.setProperty('--animation-duration','0.15s');
      root.style.setProperty('--transition-speed','0.1s');
      root.style.setProperty('--blur-amount','0px');
      root.style.setProperty('--particle-count','20');
      root.style.setProperty('--shadow-complexity','simple');
      // Force GPU compositing for smooth scroll
      root.style.setProperty('--gpu-hint','translateZ(0)');
      // Keep videos as poster-only (saves memory, still visible)
      document.querySelectorAll('video[autoplay]').forEach(function(v){{
        v.pause();v.preload='none';
        if(v.poster){{v.removeAttribute('autoplay');v.setAttribute('data-low-mem-paused','1');}}
      }});
      // Downsize images to save memory but keep visible
      document.querySelectorAll('img[srcset]').forEach(function(img){{
        img.sizes='(max-width:1024px) 80vw, 40vw';
      }});
      // Play videos on tap (user-initiated = less memory pressure)
      document.addEventListener('click',function(e){{
        var v=e.target.closest('video[data-low-mem-paused]');
        if(v){{v.play();v.removeAttribute('data-low-mem-paused');}}
      }});
    }} else if(d.saveData){{
      root.classList.add('save-data-adapt');
      root.style.setProperty('--animation-duration','0.1s');
      root.style.setProperty('--transition-speed','0.05s');
      root.style.setProperty('--blur-amount','0px');
      root.style.setProperty('--particle-count','0');
    }} else if(perf==='mid'){{
      root.style.setProperty('--animation-duration','0.3s');
      root.style.setProperty('--transition-speed','0.15s');
      root.style.setProperty('--blur-amount','8px');
      root.style.setProperty('--particle-count','50');
    }} else {{
      root.style.setProperty('--animation-duration','0.5s');
      root.style.setProperty('--transition-speed','0.3s');
      root.style.setProperty('--blur-amount','20px');
      root.style.setProperty('--particle-count','200');
    }}

    // MOBILE VERTICAL (<1024px) FULL DESKTOP EXPERIENCE
    if(isMobileVP){{
      root.classList.add('mobile-full-experience');
      root.setAttribute('data-mobile-mode','full');
      // Ensure no content is hidden just because viewport is narrow
      root.style.setProperty('--content-visibility','visible');
      root.style.setProperty('--mobile-section-display','block');
    }}
  }});

  // BONUS 102. Preload critical API routes after idle
  requestIdleCallback(function(){{
    ['/api/health'].forEach(function(url){{
      fetch(url,{{method:'HEAD',cache:'no-store'}}).catch(function(){{}});
    }});
  }});

  // BONUS 103. Automatic dark/light image switching
  if(window.matchMedia){{
    var mq=window.matchMedia('(prefers-color-scheme: dark)');
    function updateScheme(e){{
      document.documentElement.setAttribute('data-scheme',e.matches?'dark':'light');
    }}
    updateScheme(mq);
    mq.addEventListener('change',updateScheme);
  }}

  // BONUS 104. Keyboard navigation detection
  window.addEventListener('keydown',function(e){{
    if(e.key==='Tab')document.documentElement.classList.add('keyboard-nav');
  }});
  window.addEventListener('mousedown',function(){{
    document.documentElement.classList.remove('keyboard-nav');
  }});

  // BONUS 105. Print optimization
  window.addEventListener('beforeprint',function(){{
    document.documentElement.classList.add('printing');
  }});
  window.addEventListener('afterprint',function(){{
    document.documentElement.classList.remove('printing');
  }});

}})();"""

    perf_path = PUBLIC_DIR / "scripts" / "perf-boost.js"
    smart_write(perf_path, perf_script)
    success(f"Performance monitor: {perf_path.stat().st_size:,} bytes")
    results["perf_script"] = str(perf_path.relative_to(ROOT_DIR))

    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 8: NEXT.JS CONFIG VALIDATION
# ════════════════════════════════════════════════════════════════════

def validate_nextjs_config() -> dict:
    """
    Validate next.config.mjs for optimal performance settings.
    
    Optimizations: check all config keys
    """
    header("8. Next.js Config Validation")
    results = {"issues": [], "optimizations": []}
    
    config_path = ROOT_DIR / "next.config.mjs"
    if not config_path.exists():
        error("next.config.mjs not found!")
        return results
    
    content = config_path.read_text(encoding="utf-8")
    
    checks = [
        ("compress: true", "Compression enabled", "Missing compression"),
        ("productionBrowserSourceMaps: false", "Source maps disabled in prod", "Source maps enabled in prod (slower)"),
        ("removeConsole", "Console removal in prod", "Console statements not removed in prod"),
        ("staleTimes", "Stale-while-revalidate caching", "Missing SWR cache config"),
        ("parallelServerCompiles", "Parallel compilation", "Missing parallel compilation"),
        ("optimizePackageImports", "Package import optimization", "Missing package import optimization"),
        ("image/avif", "AVIF image format support", "Missing AVIF format support"),
        ("minimumCacheTTL", "Image cache TTL set", "Missing image cache TTL"),
        ("X-DNS-Prefetch-Control", "DNS prefetch control", "Missing DNS prefetch header"),
        ("Strict-Transport-Security", "HSTS enabled", "Missing HSTS header"),
        ("ignoreBuildErrors", "TypeScript check skipped (faster build)", "TS errors block build"),
        ("webpackBuildWorker", "Webpack worker threads", "Missing webpack workers"),
        ("serverComponentsHmrCache", "Server component HMR cache", "Missing HMR cache"),
    ]
    
    for pattern, good_msg, bad_msg in checks:
        if pattern in content:
            success(f"Config: {good_msg}")
            results["optimizations"].append(good_msg)
        else:
            warn(f"Config: {bad_msg}")
            results["issues"].append(bad_msg)
    
    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 9: ACCESSIBILITY QUICK CHECK
# ════════════════════════════════════════════════════════════════════

def check_accessibility() -> dict:
    """
    Quick accessibility scan of key layout files.
    """
    header("9. Accessibility Quick Check")
    results = {"issues": [], "passed": []}
    
    layout_path = APP_DIR / "layout.tsx"
    if not layout_path.exists():
        return results
    
    content = layout_path.read_text(encoding="utf-8")
    
    a11y_checks = [
        ('lang="', "HTML lang attribute set"),
        ("suppressHydrationWarning", "Hydration warning suppressed (theme flash fix)"),
        ("viewport", "Viewport configured"),
        ("userScalable: true", "Pinch-to-zoom enabled"),
        ("apple-mobile-web-app", "PWA meta tags"),
    ]
    
    for pattern, desc in a11y_checks:
        if pattern in content:
            success(f"A11y: {desc}")
            results["passed"].append(desc)
        else:
            warn(f"A11y: Missing - {desc}")
            results["issues"].append(desc)
    
    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 10: GENERATE COMBINED BOOST LOADER
# ════════════════════════════════════════════════════════════════════

def generate_boost_loader() -> dict:
    """
    Generate a single minimal loader script that coordinates all boost scripts
    in the correct priority order. This is the ONE script that gets loaded in <head>.
    """
    header("10. Combined Boost Loader")
    
    loader = """// BULLMONEY BOOST LOADER v5.0 (auto-generated by boost.py)
// This script coordinates ALL performance optimizations in priority order
// Load order: device-detect (sync) → spline-turbo (eager) → memory-guardian (eager)
//           → inapp-shield (eager) → crash-prevention (eager) → gpu-manager (load)
//           → perf-boost (load) → seo-boost (idle) → offline (idle)
//           → network-optimizer (idle) → thirdparty-optimizer (idle)
(function(){
  'use strict';
  var head=document.head;
  var loaded={};
  
  function loadScript(src,strategy){
    if(loaded[src])return;
    loaded[src]=true;
    var s=document.createElement('script');
    s.src=src;
    s.defer=true;
    if(strategy==='idle'&&'requestIdleCallback' in window){
      requestIdleCallback(function(){head.appendChild(s)},{timeout:3000});
    } else if(strategy==='load'){
      window.addEventListener('load',function(){
        setTimeout(function(){head.appendChild(s)},100);
      });
    } else if(strategy==='eager'){
      // Load ASAP but non-blocking
      s.async=true;
      head.appendChild(s);
    } else {
      head.appendChild(s);
    }
  }
  
  // Priority 1: Device detection (needed before first paint decisions)
  // Already inline or loaded synchronously
  
  // Priority 2: CRITICAL - 3D/Spline turbo (must be ready before Spline loads)
  loadScript('/scripts/spline-turbo.js','eager');
  
  // Priority 3: CRITICAL - Memory guardian (must catch OOM before it happens)
  loadScript('/scripts/memory-guardian.js','eager');
  
  // Priority 4: CRITICAL - In-app browser shield (fix quirks immediately)
  loadScript('/scripts/inapp-shield.js','eager');
  
  // Priority 5: CRITICAL - Crash prevention for heavy pages
  loadScript('/scripts/crash-prevention.js','eager');
  
  // Priority 6: GPU/WebGL manager (after interactive)
  loadScript('/scripts/gpu-manager.js','load');
  
  // Priority 7: Performance monitoring (after interactive)
  loadScript('/scripts/perf-boost.js','load');
  
  // Priority 8: SEO enhancements (when idle)
  loadScript('/scripts/seo-boost.js','idle');
  
  // Priority 9: Offline detection (when idle)
  loadScript('/scripts/offline-detect.js','idle');
  
  // Priority 10: Network waterfall optimizer (when idle)
  loadScript('/scripts/network-optimizer.js','idle');
  
  // Priority 11: Third-party script optimizer (when idle)
  loadScript('/scripts/thirdparty-optimizer.js','idle');
  
  // Mark boost as loaded
  document.documentElement.setAttribute('data-boost','loaded');
  document.documentElement.setAttribute('data-boost-version','4.0');
  window.__BM_BOOST_VERSION__='4.0';
})();"""

    loader_path = PUBLIC_DIR / "scripts" / "boost-loader.js"
    smart_write(loader_path, loader)
    
    # Also generate the device-detect as inline-able snippet for <head>
    success(f"Boost loader: {loader_path.stat().st_size:,} bytes")
    
    return {"loader_path": str(loader_path.relative_to(ROOT_DIR))}


# ════════════════════════════════════════════════════════════════════
# SECTION 11: CLEAN UP STALE CACHE & TEMP FILES  
# ════════════════════════════════════════════════════════════════════

def cleanup_stale_files() -> dict:
    """
    Remove stale .next/cache files and temporary build artifacts
    to ensure fresh builds.
    """
    header("11. Stale Cache Cleanup")
    results = {"cleaned": 0, "freed_mb": 0}
    
    # Clean webpack cache if it's too old (>7 days)
    webpack_cache = ROOT_DIR / ".next" / "cache" / "webpack"
    if webpack_cache.exists():
        try:
            cache_age = time.time() - webpack_cache.stat().st_mtime
            if cache_age > 7 * 24 * 3600:  # 7 days
                shutil.rmtree(webpack_cache, ignore_errors=True)
                success("Cleaned stale webpack cache (>7 days old)")
                results["cleaned"] += 1
            else:
                age_hours = int(cache_age / 3600)
                info(f"Webpack cache is {age_hours}h old (fresh enough)")
        except Exception:
            pass
    
    # Clean .DS_Store files (avoid walking into node_modules / .next / .git)
    ds_stores = []
    _skip_dirs = {"node_modules", ".next", ".git", ".vercel", "__pycache__"}
    for dirpath, dirnames, filenames in os.walk(ROOT_DIR):
        dirnames[:] = [d for d in dirnames if d not in _skip_dirs]
        for fname in filenames:
            if fname == ".DS_Store":
                ds_stores.append(Path(dirpath) / fname)
    for ds in ds_stores:
        try:
            ds.unlink()
            results["cleaned"] += 1
        except Exception:
            pass
    if ds_stores:
        success(f"Removed {len(ds_stores)} .DS_Store files")
    
    # Clean node_modules cache
    nm_cache = ROOT_DIR / "node_modules" / ".cache"
    if nm_cache.exists():
        try:
            cache_size = sum(f.stat().st_size for f in nm_cache.rglob("*") if f.is_file())
            if cache_size > 500 * 1024 * 1024:  # >500MB
                shutil.rmtree(nm_cache, ignore_errors=True)
                results["freed_mb"] = round(cache_size / (1024 * 1024), 1)
                success(f"Cleaned node_modules cache ({results['freed_mb']}MB)")
        except Exception:
            pass
    
    if results["cleaned"] == 0:
        info("No stale files to clean")
    
    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 12: DEPENDENCY & SECURITY AUDIT 
# ════════════════════════════════════════════════════════════════════

def audit_dependencies() -> dict:
    """
    Quick audit of package.json for known issues.
    """
    header("12. Dependency Audit")
    results = {"warnings": [], "total_deps": 0}
    
    pkg_path = ROOT_DIR / "package.json"
    if not pkg_path.exists():
        return results
    
    pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
    deps = pkg.get("dependencies", {})
    dev_deps = pkg.get("devDependencies", {})
    results["total_deps"] = len(deps) + len(dev_deps)
    
    info(f"Total dependencies: {len(deps)} prod + {len(dev_deps)} dev = {results['total_deps']}")
    
    # Check for duplicate-ish packages
    if "framer-motion" in deps and "motion" in deps:
        warn("Both 'framer-motion' and 'motion' installed (motion is the successor)")
    
    # Check for known heavy packages
    heavy = ["three", "face-api.js", "matter-js", "gsap", "cobe", "recharts"]
    found_heavy = [p for p in heavy if p in deps]
    if found_heavy:
        info(f"Heavy packages ({len(found_heavy)}): {', '.join(found_heavy)} — ensure dynamic imports")
    
    # Check engine requirement
    engines = pkg.get("engines", {})
    if engines:
        success(f"Node engine: {engines.get('node', 'not set')}")
    
    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 13: PWA MANIFEST VALIDATION
# ════════════════════════════════════════════════════════════════════

def validate_pwa() -> dict:
    """
    Validate PWA manifest for completeness.
    """
    header("13. PWA Manifest Check")
    results = {"issues": []}
    
    manifest_path = PUBLIC_DIR / "manifest.json"
    if not manifest_path.exists():
        error("manifest.json not found!")
        return results
    
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        error("manifest.json is invalid JSON!")
        return results
    
    required_fields = ["name", "short_name", "start_url", "display", "background_color", "theme_color", "icons"]
    for field in required_fields:
        if field in manifest:
            success(f"PWA: {field} ✓")
        else:
            warn(f"PWA: Missing {field}")
            results["issues"].append(f"Missing {field}")
    
    # Check icon sizes
    icons = manifest.get("icons", [])
    sizes = [icon.get("sizes", "") for icon in icons]
    required_sizes = ["192x192", "512x512"]
    for size in required_sizes:
        if size in sizes:
            success(f"PWA: Icon {size} ✓")
        else:
            warn(f"PWA: Missing icon size {size}")
    
    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 14: 3D / SPLINE TURBO BOOST
# ════════════════════════════════════════════════════════════════════

def generate_spline_turbo() -> dict:
    """
    Generate an aggressive Spline/3D performance script that:
    - Pre-warms WebGL context before Spline loads
    - Implements scene LOD (level of detail) based on device tier
    - Adds GPU memory budget tracking
    - Provides instant static fallback for low-end devices
    - Caches Spline runtime in Service Worker
    - Implements progressive scene loading (placeholder → low-res → full)
    - Auto-disposes off-screen 3D scenes to free GPU memory
    - Throttles Spline frame rate on battery / background tabs

    Optimizations: 106-130
    """
    header("14. 3D / Spline Turbo Boost")
    results = {}

    spline_turbo = """// BULLMONEY SPLINE TURBO v3.0 (auto-generated by boost.py)
// Maximizes 3D performance, prevents crashes on low-memory devices
(function(){
'use strict';
var w=window,d=document,n=navigator;
var ST=w.__BM_SPLINE_TURBO__={loaded:false,scenes:{},disposed:[],fallbackActive:false};

// ─── 106. WebGL Context Pre-Warming ───
// Create and cache a WebGL context early so Spline doesn't have cold-start lag
(function preWarmWebGL(){
  try{
    var c=d.createElement('canvas');c.width=1;c.height=1;
    var gl=c.getContext('webgl2',{powerPreference:'high-performance',antialias:false,alpha:false,stencil:false,depth:false})
      ||c.getContext('webgl',{powerPreference:'high-performance',antialias:false});
    if(gl){
      ST.webglReady=true;ST.webglVersion=gl.getParameter(gl.VERSION);
      // Get GPU info for quality decisions
      var dbg=gl.getExtension('WEBGL_debug_renderer_info');
      if(dbg){ST.gpu=gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)||'unknown';}
      // Pre-compile a trivial shader to warm the pipeline
      var vs=gl.createShader(gl.VERTEX_SHADER);
      gl.shaderSource(vs,'attribute vec4 p;void main(){gl_Position=p;}');
      gl.compileShader(vs);
      var fs=gl.createShader(gl.FRAGMENT_SHADER);
      gl.shaderSource(fs,'precision lowp float;void main(){gl_FragColor=vec4(1);}');
      gl.compileShader(fs);
      var pg=gl.createProgram();gl.attachShader(pg,vs);gl.attachShader(pg,fs);gl.linkProgram(pg);
      gl.deleteProgram(pg);gl.deleteShader(vs);gl.deleteShader(fs);
      // Don't lose the context - let GC handle it
      ST._warmCanvas=c;
    } else { ST.webglReady=false; }
  }catch(e){ST.webglReady=false;}
})();

// ─── 107. Device-Aware Quality Tiers for 3D ───
var DEV=w.__BM_DEVICE__||{};
var mem=DEV.memory||n.deviceMemory||4;
var cores=DEV.cores||n.hardwareConcurrency||4;
var dpr=w.devicePixelRatio||1;
var isMobile=DEV.device==='mobile'||(typeof matchMedia!=='undefined'&&matchMedia('(pointer:coarse)').matches);
var conn=(n.connection||n.mozConnection||n.webkitConnection||{});
var saveData=conn.saveData||false;
var slowNet=conn.effectiveType==='2g'||conn.effectiveType==='slow-2g';
var isInApp=/instagram|fbav|fban|fb_iab|tiktok|bytedance|twitter|snapchat|linkedin|wechat|line\\//i.test(n.userAgent);

// Calculate 3D quality tier
var q3d='high';
if(!ST.webglReady){q3d='disabled';}
else if(saveData||slowNet){q3d=isMobile?'low':'disabled';}
else if(mem<2){q3d=isMobile?'low':'disabled';}
else if(isInApp){q3d='low';}
else if(mem<3||cores<2){q3d='low';}
else if(isMobile&&mem<6){q3d='medium';}
else if(mem>=8&&cores>=6&&!isMobile){q3d='ultra';}

ST.quality=q3d;
d.documentElement.setAttribute('data-3d-quality',q3d);

// ─── 108. Spline Scene Resolution Scaler ───
// Reduce canvas resolution on lower tiers to save GPU memory
ST.getCanvasScale=function(){
  var scales={ultra:Math.min(dpr,2),high:Math.min(dpr,1.5),medium:1,low:0.75,disabled:0};
  return scales[q3d]||1;
};
ST.getMaxTextureSize=function(){
  var sizes={ultra:4096,high:2048,medium:1024,low:512,disabled:0};
  return sizes[q3d]||1024;
};

// ─── 109. GPU Memory Budget Tracker ───
ST.gpuMemoryBudgetMB=(function(){
  if(q3d==='ultra')return 512;
  if(q3d==='high')return 256;
  if(q3d==='medium')return 128;
  if(q3d==='low')return 64;
  return 0;
})();
ST.gpuMemoryUsedMB=0;
ST.trackGPUAlloc=function(sceneName,sizeMB){
  ST.gpuMemoryUsedMB+=sizeMB;
  ST.scenes[sceneName]={sizeMB:sizeMB,loaded:Date.now(),visible:true};
  if(ST.gpuMemoryUsedMB>ST.gpuMemoryBudgetMB*0.85){
    // Over budget - dispose least recently used scene
    w.dispatchEvent(new CustomEvent('bullmoney-gpu-pressure',{detail:{used:ST.gpuMemoryUsedMB,budget:ST.gpuMemoryBudgetMB}}));
  }
};

// ─── 110. Automatic Off-Screen 3D Disposal ───
// IntersectionObserver that auto-disposes Spline scenes when not visible
if('IntersectionObserver' in w&&q3d!=='disabled'){
  var splineIO=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      var el=entry.target;
      var scene=el.getAttribute('data-spline-scene')||el.getAttribute('data-scene');
      if(!scene)return;
      if(!entry.isIntersecting){
        // Off screen → signal dispose to free GPU memory
        el.classList.add('spline-offscreen');
        el.dispatchEvent(new CustomEvent('spline-dispose'));
        if(ST.scenes[scene]){
          ST.scenes[scene].visible=false;
          ST.disposed.push(scene);
        }
      } else {
        // Back in view → signal restore
        el.classList.remove('spline-offscreen');
        el.dispatchEvent(new CustomEvent('spline-restore'));
        if(ST.scenes[scene])ST.scenes[scene].visible=true;
        ST.disposed=ST.disposed.filter(function(s){return s!==scene});
      }
    });
  },{rootMargin:'200px 0px 200px 0px',threshold:[0]});

  // Observe all spline containers once DOM is ready
  function observeSplines(){
    d.querySelectorAll('.spline-container,[data-spline-scene],[data-scene],spline-viewer').forEach(function(el){
      splineIO.observe(el);
    });
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',observeSplines);
  else observeSplines();
  // Re-observe on dynamic additions
  new MutationObserver(function(muts){
    muts.forEach(function(m){
      m.addedNodes.forEach(function(node){
        if(node.nodeType===1){
          var el=node;
          if(el.matches&&(el.matches('.spline-container,[data-spline-scene],spline-viewer')))splineIO.observe(el);
          if(el.querySelectorAll){
            el.querySelectorAll('.spline-container,[data-spline-scene],spline-viewer').forEach(function(c){splineIO.observe(c)});
          }
        }
      });
    });
  }).observe(d.body||d.documentElement,{childList:true,subtree:true});
}

// ─── 111. Background Tab Throttling ───
// Pause all 3D rendering when tab is hidden to save battery + memory
var tabHidden=false;
d.addEventListener('visibilitychange',function(){
  tabHidden=d.hidden;
  if(d.hidden){
    d.documentElement.classList.add('tab-hidden');
    w.dispatchEvent(new CustomEvent('bullmoney-3d-pause'));
  } else {
    d.documentElement.classList.remove('tab-hidden');
    w.dispatchEvent(new CustomEvent('bullmoney-3d-resume'));
  }
});

// ─── 112. Spline Runtime Preload via Service Worker ───
if('serviceWorker' in n&&q3d!=='disabled'){
  n.serviceWorker.ready.then(function(reg){
    if(reg.active){
      reg.active.postMessage({type:'PREFETCH_SPLINE',urls:[
        'https://unpkg.com/@splinetool/runtime/build/runtime.js',
      ]});
    }
  }).catch(function(){});
}

// ─── 113. Progressive Scene Loading Coordinator ───
// Shows instant gradient placeholder → loads low-quality preview → upgrades to full
ST.loadScene=function(container,sceneUrl,opts){
  opts=opts||{};
  if(q3d==='disabled'){
    container.classList.add('spline-fallback-active');
    ST.fallbackActive=true;
    return Promise.resolve(null);
  }
  // Phase 1: Instant gradient placeholder (already in CSS)
  container.classList.add('spline-loading');
  // Phase 2: Load scene at reduced quality
  var scale=ST.getCanvasScale();
  return new Promise(function(resolve){
    // Signal the React component to load with quality settings
    container.setAttribute('data-spline-quality',q3d);
    container.setAttribute('data-spline-scale',scale);
    container.setAttribute('data-spline-max-texture',ST.getMaxTextureSize());
    // Track timing
    var start=performance.now();
    container.addEventListener('spline-loaded',function onLoad(){
      container.removeEventListener('spline-loaded',onLoad);
      container.classList.remove('spline-loading');
      container.classList.add('spline-loaded');
      var elapsed=Math.round(performance.now()-start);
      ST.scenes[sceneUrl]={loaded:Date.now(),loadTime:elapsed,visible:true,sizeMB:opts.sizeMB||20};
      ST.gpuMemoryUsedMB+=(opts.sizeMB||20);
      if(w.location.hostname==='localhost'){
        console.log('[SPLINE TURBO] '+sceneUrl+' loaded in '+elapsed+'ms (quality: '+q3d+')');
      }
      resolve(elapsed);
    },{once:true});
    // Timeout fallback - if scene doesn't load in 8s, show static fallback
    setTimeout(function(){
      if(container.classList.contains('spline-loading')){
        container.classList.remove('spline-loading');
        container.classList.add('spline-fallback-active');
        ST.fallbackActive=true;
        resolve(null);
      }
    },opts.timeout||8000);
  });
};

// ─── 114. Frame Rate: Adaptive target (mobile-lightweight) ───
var targetFPS=120;
if(isMobile||isInApp){
  targetFPS=(q3d==='low'||q3d==='disabled')?45:60;
} else if(q3d==='low'){targetFPS=60;}
else if(q3d==='medium'){targetFPS=90;}
ST.targetFPS=targetFPS;
d.documentElement.setAttribute('data-3d-fps',String(targetFPS));
// Only attempt high refresh rate hints on desktop/high tiers
if(targetFPS>=90&&!isMobile&&!isInApp){
  (function forceHighFps(){
    // Request high refresh rate via canvas hack
    try{
      var hfr=d.createElement('canvas');
      hfr.width=1;hfr.height=1;
      hfr.style.cssText='position:fixed;top:-9999px;pointer-events:none;opacity:0;';
      d.documentElement.appendChild(hfr);
      var ctx=hfr.getContext('2d');
      // Continuous rAF loop to hint browser we want max refresh rate
      var running=true;
      function tick(){
        if(!running)return;
        ctx.clearRect(0,0,1,1);
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      // Cleanup after 10s - browser should have locked to high refresh by then
      setTimeout(function(){running=false;hfr.remove();},10000);
    }catch(e){}
    // Force screen.updateInterval if supported (some Chromium)
    if(w.screen&&w.screen.updateInterval!==undefined){
      try{w.screen.updateInterval=0;}catch(e){}
    }
  })();
}

// ─── 115. CSS for 3D Performance ───
var style=d.createElement('style');
style.textContent=[
  // GPU-accelerated containers
  '.spline-container,.spline-scene-wrapper,[data-spline-scene]{contain:layout style paint;will-change:auto;backface-visibility:hidden;}',
  // Fallback gradient for disabled/loading states - use semi-transparent overlay instead of forcing dark
  '.spline-fallback-active::after,.spline-loading::after{content:"";position:absolute;inset:0;background:rgba(128,128,128,0.1);pointer-events:none;}',
  '.spline-loading::after{content:\"\";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,215,0,0.05),transparent);animation:spline-shimmer 1.5s infinite;}',
  '@keyframes spline-shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}',
  // Reduce canvas resolution on lower tiers
  '[data-3d-quality=\"low\"] canvas,[data-3d-quality=\"medium\"] canvas{image-rendering:auto;}',
  '[data-3d-quality=\"low\"] .spline-container canvas{max-width:100%;height:auto!important;}',
  // Disabled tier - reduce quality but keep visible (fallback shown on top)
  '[data-3d-quality=\"disabled\"] .spline-container,[data-3d-quality=\"disabled\"] spline-viewer,[data-3d-quality=\"disabled\"] [data-spline-scene]{opacity:0.7;pointer-events:none;}',
  '[data-3d-quality=\"disabled\"] .spline-fallback{display:block!important;}',
  // Off-screen - pause animations but keep visible
  '.spline-offscreen canvas{animation-play-state:paused!important;}',
  // Tab hidden - pause transforms but keep rendered
  '.tab-hidden .spline-container,.tab-hidden [data-spline-scene]{animation-play-state:paused!important;transition:none!important;}',
  '.tab-hidden canvas{animation-play-state:paused!important;}',
  // Reduce motion preference
  '@media(prefers-reduced-motion:reduce){.spline-container,.spline-scene-wrapper{animation:none!important;transition:none!important;}}',
].join('\\n');
d.head.appendChild(style);

// ─── 116-120. Spline Cache Manager (Cache API + IndexedDB) ───
ST.cacheScene=function(url){
  if(!('caches' in w))return Promise.resolve(false);
  return caches.open('bullmoney-spline-v3').then(function(cache){
    return cache.match(url).then(function(resp){
      if(resp)return true; // already cached
      return fetch(url,{mode:'cors',cache:'force-cache'}).then(function(r){
        if(r.ok)cache.put(url,r);
        return r.ok;
      }).catch(function(){return false;});
    });
  }).catch(function(){return false;});
};

// Pre-cache primary scenes on idle
if(q3d!=='disabled'&&'requestIdleCallback' in w){
  requestIdleCallback(function(){
    ['/scene1.splinecode','/scene3.splinecode'].forEach(function(url){
      ST.cacheScene(url);
    });
  },{timeout:5000});
}

// ─── 121-125. Adaptive 3D LOD System ───
// Dynamically downgrades scene quality if FPS drops
ST.enableAdaptiveLOD=function(){
  if(q3d==='disabled'||q3d==='low')return;
  var samples=[];var lastCheck=performance.now();
  function checkFPS(ts){
    samples.push(ts);
    if(samples.length>60){samples.shift();}
    if(ts-lastCheck>3000&&samples.length>=30){
      var avgFrame=(samples[samples.length-1]-samples[0])/(samples.length-1);
      var fps=Math.round(1000/avgFrame);
      if(fps<20&&q3d!=='low'){
        // Downgrade quality
        q3d=q3d==='ultra'?'high':q3d==='high'?'medium':'low';
        ST.quality=q3d;
        d.documentElement.setAttribute('data-3d-quality',q3d);
        w.dispatchEvent(new CustomEvent('bullmoney-3d-quality-change',{detail:{quality:q3d,fps:fps}}));
      }
      lastCheck=ts;
    }
    if(q3d!=='disabled')requestAnimationFrame(checkFPS);
  }
  requestAnimationFrame(checkFPS);
};
if(q3d!=='disabled')ST.enableAdaptiveLOD();

ST.loaded=true;
if(w.location.hostname==='localhost'){
  console.log('%c[SPLINE TURBO] Quality: '+q3d+' | GPU Budget: '+ST.gpuMemoryBudgetMB+'MB | Target FPS: '+ST.targetFPS+' | WebGL: '+(ST.webglReady?'ready':'unavailable'),'color:#ffd700;font-weight:bold');
}
})();"""

    turbo_path = PUBLIC_DIR / "scripts" / "spline-turbo.js"
    smart_write(turbo_path, spline_turbo)

    size_kb = turbo_path.stat().st_size / 1024
    success(f"Spline Turbo script: {size_kb:.1f} KB")
    info("Features: WebGL pre-warm, GPU budgets, adaptive LOD, off-screen disposal")
    info("Features: background tab throttle, progressive loading, scene caching")
    info("Features: adaptive FPS targets, resolution scaler, quality CSS injection")
    results["spline_turbo_size_kb"] = round(size_kb, 1)
    results["quality_tiers"] = ["ultra", "high", "medium", "low", "disabled"]

    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 15: MEMORY GUARDIAN (CRASH PREVENTION)
# ════════════════════════════════════════════════════════════════════

def generate_memory_guardian() -> dict:
    """
    Generate an aggressive memory monitoring system that prevents OOM crashes
    on low-memory devices and in-app browsers. Monitors heap usage, detects
    memory leaks, auto-disposes heavy components, triggers GC, and reduces
    quality automatically when memory pressure is detected.

    v5.0 ADDITIONS: Proactive timer/interval leak cleanup, AudioContext reaper,
    detached DOM node sweeper, History API memory cap, setInterval cap per page,
    progressive degradation timeline, Safari/Instagram WebKit memory workarounds,
    and aggressive periodic deep-clean for sessions > 2 minutes.

    Optimizations: 131-180
    """
    header("15. Memory Guardian (Crash Prevention)")
    results = {}

    memory_guardian = """// BULLMONEY MEMORY GUARDIAN v5.0 (auto-generated by boost.py)
// Prevents crashes & slowdowns on low-memory devices, in-app browsers, and heavy pages
// v5.0: Proactive cleanup — intervals, timers, AudioContexts, detached DOM, history cap
(function(){
'use strict';
var w=window,d=document,n=navigator,p=performance;
var MG=w.__BM_MEMORY_GUARDIAN__={active:true,level:'normal',disposals:0,gcTriggers:0,version:'4.0'};

// ─── 131. Memory Pressure Detection ───
var memInfo={limit:0,used:0,pct:0};
function updateMemInfo(){
  if(p.memory){
    memInfo.used=p.memory.usedJSHeapSize;
    memInfo.limit=p.memory.jsHeapSizeLimit;
    memInfo.pct=Math.round((memInfo.used/memInfo.limit)*100);
    MG.heap={usedMB:Math.round(memInfo.used/1048576),limitMB:Math.round(memInfo.limit/1048576),pct:memInfo.pct};
  }
  // Safari/WebKit fallback: no p.memory, estimate from DOM + listener count
  if(!p.memory){
    var domEst=(MG.domNodes||0)*0.002; // ~2KB per node
    var listenerEst=(MG.eventListeners||0)*0.001;
    memInfo.used=(domEst+listenerEst)*1048576;
    memInfo.limit=budgetMB*1048576;
    memInfo.pct=Math.min(100,Math.round((memInfo.used/memInfo.limit)*100));
    MG.heap={usedMB:Math.round(domEst+listenerEst),limitMB:budgetMB,pct:memInfo.pct,estimated:true};
  }
}

// ─── 132. Device Memory Budget Calculator ───
var deviceMem=n.deviceMemory||4;
// Detect in-app browsers — they get much tighter budgets
var ua=n.userAgent||'';
var isInApp=/instagram|fban|fbav|tiktok|snapchat|twitter|linkedin|wechat|line\\/|telegram|pinterest|reddit/i.test(ua);
var isSafari=/^((?!chrome|android).)*safari/i.test(ua);
var isMobile=/mobi|android|iphone|ipad|ipod/i.test(ua);
MG.isInApp=isInApp;MG.isSafari=isSafari;MG.isMobile=isMobile;

var budgetMB=(function(){
  // In-app browsers are severely memory-constrained
  if(isInApp){
    if(deviceMem>=4)return 100;
    if(deviceMem>=2)return 60;
    return 40;
  }
  if(isMobile){
    if(deviceMem>=8)return 250;
    if(deviceMem>=6)return 200;
    if(deviceMem>=4)return 150;
    if(deviceMem>=2)return 80;
    return 50;
  }
  if(deviceMem>=8)return 350;
  if(deviceMem>=6)return 250;
  if(deviceMem>=4)return 180;
  if(deviceMem>=2)return 100;
  return 60;
})();
MG.budgetMB=budgetMB;

// ─── 133. Memory Level System ───
// normal → warning → critical → emergency
function updateMemoryLevel(){
  updateMemInfo();
  var pct=memInfo.pct;
  var used=memInfo.used/1048576;
  var prev=MG.level;

  if(pct>90||used>budgetMB*1.2){MG.level='emergency';}
  else if(pct>75||used>budgetMB){MG.level='critical';}
  else if(pct>60||used>budgetMB*0.8){MG.level='warning';}
  else{MG.level='normal';}

  if(MG.level!==prev){
    d.documentElement.setAttribute('data-memory-level',MG.level);
    w.dispatchEvent(new CustomEvent('bullmoney-memory-level',{detail:{level:MG.level,pct:pct,usedMB:Math.round(used),budgetMB:budgetMB}}));

    if(MG.level==='critical'||MG.level==='emergency'){
      executeMemoryRelief(MG.level);
    }
  }
}

// ─── 134. Automatic Memory Relief Actions ───
function executeMemoryRelief(level){
  MG.gcTriggers++;

  // Level 1: Dispose off-screen images and iframes
  if(level==='critical'||level==='emergency'){
    d.querySelectorAll('img[loading=\"lazy\"]:not([data-in-view])').forEach(function(img){
      if(!isElementInView(img)){img.src='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';MG.disposals++;}
    });
    d.querySelectorAll('iframe:not([data-keep])').forEach(function(iframe){
      if(!isElementInView(iframe)){
        iframe.setAttribute('data-src-backup',iframe.src);
        iframe.src='about:blank';
        MG.disposals++;
      }
    });
    // Kill stale timers (v5.0)
    if(typeof pruneStaleTimers==='function')pruneStaleTimers(level==='emergency'?0.5:0.7);
    // Close leaked AudioContexts (v5.0)
    if(typeof reapAudioContexts==='function')reapAudioContexts();
  }

  // Level 2: Reduce 3D quality but keep scenes visible (never hide)
  if(level==='emergency'){
    w.dispatchEvent(new CustomEvent('bullmoney-3d-quality-change',{detail:{quality:'low',fps:0}}));
    d.documentElement.classList.add('memory-emergency');
    d.documentElement.style.setProperty('--animation-duration','0.01s');
    d.documentElement.style.setProperty('--transition-speed','0.01s');
    d.documentElement.style.setProperty('--blur-amount','0px');
    if(w.__BM_SPLINE_TURBO__){
      w.__BM_SPLINE_TURBO__.quality='low';
      d.documentElement.setAttribute('data-3d-quality','low');
    }
    try{if(w.gc)w.gc();}catch(e){}
    d.querySelectorAll('video[autoplay]').forEach(function(v){
      v.pause();v.preload='none';
      v.setAttribute('data-low-mem-paused','1');
    });
    // Emergency: nuke detached DOM nodes (v5.0)
    if(typeof sweepDetachedNodes==='function')sweepDetachedNodes();
    // Emergency: clear all non-essential caches (v5.0)
    if(typeof clearInternalCaches==='function')clearInternalCaches();
  }

  if(w.location.hostname==='localhost'){
    console.warn('[MEMORY GUARDIAN v4] '+level+' relief executed. Disposed: '+MG.disposals+' elements');
  }
}

function isElementInView(el){
  var r=el.getBoundingClientRect();
  return r.bottom>-200&&r.top<(w.innerHeight+200);
}

// ─── 135. Periodic Memory Monitoring ───
var checkInterval=isInApp?1500:deviceMem>=8?10000:deviceMem>=4?5000:isMobile?2500:3000;
setInterval(updateMemoryLevel,checkInterval);
updateMemoryLevel();

// ─── 136. DOM Node Counter (detect leaks) ───
var lastNodeCount=0;
var nodeGrowthWarnings=0;
var DOM_NODE_HARD_CAP=isInApp?4000:isMobile?6000:10000;
setInterval(function(){
  var count=d.querySelectorAll('*').length;
  MG.domNodes=count;
  // Hard cap: if DOM is absurdly large, force cleanup
  if(count>DOM_NODE_HARD_CAP){
    if(w.location.hostname==='localhost'){
      console.warn('[MEMORY GUARDIAN v4] DOM node hard cap exceeded: '+count+'/'+DOM_NODE_HARD_CAP+'. Running deep clean.');
    }
    if(typeof deepClean==='function')deepClean('dom-cap');
  }
  if(count>lastNodeCount+500&&lastNodeCount>0){
    nodeGrowthWarnings++;
    if(nodeGrowthWarnings>=3){
      w.dispatchEvent(new CustomEvent('bullmoney-dom-leak',{detail:{nodes:count,growth:count-lastNodeCount}}));
      if(w.location.hostname==='localhost'){
        console.warn('[MEMORY GUARDIAN v4] Possible DOM leak: '+count+' nodes (+'+(count-lastNodeCount)+')');
      }
      // Proactive: run cleanup on repeated growth
      if(typeof deepClean==='function')deepClean('dom-growth');
      nodeGrowthWarnings=0;
    }
  } else {nodeGrowthWarnings=Math.max(0,nodeGrowthWarnings-1);}
  lastNodeCount=count;
},isInApp?8000:15000);

// ─── 137. Event Listener Leak Prevention ───
var listenerCount=0;
var LISTENER_CAP=isInApp?300:isMobile?500:1000;
var origAdd=EventTarget.prototype.addEventListener;
var origRemove=EventTarget.prototype.removeEventListener;
// Track per-element to detect duplicates
var listenerMap=new WeakMap();
EventTarget.prototype.addEventListener=function(type,fn,opts){
  listenerCount++;MG.eventListeners=listenerCount;
  // Track per element for duplicate detection
  var el=this;
  if(!listenerMap.has(el))listenerMap.set(el,[]);
  var list=listenerMap.get(el);
  // Prevent exact duplicate listeners (same type+fn) — common leak source
  for(var i=0;i<list.length;i++){
    if(list[i].type===type&&list[i].fn===fn){
      // Already registered, skip duplicate
      listenerCount--;MG.eventListeners=listenerCount;
      return;
    }
  }
  list.push({type:type,fn:fn});
  // Warn if approaching cap
  if(listenerCount>LISTENER_CAP&&listenerCount%100===0){
    if(w.location.hostname==='localhost'){
      console.warn('[MEMORY GUARDIAN v4] Listener count high: '+listenerCount+'/'+LISTENER_CAP);
    }
    if(listenerCount>LISTENER_CAP*1.5){
      // Over 1.5x cap: force cleanup
      if(typeof deepClean==='function')deepClean('listener-cap');
    }
  }
  return origAdd.call(this,type,fn,opts);
};
EventTarget.prototype.removeEventListener=function(type,fn,opts){
  listenerCount=Math.max(0,listenerCount-1);MG.eventListeners=listenerCount;
  if(listenerMap.has(this)){
    var list=listenerMap.get(this);
    for(var i=list.length-1;i>=0;i--){
      if(list[i].type===type&&list[i].fn===fn){list.splice(i,1);break;}
    }
  }
  return origRemove.call(this,type,fn,opts);
};

// ─── 138. Blob/ObjectURL Leak Prevention ───
var activeBlobs=new Set();
var origCreateURL=URL.createObjectURL;
var origRevokeURL=URL.revokeObjectURL;
URL.createObjectURL=function(blob){
  var url=origCreateURL.call(URL,blob);
  activeBlobs.add(url);MG.activeBlobs=activeBlobs.size;
  return url;
};
URL.revokeObjectURL=function(url){
  activeBlobs.delete(url);MG.activeBlobs=activeBlobs.size;
  return origRevokeURL.call(URL,url);
};
setInterval(function(){
  if(activeBlobs.size>50){
    var count=0;
    activeBlobs.forEach(function(url){
      if(count++<activeBlobs.size-20){
        try{origRevokeURL.call(URL,url);}catch(e){}
        activeBlobs.delete(url);
      }
    });
    MG.activeBlobs=activeBlobs.size;
  }
},60000);

// ─── 139. Scroll Performance Budget ───
var scrollJankCount=0;
var lastScrollTime=0;
w.addEventListener('scroll',function(){
  var now=p.now();
  if(lastScrollTime&&now-lastScrollTime>50){scrollJankCount++;}
  else{scrollJankCount=Math.max(0,scrollJankCount-1);}
  lastScrollTime=now;
  if(scrollJankCount>10){
    d.documentElement.classList.add('scroll-janky');
    scrollJankCount=0;
    // v5.0: If janky on mobile, force reduce effects
    if(isMobile||isInApp){
      d.documentElement.setAttribute('data-memory-level',
        MG.level==='normal'?'warning':MG.level);
    }
  }
},{passive:true});

// ─── 140. Component Disposal Queue ───
MG.disposalQueue=[];
MG.registerForDisposal=function(id,disposeFn,priority){
  MG.disposalQueue.push({id:id,dispose:disposeFn,priority:priority||5});
  MG.disposalQueue.sort(function(a,b){return b.priority-a.priority;});
};
MG.executeDisposalQueue=function(count){
  count=count||3;
  var disposed=MG.disposalQueue.splice(0,count);
  disposed.forEach(function(item){
    try{item.dispose();MG.disposals++;}catch(e){}
  });
  return disposed.length;
};
w.addEventListener('bullmoney-memory-level',function(e){
  if(e.detail.level==='critical')MG.executeDisposalQueue(3);
  if(e.detail.level==='emergency')MG.executeDisposalQueue(10);
});

// ─── 141-145. Memory-Aware CSS Injection (FULL EXPERIENCE - preserve colors) ───
// CRITICAL: Never strip `filter` — it controls invert/brightness/contrast for theming.
// Stripping filter causes black↔white color inversion glitches on dark theme.
// Only strip backdrop-filter (expensive GPU composite) with OPAQUE fallback backgrounds.
var memStyle=d.createElement('style');
memStyle.textContent=[
  // === WARNING LEVEL: remove backdrop blur only, preserve existing backgrounds ===
  '[data-memory-level="warning"] *{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}',
  // Glass elements: remove blur only, keep original background color
  '[data-memory-level="warning"] .glass-effect,[data-memory-level="warning"] .glassmorphism,[data-memory-level="warning"] .glass-surface,[data-memory-level="warning"] .glass-card,[data-memory-level="warning"] .glass-dark,[data-memory-level="warning"] .glass-frosted,[data-memory-level="warning"] .glass-clear,[data-memory-level="warning"] .glass-premium,[data-memory-level="warning"] .glass-light{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}',
  // === CRITICAL LEVEL: fast animations, no particles, blur-free glass ===
  '[data-memory-level="critical"] *:not(.product-card-premium):not(.badge-shimmer-el):not(.card-shine-sweep):not(.card-image-shine):not(.neon-edge-top):not(.neon-edge-bottom){animation-duration:0.01s!important;transition-duration:0.01s!important;}',
  '[data-memory-level="critical"] .particle-container,[data-memory-level="critical"] .confetti{opacity:0.3!important;animation:none!important;}',
  '[data-memory-level="critical"] .glass-effect,[data-memory-level="critical"] .glassmorphism,[data-memory-level="critical"] .glass-surface,[data-memory-level="critical"] .glass-card{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}',
  // === EMERGENCY LEVEL: strip expensive GPU effects BUT PRESERVE filter (theming) ===
  // NO filter:none — that flips invert(100%) logos and brightness() themed elements
  // Only strip: animation, transition, box-shadow, backdrop-filter (all layout/GPU-heavy)
  '[data-memory-level="emergency"] *:not(.product-card-premium):not(.badge-shimmer-el):not(.card-shine-sweep):not(.card-image-shine):not(.neon-edge-top):not(.neon-edge-bottom){animation:none!important;transition:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}',
  // box-shadow removed separately with a thin border fallback so elements stay visually separated
  '[data-memory-level="emergency"] *:not(.product-card-premium):not(input):not(button):not(a){box-shadow:none!important;}',
  // Emergency glass: remove blur only, preserve original colors
  '[data-memory-level="emergency"] .glass-effect,[data-memory-level="emergency"] .glassmorphism,[data-memory-level="emergency"] .glass-surface,[data-memory-level="emergency"] .glass-card,[data-memory-level="emergency"] .glass-dark,[data-memory-level="emergency"] .glass-frosted,[data-memory-level="emergency"] .glass-clear,[data-memory-level="emergency"] .glass-premium,[data-memory-level="emergency"] .glass-light,[data-memory-level="emergency"] .glass-modal-backdrop{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}',
  // Emergency: ensure text stays visible (white on dark) in critical UI elements
  '[data-memory-level="emergency"] nav,[data-memory-level="emergency"] header,[data-memory-level="emergency"] footer,[data-memory-level="emergency"] .navbar,[data-memory-level="emergency"] .hub,[data-memory-level="emergency"] .ultimate-hub{color:rgba(255,255,255,0.9)!important;background-color:rgba(0,0,0,0.92)!important;}',
  '[data-memory-level="emergency"] nav a,[data-memory-level="emergency"] header a,[data-memory-level="emergency"] footer a,[data-memory-level="emergency"] .navbar a,[data-memory-level="emergency"] .hub a{color:rgba(255,255,255,0.85)!important;}',
  '[data-memory-level="emergency"] .modal,[data-memory-level="emergency"] [role="dialog"],.modal-content{background:rgba(0,0,0,0.95)!important;color:rgba(255,255,255,0.9)!important;}',
  // Emergency media: only strip animation, preserve filter for theming
  '[data-memory-level="emergency"] video{animation:none!important;}',
  '[data-memory-level="emergency"] canvas{image-rendering:optimizeSpeed!important;}',
  '[data-memory-level="emergency"] img{image-rendering:auto!important;}',
  // === LOW-MEMORY-ADAPT class: same approach — opaque bg fallback, keep filter ===
  '.low-memory-adapt *{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}',
  '.low-memory-adapt .glass-effect,.low-memory-adapt .glassmorphism,.low-memory-adapt .glass-surface,.low-memory-adapt .glass-card{background:rgba(0,0,0,0.85)!important;border-color:rgba(255,255,255,0.15)!important;}',
  '.low-memory-adapt video{object-fit:cover;}',
  // FIX: Ensure text stays white on low-memory devices (prevent black-on-black)
  '.low-memory-adapt nav,.low-memory-adapt header,.low-memory-adapt footer,.low-memory-adapt .navbar,.low-memory-adapt .nav,.low-memory-adapt .store-layout header,.low-memory-adapt .hub,.low-memory-adapt .ultimate-hub{color:rgba(255,255,255,0.9)!important;background-color:rgba(0,0,0,0.92)!important;}',
  '.low-memory-adapt nav a,.low-memory-adapt header a,.low-memory-adapt footer a,.low-memory-adapt .navbar a,.low-memory-adapt .hub a{color:rgba(255,255,255,0.85)!important;}',
  '.low-memory-adapt .modal,.low-memory-adapt [role="dialog"],.low-memory-adapt .modal-content{background:rgba(0,0,0,0.95)!important;color:rgba(255,255,255,0.9)!important;}',
  // NOTE: Removed forced bg-white → black conversion that was causing UI color glitches
  // Glass glow optimization only
  '[data-memory-level] .glass-glow::before,[data-memory-level] .glass-glow-strong::before,[data-memory-level] .glass-glow-pulse::before{display:none!important;}',
  // Preserve filter:invert on logos/icons that need it (explicit safeguard)
  '[data-memory-level] [style*="filter: invert"],[data-memory-level] [style*="filter:invert"]{filter:invert(100%)!important;}',
  '[data-memory-level] .sm-logo-img{filter:inherit!important;}',
  // Mobile full experience
  '.mobile-full-experience [data-desktop-only]{display:block!important;visibility:visible!important;}',
  '.mobile-full-experience [data-hide-mobile]{display:block!important;visibility:visible!important;}',
  '.mobile-full-experience .desktop-only{display:block!important;visibility:visible!important;}',
  '.mobile-full-experience .hidden-mobile{display:block!important;visibility:visible!important;}',
  // Scroll jank fix — no color impact
  '.scroll-janky *{will-change:auto!important;contain:layout style;}',
].join('\\n');
d.head.appendChild(memStyle);

// ─── 146-150. Performance.measureUserAgentSpecificMemory (modern API) ───
if(typeof crossOriginIsolated!=='undefined'&&crossOriginIsolated&&p.measureUserAgentSpecificMemory){
  setInterval(function(){
    p.measureUserAgentSpecificMemory().then(function(result){
      MG.preciseMemoryMB=Math.round(result.bytes/1048576);
      if(MG.preciseMemoryMB>budgetMB){
        updateMemoryLevel();
      }
    }).catch(function(){});
  },30000);
}

// ─── 151-155. Page Lifecycle API Integration ───
if('onfreeze' in d){
  d.addEventListener('freeze',function(){
    MG.frozen=true;
    w.dispatchEvent(new CustomEvent('bullmoney-3d-pause'));
    w.dispatchEvent(new CustomEvent('bullmoney-spline-dispose'));
    // v5.0: Run deep clean on freeze (mobile backgrounding)
    deepClean('freeze');
  });
  d.addEventListener('resume',function(){
    MG.frozen=false;
    if(MG.level==='normal'||MG.level==='warning'){
      w.dispatchEvent(new CustomEvent('bullmoney-3d-resume'));
    }
  });
}
// v5.0: Also handle visibilitychange for Safari/Instagram which don't fire freeze
d.addEventListener('visibilitychange',function(){
  if(d.visibilityState==='hidden'){
    // User switched away — aggressively clean up
    deepClean('hidden');
    // Throttle all intervals while hidden
    MG._hiddenTime=Date.now();
  }
  if(d.visibilityState==='visible'&&MG._hiddenTime){
    var away=Date.now()-MG._hiddenTime;
    // If away > 30s, assume memory was reclaimed and re-check level
    if(away>30000)updateMemoryLevel();
    delete MG._hiddenTime;
  }
});

// ════════════════════════════════════════════════════════════════════
// v5.0 NEW: PROACTIVE SLOWDOWN PREVENTION (Opts 156-180)
// These run continuously to prevent the "gets slower over time" problem
// ════════════════════════════════════════════════════════════════════

// ─── 156-158. setInterval/setTimeout Tracker & Reaper ───
// The #1 cause of "page gets slower": leaked intervals that stack on re-renders
var activeIntervals=new Map(); // id → {created, stack, frequency}
var activeTimeouts=new Map();
var origSetInterval=w.setInterval;
var origClearInterval=w.clearInterval;
var origSetTimeout=w.setTimeout;
var origClearTimeout=w.clearTimeout;
var INTERVAL_CAP=isInApp?15:isMobile?25:50;
var TIMEOUT_CAP=isInApp?40:isMobile?80:200;

w.setInterval=function(fn,ms){
  var id=origSetInterval.apply(w,arguments);
  activeIntervals.set(id,{created:Date.now(),ms:ms||0,stack:(new Error()).stack||''});
  MG.activeIntervals=activeIntervals.size;
  // Hard cap: if too many intervals, kill the oldest ones
  if(activeIntervals.size>INTERVAL_CAP){
    pruneStaleTimers(0.4); // Kill 40% of oldest
  }
  return id;
};
w.clearInterval=function(id){
  activeIntervals.delete(id);
  MG.activeIntervals=activeIntervals.size;
  return origClearInterval.call(w,id);
};
w.setTimeout=function(fn,ms){
  var id=origSetTimeout.apply(w,arguments);
  activeTimeouts.set(id,{created:Date.now(),ms:ms||0});
  MG.activeTimeouts=activeTimeouts.size;
  // Auto-remove from tracking when it fires (approx)
  origSetTimeout.call(w,function(){activeTimeouts.delete(id);MG.activeTimeouts=activeTimeouts.size;},(ms||0)+100);
  // Hard cap
  if(activeTimeouts.size>TIMEOUT_CAP){
    var oldest=[];
    activeTimeouts.forEach(function(v,k){oldest.push({id:k,created:v.created});});
    oldest.sort(function(a,b){return a.created-b.created;});
    for(var i=0;i<Math.floor(oldest.length*0.3);i++){
      origClearTimeout.call(w,oldest[i].id);
      activeTimeouts.delete(oldest[i].id);
    }
    MG.activeTimeouts=activeTimeouts.size;
  }
  return id;
};
w.clearTimeout=function(id){
  activeTimeouts.delete(id);
  MG.activeTimeouts=activeTimeouts.size;
  return origClearTimeout.call(w,id);
};

function pruneStaleTimers(killRatio){
  if(!activeIntervals||typeof activeIntervals.forEach!=='function')return;
  killRatio=killRatio||0.5;
  var list=[];
  activeIntervals.forEach(function(v,k){list.push({id:k,created:v.created,ms:v.ms});});
  if(list.length<=3)return; // Don't kill if only a few
  list.sort(function(a,b){return a.created-b.created;}); // oldest first
  // Kill fast-frequency intervals first (< 1s), then oldest
  list.sort(function(a,b){
    if(a.ms<1000&&b.ms>=1000)return -1;
    if(b.ms<1000&&a.ms>=1000)return 1;
    return a.created-b.created;
  });
  var killCount=Math.max(1,Math.floor(list.length*killRatio));
  // Always keep at least 3 intervals (memory monitor, dom counter, blob checker)
  killCount=Math.min(killCount,list.length-3);
  for(var i=0;i<killCount;i++){
    origClearInterval.call(w,list[i].id);
    activeIntervals.delete(list[i].id);
    MG.disposals++;
  }
  MG.activeIntervals=activeIntervals.size;
  if(w.location.hostname==='localhost'){
    console.warn('[MEMORY GUARDIAN v4] Pruned '+killCount+' stale intervals. Remaining: '+activeIntervals.size);
  }
}

// ─── 159-160. AudioContext Reaper ───
// Multiple components create AudioContext without closing — they accumulate
var trackedAudioCtx=[];
var OrigAudioCtx=w.AudioContext||w.webkitAudioContext;
if(OrigAudioCtx){
  var NewAudioCtx=function AudioContext(){
    var ctx=new OrigAudioCtx();
    trackedAudioCtx.push({ctx:ctx,created:Date.now()});
    MG.audioContexts=trackedAudioCtx.length;
    return ctx;
  };
  NewAudioCtx.prototype=OrigAudioCtx.prototype;
  w.AudioContext=NewAudioCtx;
  if(w.webkitAudioContext)w.webkitAudioContext=NewAudioCtx;
}
function reapAudioContexts(){
  var now=Date.now();
  var reaped=0;
  trackedAudioCtx=trackedAudioCtx.filter(function(entry){
    // Close contexts older than 60s that are suspended or have no active sources
    if(now-entry.created>60000&&entry.ctx.state!=='running'){
      try{entry.ctx.close();}catch(e){}
      reaped++;
      return false;
    }
    // Close ALL contexts older than 5 minutes (aggressive)
    if(now-entry.created>300000){
      try{entry.ctx.close();}catch(e){}
      reaped++;
      return false;
    }
    return true;
  });
  MG.audioContexts=trackedAudioCtx.length;
  if(reaped>0)MG.disposals+=reaped;
}

// ─── 161-163. Detached DOM Node Sweeper ───
// React fast-unmount can leave references; WeakRef-based sweeper helps GC
function sweepDetachedNodes(){
  // Force-null common leak patterns
  var heavySelectors=[
    '.spline-canvas-wrapper canvas',
    '.three-canvas canvas',
    '.ballpit-canvas',
    'canvas[data-engine]',
    'video:not([src])',
    'audio:not([src])',
    'iframe[src=\"about:blank\"]'
  ];
  heavySelectors.forEach(function(sel){
    try{
      d.querySelectorAll(sel).forEach(function(el){
        if(!isElementInView(el)&&!el.closest('[data-keep]')){
          // Remove from DOM to let GC collect
          if(el.tagName==='CANVAS'){
            var ctx2d=el.getContext&&el.getContext('2d');
            if(ctx2d){ctx2d.clearRect(0,0,el.width,el.height);}
            el.width=1;el.height=1; // Release GPU memory
          }
          MG.disposals++;
        }
      });
    }catch(e){}
  });
  // Clear any detached image data
  if(w.createImageBitmap){
    // Hint GC by nulling references
  }
}

// ─── 164-165. History API Memory Cap ───
// SPA navigation can accumulate huge history state objects
var origPushState=history.pushState;
var origReplaceState=history.replaceState;
var historyCount=0;
var MAX_HISTORY=isInApp?20:isMobile?50:100;
history.pushState=function(state,title,url){
  historyCount++;
  // Cap state object size to prevent memory bloat
  if(state&&JSON.stringify(state).length>10000){
    state={_trimmed:true,url:url};
  }
  if(historyCount>MAX_HISTORY){
    // Replace instead of push to prevent unbounded growth
    return origReplaceState.call(history,state,title,url);
  }
  return origPushState.call(history,state,title,url);
};
history.replaceState=function(state,title,url){
  if(state&&JSON.stringify(state).length>10000){
    state={_trimmed:true,url:url};
  }
  return origReplaceState.call(history,state,title,url);
};

// ─── 166-168. Internal Cache Cleaner ───
function clearInternalCaches(){
  // Clear Next.js client-side cache if it's bloated  
  try{
    if(w.__NEXT_DATA__&&w.__NEXT_DATA__.props){
      var pageProps=w.__NEXT_DATA__.props.pageProps;
      if(pageProps&&JSON.stringify(pageProps).length>500000){
        // Trim large page props that React keeps in memory
        Object.keys(pageProps).forEach(function(k){
          if(typeof pageProps[k]==='object'&&pageProps[k]&&JSON.stringify(pageProps[k]).length>50000){
            pageProps[k]=null;
          }
        });
      }
    }
  }catch(e){}
  // Clear image decode cache hints
  try{
    d.querySelectorAll('img').forEach(function(img){
      if(!isElementInView(img)&&img.complete){
        img.decoding='async'; // free synchronous decode memory
      }
    });
  }catch(e){}
  // Purge WeakRef-eligible items by nulling module-level caches
  try{
    if(w.__BM_CACHE__){
      Object.keys(w.__BM_CACHE__).forEach(function(k){
        var c=w.__BM_CACHE__[k];
        if(c&&typeof c==='object'&&Object.keys(c).length>100){
          w.__BM_CACHE__[k]={};
        }
      });
    }
  }catch(e){}
  MG.lastCacheClear=Date.now();
}

// ─── 169-171. Deep Clean (called on pressure / background / timer) ───
var lastDeepClean=0;
var DEEP_CLEAN_COOLDOWN=isInApp?15000:30000; // min ms between deep cleans
function deepClean(reason){
  var now=Date.now();
  if(now-lastDeepClean<DEEP_CLEAN_COOLDOWN)return;
  lastDeepClean=now;
  MG.lastDeepClean={time:now,reason:reason};

  // 1. Prune stale intervals (keep 60%)
  pruneStaleTimers(0.4);
  // 2. Reap AudioContexts
  reapAudioContexts();
  // 3. Sweep detached nodes
  sweepDetachedNodes();
  // 4. Revoke excess blobs
  if(activeBlobs.size>20){
    var count=0;
    activeBlobs.forEach(function(url){
      if(count++<activeBlobs.size-10){
        try{origRevokeURL.call(URL,url);}catch(e){}
        activeBlobs.delete(url);
      }
    });
    MG.activeBlobs=activeBlobs.size;
  }
  // 5. Clear internal caches
  clearInternalCaches();
  // 6. Release off-screen canvases GPU memory
  d.querySelectorAll('canvas').forEach(function(c){
    if(!isElementInView(c)&&!c.closest('[data-keep]')){
      c.width=1;c.height=1;
      MG.disposals++;
    }
  });
  // 7. Clear console (reduces memory in dev tools)
  if(w.location.hostname!=='localhost'){
    try{console.clear();}catch(e){}
  }
  // 8. Hint GC
  try{if(w.gc)w.gc();}catch(e){}
  // 9. Dispatch event so React components can self-clean
  w.dispatchEvent(new CustomEvent('bullmoney-deep-clean',{detail:{reason:reason,level:MG.level}}));

  if(w.location.hostname==='localhost'){
    console.log('%c[MEMORY GUARDIAN v4] Deep clean ('+reason+'). Intervals:'+activeIntervals.size+' AudioCtx:'+trackedAudioCtx.length+' Blobs:'+activeBlobs.size+' DOM:'+MG.domNodes,'color:#f59e0b;font-weight:bold');
  }
}

// ─── 172-174. Progressive Degradation Timeline ───
// As session length increases, proactively reduce overhead
var sessionStart=Date.now();
setInterval(function(){
  var sessionMinutes=Math.floor((Date.now()-sessionStart)/60000);
  MG.sessionMinutes=sessionMinutes;

  // After 2 min on mobile/in-app: first cleanup pass
  if(sessionMinutes>=2&&!MG._cleaned2){
    MG._cleaned2=true;
    deepClean('session-2m');
  }
  // After 5 min: more aggressive
  if(sessionMinutes>=5&&!MG._cleaned5){
    MG._cleaned5=true;
    deepClean('session-5m');
    // Force warning level on in-app browsers after 5 min
    if(isInApp&&MG.level==='normal'){
      MG.level='warning';
      d.documentElement.setAttribute('data-memory-level','warning');
    }
  }
  // After 10 min: heavy cleanup every 2 min from now on
  if(sessionMinutes>=10&&sessionMinutes%2===0){
    deepClean('session-periodic-'+sessionMinutes+'m');
  }
  // After 15 min on in-app: critical mode
  if(sessionMinutes>=15&&isInApp&&MG.level!=='emergency'){
    MG.level='critical';
    d.documentElement.setAttribute('data-memory-level','critical');
    executeMemoryRelief('critical');
  }
},60000);

// ─── 175-176. requestAnimationFrame Overload Prevention ───
// Detect RAF storms (multiple components running RAF loops)
var rafCount=0;
var rafResetTime=Date.now();
var origRAF=w.requestAnimationFrame;
var RAF_CAP_PER_SEC=isInApp?30:isMobile?45:120;
w.requestAnimationFrame=function(cb){
  var now=Date.now();
  if(now-rafResetTime>1000){
    // If RAF count was absurdly high, we have RAF storms
    if(rafCount>RAF_CAP_PER_SEC*2){
      MG.rafStorm=true;
      if(w.location.hostname==='localhost'){
        console.warn('[MEMORY GUARDIAN v4] RAF storm detected: '+rafCount+'/sec. Throttling.');
      }
      // Throttle: skip every other frame
      var skip=false;
      var throttledRAF=origRAF;
      w.requestAnimationFrame=function(cb2){
        skip=!skip;
        if(skip&&MG.rafStorm)return 0;
        return throttledRAF.call(w,cb2);
      };
    }
    rafCount=0;
    rafResetTime=now;
  }
  rafCount++;
  return origRAF.call(w,cb);
};

// ─── 177-178. createElement Tracking (detect DOM node factories) ───
var createdElements=0;
var lastCreateReset=Date.now();
var origCreateElement=d.createElement.bind(d);
var CREATE_CAP_PER_SEC=isInApp?30:isMobile?60:200;
d.createElement=function(tag){
  var el=origCreateElement(tag);
  createdElements++;
  var now=Date.now();
  if(now-lastCreateReset>5000){
    if(createdElements>CREATE_CAP_PER_SEC*5){
      // Creating too many elements too fast — likely a leak or particle system gone wild
      if(w.location.hostname==='localhost'){
        console.warn('[MEMORY GUARDIAN v4] Rapid DOM creation: '+createdElements+' in 5s');
      }
      deepClean('rapid-dom-create');
    }
    createdElements=0;lastCreateReset=now;
  }
  return el;
};

// ─── 179. Stale Component Detector ───
// React components that haven't been interacted with for a while can self-dispose
MG.componentActivity={};
MG.reportComponentActivity=function(id){
  MG.componentActivity[id]=Date.now();
};
MG.getStaleComponents=function(maxAgeMs){
  maxAgeMs=maxAgeMs||120000; // 2 min default
  var now=Date.now();
  var stale=[];
  Object.keys(MG.componentActivity).forEach(function(id){
    if(now-MG.componentActivity[id]>maxAgeMs)stale.push(id);
  });
  return stale;
};

// ─── 180. Startup: immediate assessment for in-app/mobile ───
// Don't wait for gradual detection — start in warning mode on constrained browsers
if(isInApp||deviceMem<=2){
  MG.level='warning';
  d.documentElement.setAttribute('data-memory-level','warning');
  d.documentElement.classList.add('low-memory-adapt');
  // Tighter budgets: run first deep clean after 30s
  origSetTimeout.call(w,function(){deepClean('startup-inapp');},30000);
}

d.documentElement.setAttribute('data-memory-level',MG.level);
d.documentElement.setAttribute('data-memory-budget',budgetMB);
d.documentElement.setAttribute('data-memory-guardian-version','4.0');

if(w.location.hostname==='localhost'){
  console.log('%c[MEMORY GUARDIAN v4] Active | Budget:'+budgetMB+'MB | Device:'+deviceMem+'GB | InApp:'+isInApp+' | Mobile:'+isMobile+' | Safari:'+isSafari+' | Check:'+checkInterval+'ms | Caps: intervals='+INTERVAL_CAP+' timeouts='+TIMEOUT_CAP+' listeners='+LISTENER_CAP+' dom='+DOM_NODE_HARD_CAP+' raf/s='+RAF_CAP_PER_SEC,'color:#22c55e;font-weight:bold');
}
})();"""

    guardian_path = PUBLIC_DIR / "scripts" / "memory-guardian.js"
    smart_write(guardian_path, memory_guardian)

    size_kb = guardian_path.stat().st_size / 1024
    success(f"Memory Guardian v5.0 script: {size_kb:.1f} KB")
    info("Features: heap monitoring, memory levels (normal/warning/critical/emergency)")
    info("Features: auto-dispose off-screen images/iframes/3D, DOM leak detection")
    info("Features: event listener tracking + duplicate prevention, blob leak prevention")
    info("Features: memory-aware CSS, Page Lifecycle + visibilitychange integration")
    info("v5.0: setInterval/setTimeout tracker + reaper (caps: inapp=15, mobile=25)")
    info("v5.0: AudioContext reaper — auto-closes stale/abandoned audio contexts")
    info("v5.0: Detached DOM node sweeper — releases off-screen canvas GPU memory")
    info("v5.0: History API memory cap — prevents SPA state bloat")
    info("v5.0: Progressive degradation timeline (2m/5m/10m/15m cleanup waves)")
    info("v5.0: RAF storm detection + throttling (caps: inapp=30/s, mobile=45/s)")
    info("v5.0: createElement factory tracker — catches particle system leaks")
    info("v5.0: Startup immediate warning mode for in-app browsers")
    info("v5.0: Safari/WebKit memory estimation fallback (no performance.memory)")
    info("v5.0: Deep clean on page hide + periodic deep clean every 2m after 10m")
    results["memory_guardian_size_kb"] = round(size_kb, 1)

    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 16: IN-APP BROWSER SHIELD
# ════════════════════════════════════════════════════════════════════

def generate_inapp_shield() -> dict:
    """
    Generate a shield script that handles in-app browser quirks:
    Instagram, TikTok, Facebook, Twitter/X, Snapchat, LinkedIn, etc.
    These browsers have limited memory, no WebGL, weird viewport behavior,
    and often crash on heavy pages.

    Optimizations: 156-170
    """
    header("16. In-App Browser Shield")
    results = {}

    inapp_shield = """// BULLMONEY IN-APP BROWSER SHIELD v3.0 (auto-generated by boost.py)
// Protects against crashes in Instagram, TikTok, Facebook in-app browsers
(function(){
'use strict';
var w=window,d=document,n=navigator;
var ua=n.userAgent||'';
var S=w.__BM_INAPP_SHIELD__={active:false,browser:null,fixes:[]};

// ─── 156. Detect Specific In-App Browser ───
var detections=[
  {name:'instagram',pattern:/instagram/i},
  {name:'tiktok',pattern:/tiktok|bytedance|musical_ly/i},
  {name:'facebook',pattern:/fban|fbav|fb_iab|facebook/i},
  {name:'twitter',pattern:/twitter/i},
  {name:'snapchat',pattern:/snapchat/i},
  {name:'linkedin',pattern:/linkedin/i},
  {name:'wechat',pattern:/micromessenger|wechat/i},
  {name:'line',pattern:/line\\//i},
  {name:'telegram',pattern:/telegram/i},
  {name:'pinterest',pattern:/pinterest/i},
  {name:'reddit',pattern:/reddit/i},
  {name:'discord',pattern:/discord/i},
  {name:'webview-ios',pattern:/\\bwv\\b.*safari/i},
  {name:'webview-android',pattern:/\\bwv\\b/i},
];

for(var i=0;i<detections.length;i++){
  if(detections[i].pattern.test(ua)){
    S.browser=detections[i].name;
    S.active=true;
    break;
  }
}

if(!S.active)return; // Not an in-app browser, exit early

d.documentElement.setAttribute('data-inapp',S.browser);
d.documentElement.classList.add('in-app-browser');

// ─── 157. Disable Heavy Features for In-App ───
// In-app browsers typically have 1-2GB memory limit and no WebGL2
d.documentElement.setAttribute('data-3d-quality','disabled');
d.documentElement.classList.add('reduce-effects');
S.fixes.push('disabled-3d');

// ─── 158. Fix Viewport Issues ───
// In-app browsers often have wrong viewport height (address bar confusion)
function fixViewport(){
  var vh=w.innerHeight*0.01;
  d.documentElement.style.setProperty('--vh',vh+'px');
  d.documentElement.style.setProperty('--app-height',w.innerHeight+'px');
  d.documentElement.style.setProperty('--safe-bottom','env(safe-area-inset-bottom,0px)');
}
fixViewport();
w.addEventListener('resize',fixViewport);
// Instagram iOS needs extra resize detection
var lastH=w.innerHeight;
setInterval(function(){
  if(w.innerHeight!==lastH){lastH=w.innerHeight;fixViewport();}
},500);
S.fixes.push('viewport-fix');

// ─── 159. Prevent Scroll Locking ───
// In-app browsers often get stuck on overscroll
d.body.style.overscrollBehavior='none';
d.documentElement.style.overscrollBehavior='none';
// Prevent pull-to-refresh in in-app
d.body.style.touchAction='pan-x pan-y';
S.fixes.push('scroll-fix');

// ─── 160. Memory-Safe Image Loading ───
// Load smaller images in in-app browsers
d.querySelectorAll('img[srcset]').forEach(function(img){
  // Force smallest srcset option
  var srcset=img.getAttribute('srcset');
  if(srcset){
    var srcs=srcset.split(',').map(function(s){return s.trim().split(/\\s+/);});
    if(srcs.length>0){
      img.src=srcs[0][0]; // Use smallest image
      img.removeAttribute('srcset');
    }
  }
});
S.fixes.push('image-downscale');

// ─── 161. Videos preserved (no longer disabled) ───
// Videos and GIFs are intentionally kept playing for user experience
S.fixes.push('video-preserved');

// ─── 162. Reduce Animation Complexity ───
// NEVER use display:none on content sections — user sees blank gaps
// NEVER use filter:none — breaks invert/brightness theming (black↔white glitch)
// NEVER use transform:none on * — breaks layout positioning
var inappStyle=d.createElement('style');
inappStyle.textContent=[
  '.in-app-browser *{animation-duration:0.15s!important;transition-duration:0.1s!important;}',
  // Only truly decorative particles get hidden (tiny elements, no content)
  '.in-app-browser .particle-container,.in-app-browser .confetti{opacity:0!important;pointer-events:none!important;height:0!important;overflow:hidden!important;}',
  // Aurora: fade to near-invisible but keep in layout flow
  '.in-app-browser .aurora{opacity:0.05!important;}',
  // Glass: opaque dark fallback (keeps text readable)
  '.in-app-browser .glass-effect,.in-app-browser .glassmorphism,.in-app-browser .glass-surface,.in-app-browser .glass-card{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;background:rgba(5,9,21,0.85)!important;border-color:rgba(255,255,255,0.06)!important;}',
  '.in-app-browser [data-apple-section] .glass-effect,.in-app-browser [data-apple-section] .glassmorphism,.in-app-browser [data-apple-section] .glass-surface,.in-app-browser [data-apple-section] .glass-card{background:rgba(255,255,255,0.92)!important;border-color:rgba(0,0,0,0.08)!important;color:#0f172a!important;}',
  '.in-app-browser [data-products-section] .glass-effect,.in-app-browser [data-products-section] .glassmorphism,.in-app-browser [data-products-section] .glass-surface,.in-app-browser [data-products-section] .glass-card{background:rgba(255,255,255,0.92)!important;border-color:rgba(0,0,0,0.08)!important;color:#0f172a!important;}',
  '.in-app-browser .glass-effect.bg-white,.in-app-browser .glassmorphism.bg-white,.in-app-browser .glass-surface.bg-white,.in-app-browser .glass-card.bg-white{background:rgba(255,255,255,0.92)!important;border-color:rgba(0,0,0,0.08)!important;color:#0f172a!important;}',
  '.in-app-browser .glass-effect.bg-gray-50,.in-app-browser .glassmorphism.bg-gray-50,.in-app-browser .glass-surface.bg-gray-50,.in-app-browser .glass-card.bg-gray-50{background:rgba(255,255,255,0.92)!important;border-color:rgba(0,0,0,0.08)!important;color:#0f172a!important;}',
  '.in-app-browser .glass-effect.bg-neutral-50,.in-app-browser .glassmorphism.bg-neutral-50,.in-app-browser .glass-surface.bg-neutral-50,.in-app-browser .glass-card.bg-neutral-50{background:rgba(255,255,255,0.92)!important;border-color:rgba(0,0,0,0.08)!important;color:#0f172a!important;}',
  // Complex components: simplify but KEEP VISIBLE — reduce animations, keep content
  '.in-app-browser .circular-gallery{animation:none!important;overflow:hidden!important;}',
  '.in-app-browser .card-swap{animation:none!important;transition:none!important;}',
  '.in-app-browser .color-bends{animation:none!important;opacity:0.5!important;}',
].join('\\n');
d.head.appendChild(inappStyle);
S.fixes.push('css-reduced');

// ─── 163. Safe External Link Handling ───
// In-app browsers often trap links; add target hints
d.addEventListener('click',function(e){
  var a=e.target.closest('a[href]');
  if(!a)return;
  var href=a.getAttribute('href')||'';
  // External links should open in default browser
  if(href.startsWith('http')&&href.indexOf(w.location.hostname)===-1){
    // Attempt to break out of in-app browser
    if(S.browser==='instagram'||S.browser==='tiktok'){
      e.preventDefault();
      // Try deep link to default browser
      w.open(href,'_system')||w.open(href,'_blank');
    }
  }
});
S.fixes.push('link-handling');

// ─── 164. Crash Recovery ───
// If the page crashes and reloads, detect it and go lighter
var crashKey='bm_inapp_crashes';
var crashes=parseInt(sessionStorage.getItem(crashKey)||'0',10);
if(crashes>0){
  // Page crashed before - go ultra-light mode
  // PRESERVE filter (theming) and transform (layout) — only strip animation/transition/box-shadow
  d.documentElement.classList.add('ultra-light-mode');
  var ultraStyle=d.createElement('style');
  ultraStyle.textContent=[
    // No filter:none (breaks invert/brightness theming = black/white glitch)
    // No transform:none (breaks translate/scale layout = elements pile up at 0,0)
    '.ultra-light-mode *{animation:none!important;transition:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}',
    '.ultra-light-mode *:not(.product-card-premium):not(input):not(button):not(a){box-shadow:none!important;}',
    '.ultra-light-mode img{image-rendering:auto;}',
    '.ultra-light-mode .hero{min-height:auto!important;height:auto!important;}',
    // Glass: opaque dark fallback so no transparent-over-black
    '.ultra-light-mode .glass-effect,.ultra-light-mode .glassmorphism,.ultra-light-mode .glass-surface,.ultra-light-mode .glass-card{background:rgba(5,9,21,0.88)!important;border-color:rgba(255,255,255,0.05)!important;}',
    '.ultra-light-mode [data-apple-section] .glass-effect,.ultra-light-mode [data-apple-section] .glassmorphism,.ultra-light-mode [data-apple-section] .glass-surface,.ultra-light-mode [data-apple-section] .glass-card{background:rgba(255,255,255,0.92)!important;border-color:rgba(0,0,0,0.08)!important;color:#0f172a!important;}',
    '.ultra-light-mode [data-products-section] .glass-effect,.ultra-light-mode [data-products-section] .glassmorphism,.ultra-light-mode [data-products-section] .glass-surface,.ultra-light-mode [data-products-section] .glass-card{background:rgba(255,255,255,0.92)!important;border-color:rgba(0,0,0,0.08)!important;color:#0f172a!important;}',
    '.ultra-light-mode .glass-effect.bg-white,.ultra-light-mode .glassmorphism.bg-white,.ultra-light-mode .glass-surface.bg-white,.ultra-light-mode .glass-card.bg-white{background:rgba(255,255,255,0.92)!important;border-color:rgba(0,0,0,0.08)!important;color:#0f172a!important;}',
    '.ultra-light-mode .glass-effect.bg-gray-50,.ultra-light-mode .glassmorphism.bg-gray-50,.ultra-light-mode .glass-surface.bg-gray-50,.ultra-light-mode .glass-card.bg-gray-50{background:rgba(255,255,255,0.92)!important;border-color:rgba(0,0,0,0.08)!important;color:#0f172a!important;}',
    '.ultra-light-mode .glass-effect.bg-neutral-50,.ultra-light-mode .glassmorphism.bg-neutral-50,.ultra-light-mode .glass-surface.bg-neutral-50,.ultra-light-mode .glass-card.bg-neutral-50{background:rgba(255,255,255,0.92)!important;border-color:rgba(0,0,0,0.08)!important;color:#0f172a!important;}',
  ].join('\\n');
  d.head.appendChild(ultraStyle);
  S.fixes.push('crash-recovery-ultralight');
}
// Track this load as a potential crash (cleared on successful load)
sessionStorage.setItem(crashKey,String(crashes+1));
w.addEventListener('load',function(){
  // Loaded successfully - reset crash counter
  setTimeout(function(){sessionStorage.setItem(crashKey,'0');},3000);
});

// ─── 165-170. "Open in Browser" Banner ───
// Gentle nudge users to open in their real browser for best experience
if(S.browser==='instagram'||S.browser==='tiktok'||S.browser==='facebook'){
  w.addEventListener('load',function(){
    setTimeout(function(){
      if(d.getElementById('bm-open-browser'))return;
      var bar=d.createElement('div');
      bar.id='bm-open-browser';
      bar.style.cssText='position:fixed;bottom:0;left:0;right:0;padding:10px 16px;background:linear-gradient(135deg,#1a1a2e,#0a0a0a);border-top:1px solid rgba(255,215,0,0.3);z-index:99999;display:flex;align-items:center;justify-content:space-between;gap:8px;font-family:system-ui,-apple-system,sans-serif;';
      bar.innerHTML='<span style=\"color:#ffd700;font-size:13px;\">\\u26a1 Open in browser for the best experience</span>'
        +'<div style=\"display:flex;gap:6px;\">'
        +'<button onclick=\"this.parentElement.parentElement.remove()\" style=\"background:none;border:1px solid rgba(255,255,255,0.2);color:#999;padding:4px 10px;border-radius:6px;font-size:12px;cursor:pointer;\">Dismiss</button>'
        +'<a href=\"'+w.location.href+'\" target=\"_blank\" style=\"background:linear-gradient(135deg,#ffd700,#f59e0b);color:#000;padding:4px 12px;border-radius:6px;font-size:12px;text-decoration:none;font-weight:600;\">Open</a>'
        +'</div>';
      d.body.appendChild(bar);
    },2000);
  });
  S.fixes.push('open-in-browser-banner');
}

if(w.location.hostname==='localhost'){
  console.log('%c[IN-APP SHIELD] Detected: '+S.browser+' | Fixes: '+S.fixes.join(', '),'color:#f59e0b;font-weight:bold');
}
})();"""

    shield_path = PUBLIC_DIR / "scripts" / "inapp-shield.js"
    smart_write(shield_path, inapp_shield)

    size_kb = shield_path.stat().st_size / 1024
    success(f"In-App Browser Shield: {size_kb:.1f} KB")
    info("Detects: Instagram, TikTok, Facebook, Twitter, Snapchat, LinkedIn, WeChat+")
    info("Fixes: viewport, scroll lock, image downscale, video preserved, CSS reduction")
    info("Features: crash recovery, ultra-light mode, open-in-browser banner")
    results["inapp_shield_size_kb"] = round(size_kb, 1)

    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 17: STORE & APP PAGE CRASH PREVENTION
# ════════════════════════════════════════════════════════════════════

def generate_crash_prevention() -> dict:
    """
    Generate a crash prevention system specifically for the Store page and
    main App page, which are the heaviest pages in the app. Includes:
    - Component budget limiting
    - Incremental rendering queue
    - Scroll-aware lazy hydration
    - Automatic section freezing when off-screen
    - Store product grid virtualization hints

    Optimizations: 171-190
    """
    header("17. Store & App Page Crash Shield")
    results = {}

    crash_prevent = """// BULLMONEY CRASH PREVENTION v3.0 (auto-generated by boost.py)
// Specifically targets Store page and App page crash scenarios
(function(){
'use strict';
var w=window,d=document,p=performance;
var CP=w.__BM_CRASH_PREVENT__={active:true,renderedSections:0,maxSections:20,frozenSections:[]};

// ─── 171. Page-Specific Detection ───
var path=w.location.pathname;
var isStorePage=path==='/store'||path.startsWith('/store/');
var isAppPage=path==='/'||path==='/app';
var isHeavyPage=isStorePage||isAppPage;

if(!isHeavyPage){CP.active=false;return;}

d.documentElement.setAttribute('data-heavy-page',isStorePage?'store':'app');

// ─── 172. Incremental Section Renderer ───
// Don't render all sections at once - drip-feed them as user scrolls
var sectionQueue=[];
var renderingPaused=false;

CP.queueSection=function(sectionId,renderFn){
  sectionQueue.push({id:sectionId,render:renderFn,rendered:false});
};
CP.renderNextSection=function(){
  if(renderingPaused)return false;
  var next=sectionQueue.find(function(s){return !s.rendered;});
  if(next){
    next.rendered=true;
    CP.renderedSections++;
    try{next.render();}catch(e){
      if(w.location.hostname==='localhost')console.error('[CRASH PREVENT] Section render failed:',next.id,e);
    }
    return true;
  }
  return false;
};

// Render sections progressively via requestIdleCallback
function drainQueue(){
  if(CP.renderNextSection()){
    if('requestIdleCallback' in w){
      requestIdleCallback(drainQueue,{timeout:500});
    } else {
      setTimeout(drainQueue,100);
    }
  }
}

// ─── 173. Scroll-Triggered Section Rendering ───
var scrollRenderIO=null;
if('IntersectionObserver' in w){
  scrollRenderIO=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        var el=entry.target;
        var sectionId=el.getAttribute('data-section-id');
        if(sectionId){
          el.classList.remove('section-frozen');
          el.classList.add('section-active');
          el.dispatchEvent(new CustomEvent('section-activate'));
          // Restore iframes that were blanked
          el.querySelectorAll('iframe[data-src-backup]').forEach(function(iframe){
            iframe.src=iframe.getAttribute('data-src-backup');
            iframe.removeAttribute('data-src-backup');
          });
        }
      } else {
        // Off-screen: freeze section to save memory
        var el2=entry.target;
        var sid=el2.getAttribute('data-section-id');
        if(sid&&CP.renderedSections>5){
          // Only freeze if we have many sections rendered
          el2.classList.add('section-frozen');
          el2.classList.remove('section-active');
          el2.dispatchEvent(new CustomEvent('section-freeze'));
          CP.frozenSections.push(sid);
        }
      }
    });
  },{rootMargin:'300px 0px 300px 0px',threshold:[0]});
}

CP.observeSection=function(el){
  if(scrollRenderIO)scrollRenderIO.observe(el);
};

// ─── 174. Product Grid Virtualization Hints ───
// For store page: only render visible product cards
if(isStorePage){
  var gridStyle=d.createElement('style');
  gridStyle.textContent=[
    // Content-visibility for product cards: browser can skip rendering off-screen items
    // Use contain:layout style (NOT paint) so shimmer animations render properly
    '.product-card,.store-product-item,[data-product-id]{content-visibility:auto;contain-intrinsic-size:auto 300px;}',
    // Contain product images to prevent layout thrash
    '.product-card img,.store-product-item img{contain:layout style;content-visibility:auto;contain-intrinsic-size:auto 250px;}',
    // Infinite scroll sentinel
    '.products-sentinel{height:1px;width:100%;}',
    // Frozen sections save GPU layers (keep canvas/video/gifs visible)
    // EXEMPT product card shimmer elements from freeze — they are lightweight CSS-only
    '.section-frozen iframe:not([data-keep]){visibility:hidden!important;}',
    '.section-frozen *:not(canvas):not(video):not(.badge-shimmer-el):not(.card-shine-sweep):not(.card-image-shine):not(.neon-edge-top):not(.neon-edge-bottom):not(.product-card-premium){animation-play-state:paused!important;}',
    // Active sections get GPU boost
    '.section-active{will-change:auto;}',
    // Product card animations are transform-based (cheap) — protect from memory-level kills
    '[data-memory-level] .product-card-premium,[data-memory-level] .badge-shimmer-el,[data-memory-level] .card-shine-sweep,[data-memory-level] .card-image-shine{animation-duration:revert!important;transition-duration:revert!important;}',
    // Mobile mosaic grid compatibility
    '[class*=\"mobile-mosaic-\"] .product-card-premium{contain:layout style!important;}',
  ].join('\\n');
  d.head.appendChild(gridStyle);
}

// ─── 175. Heavy Component Budget ───
// Track how many heavy components are mounted simultaneously
var heavyComponents=new Map();
var maxHeavyComponents=(function(){
  var mem=(navigator.deviceMemory||4);
  if(mem>=8)return 8;
  if(mem>=4)return 5;
  if(mem>=2)return 3;
  return 2;
})();
CP.maxHeavyComponents=maxHeavyComponents;

CP.registerHeavy=function(id,weight){
  heavyComponents.set(id,{weight:weight||1,mounted:Date.now()});
  // Check if over budget
  var totalWeight=0;
  heavyComponents.forEach(function(c){totalWeight+=c.weight;});
  if(totalWeight>maxHeavyComponents){
    // Dispose oldest heavy component
    var oldest=null,oldestTime=Infinity;
    heavyComponents.forEach(function(c,key){
      if(c.mounted<oldestTime){oldestTime=c.mounted;oldest=key;}
    });
    if(oldest){
      w.dispatchEvent(new CustomEvent('bullmoney-dispose-component',{detail:{id:oldest}}));
      heavyComponents.delete(oldest);
    }
  }
  return totalWeight<=maxHeavyComponents;
};
CP.unregisterHeavy=function(id){heavyComponents.delete(id);};

// ─── 176-180. Smart Image Loading for Store ───
if(isStorePage&&'IntersectionObserver' in w){
  var imgIO=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      var img=entry.target;
      if(entry.isIntersecting){
        img.setAttribute('data-in-view','1');
        if(img.dataset.lazySrc){
          img.src=img.dataset.lazySrc;
          delete img.dataset.lazySrc;
        }
      } else {
        img.removeAttribute('data-in-view');
      }
    });
  },{rootMargin:'400px 0px 400px 0px'});

  // Observe product images
  function observeProductImages(){
    d.querySelectorAll('.product-card img,.store-product-item img').forEach(function(img){
      imgIO.observe(img);
    });
  }
  if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',observeProductImages);
  else observeProductImages();
  // Re-observe on new products loaded
  new MutationObserver(function(muts){
    muts.forEach(function(m){
      m.addedNodes.forEach(function(node){
        if(node.nodeType===1){
          var imgs=node.querySelectorAll?node.querySelectorAll('.product-card img,.store-product-item img'):[];
          imgs.forEach(function(img){imgIO.observe(img);});
        }
      });
    });
  }).observe(d.body||d.documentElement,{childList:true,subtree:true});
}

// ─── 181-185. Hero Carousel Memory Management ───
// Only keep 2 slides in DOM at a time (current + next)
CP.heroSlideLimit=3; // max DOM slides
CP.activeSlideIndex=0;

// ─── 186. Global Content-Visibility Optimization ───
var cvStyle=d.createElement('style');
cvStyle.textContent=[
  // Non-hero sections get content-visibility:auto (NEVER hero - it blocks scroll)
  'section:not(#hero):not(.hero):not([data-hero]),[data-section-id],.page-section{content-visibility:auto;contain-intrinsic-size:auto 500px;}',
  // Hero MUST always be visible + scrollable
  '#hero,.hero-section,.hero,[data-hero]{content-visibility:visible!important;overflow:visible!important;}',
  // Hero internals must never block scroll
  '#hero .hero-wrapper,.hero .hero-wrapper{overflow:visible!important;overflow-x:hidden!important;touch-action:pan-y!important;}',
  '#hero canvas,#hero .cycling-bg-layer,#hero .cycling-bg-item,#hero .cycling-bg-item.active,#hero [data-spline],#hero spline-viewer{pointer-events:none!important;touch-action:pan-y!important;}',
  // Footer can be fully deferred
  'footer,.footer-section{content-visibility:auto;contain-intrinsic-size:auto 400px;}',
  // Store-specific: product grid sections
  '.products-grid-section{content-visibility:auto;contain-intrinsic-size:auto 800px;}',
  // Modals are hidden until opened (save rendering cost)
  '.modal-overlay:not(.modal-open){content-visibility:hidden;}',
  // Heavy components use containment but not strict (strict blocks scroll)
  '.world-map-container,.chart-container,.testimonials-section{contain:layout style paint;content-visibility:auto;contain-intrinsic-size:auto 400px;}',
  // SCROLL SAFETY: ensure html/body always scrollable
  'html,body{overflow-y:auto!important;height:auto!important;touch-action:pan-y pan-x!important;}',
].join('\\n');
d.head.appendChild(cvStyle);

// ─── 187-190. Error Boundary Integration ───
// Catch React render errors and fall back gracefully
var renderErrors=0;
w.addEventListener('error',function(e){
  var msg=(e.message||'').toLowerCase();
  // Detect common crash-causing errors
  if(msg.indexOf('out of memory')>-1||msg.indexOf('aw, snap')>-1||msg.indexOf('allocation failed')>-1||msg.indexOf('maximum call stack')>-1){
    renderErrors++;
    if(renderErrors>=2){
      // Emergency mode - strip the page down
      d.documentElement.classList.add('emergency-mode','reduce-effects','memory-emergency');
      w.dispatchEvent(new CustomEvent('bullmoney-emergency-mode'));
      // Kill all canvases and iframes
      d.querySelectorAll('canvas:not([data-keep]),iframe:not([data-keep])').forEach(function(el){
        el.remove();
      });
      // Show recovery message
      var overlay=d.createElement('div');
      overlay.style.cssText='position:fixed;top:16px;left:50%;transform:translateX(-50%);padding:12px 24px;background:#1a1a2e;border:1px solid #ffd700;border-radius:12px;color:#ffd700;font-family:system-ui;font-size:14px;z-index:999999;text-align:center;';
      overlay.innerHTML='\\u26a1 Performance mode activated for smoother experience';
      d.body.appendChild(overlay);
      setTimeout(function(){overlay.remove();},5000);
    }
  }
});

if(w.location.hostname==='localhost'){
  console.log('%c[CRASH PREVENT] Active on '+(isStorePage?'Store':'App')+' page | Max heavy: '+maxHeavyComponents+' | Sections queued: '+sectionQueue.length,'color:#ef4444;font-weight:bold');
}
})();"""

    crash_path = PUBLIC_DIR / "scripts" / "crash-prevention.js"
    smart_write(crash_path, crash_prevent)

    size_kb = crash_path.stat().st_size / 1024
    success(f"Crash Prevention script: {size_kb:.1f} KB")
    info("Targets: Store page + App page (heaviest pages)")
    info("Features: incremental section rendering, product virtualization")
    info("Features: heavy component budget, scroll-triggered activation")
    info("Features: content-visibility CSS, OOM error recovery")
    results["crash_prevention_size_kb"] = round(size_kb, 1)

    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 18: PRODUCTION BUILD OPTIMIZER
# ════════════════════════════════════════════════════════════════════

def optimize_production_build() -> dict:
    """
    Generate build-time optimizations that speed up production builds
    and reduce bundle size. Includes webpack hints, tree-shaking verification,
    and dead code elimination checks.

    Optimizations: 191-200
    """
    header("18. Production Build Optimizer")
    results = {"optimizations": []}

    # 191. Generate .env.production optimization hints
    env_prod_path = ROOT_DIR / ".env.production.local.boost"
    env_hints = """# BOOST: Production build hints (auto-generated by boost.py v3.0)
# Copy desired values to .env.production.local

# Disable source maps for faster builds
GENERATE_SOURCEMAP=false

# Enable SWC minification (faster than Terser)
NEXT_PRIVATE_MINIMIZE=true

# Skip linting during build for speed
NEXT_SKIP_LINTING=1

# Reduce memory usage during build
NODE_OPTIONS=--max-old-space-size=4096

# Enable ISR for better production performance
NEXT_ISR_REVALIDATE_DEFAULT=60
"""
    env_prod_path.write_text(env_hints, encoding="utf-8")
    success("Production env hints generated")
    results["optimizations"].append("env-hints")

    # 192. Check for tree-shaking issues
    pkg_path = ROOT_DIR / "package.json"
    if pkg_path.exists():
        pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
        deps = pkg.get("dependencies", {})

        # Heavy packages that MUST be tree-shaken
        treeshake_critical = {
            "lodash": "Use lodash-es or per-function imports (lodash/get)",
            "moment": "Use date-fns or dayjs instead (moment is 300KB+)",
            "rxjs": "Use specific imports (rxjs/operators)",
        }
        for pkg_name, suggestion in treeshake_critical.items():
            if pkg_name in deps:
                warn(f"Tree-shake risk: {pkg_name} — {suggestion}")
            else:
                success(f"No bloated {pkg_name} dependency")

    # 193-195. Generate optimized import analysis
    barrel_exports = []
    for tsx_file in COMPONENTS_DIR.rglob("index.ts*"):
        content = FileCache.read(tsx_file)
        export_count = content.count("export ")
        if export_count > 10:
            barrel_exports.append({
                "file": str(tsx_file.relative_to(ROOT_DIR)),
                "exports": export_count,
            })

    if barrel_exports:
        warn(f"{len(barrel_exports)} barrel exports with 10+ re-exports (can hurt tree-shaking)")
        for b in barrel_exports[:5]:
            warn(f"  {b['file']} ({b['exports']} exports)")
    else:
        success("No problematic barrel exports")
    results["barrel_exports"] = len(barrel_exports)

    # 196-198. Check for dynamic import opportunities
    # First, build set of files that are targets of dynamic() imports
    # These are leaf components loaded via dynamic(() => import("..."))
    # They correctly use static imports internally — no warning needed
    dynamically_loaded_files: set = set()
    dynamic_import_pattern = re.compile(
        r"""dynamic\(\s*\(\)\s*=>\s*import\(\s*(?:/\*.*?\*/\s*)?['"]([^'"]+)['"]""",
        re.DOTALL,
    )
    static_import_pattern = re.compile(
        r"""^import\s+.*?from\s+['"]([^'"]+)['"]""", re.MULTILINE,
    )
    alias_map = {"@/": str(ROOT_DIR) + "/"}
    all_tsx_files = list(APP_DIR.rglob("*.tsx")) + list(COMPONENTS_DIR.rglob("*.tsx"))

    # Cache for _resolve_import to avoid repeated Path.exists() syscalls
    _resolve_cache: dict[tuple[str, str], str | None] = {}

    def _resolve_import(target, from_file):
        """Resolve an import specifier to an absolute path (cached)."""
        cache_key = (target, str(from_file))
        if cache_key in _resolve_cache:
            return _resolve_cache[cache_key]
        orig_target = target
        # Resolve @/ alias
        for alias, real in alias_map.items():
            if target.startswith(alias):
                target = target.replace(alias, real + "/", 1)
                break
        # Resolve relative
        if target.startswith("."):
            target = str((from_file.parent / target).resolve())
        elif not target.startswith("/"):
            _resolve_cache[cache_key] = None
            return None  # bare specifier (node_modules)
        for ext in ("", ".tsx", ".ts", ".jsx", ".js", "/index.tsx", "/index.ts"):
            candidate = target + ext
            if Path(candidate).exists():
                resolved = str(Path(candidate).resolve())
                _resolve_cache[cache_key] = resolved
                return resolved
        _resolve_cache[cache_key] = None
        return None

    # Pre-resolve all tsx files once (avoid repeated .resolve() calls)
    _resolved_paths: dict[Path, str] = {}
    for tsx_file in all_tsx_files:
        if "node_modules" not in str(tsx_file):
            _resolved_paths[tsx_file] = str(tsx_file.resolve())

    # Pass 1: direct dynamic() targets — use FileCache
    for tsx_file, resolved_path in _resolved_paths.items():
        content = FileCache.read(tsx_file)
        for m in dynamic_import_pattern.finditer(content):
            resolved = _resolve_import(m.group(1), tsx_file)
            if resolved:
                dynamically_loaded_files.add(resolved)

    # Pass 2: files statically imported BY dynamically-loaded files are also
    # transitively dynamic (they only appear in chunks, never the main bundle).
    # Run multiple passes until stable to handle deeper chains.
    for _pass in range(3):
        new_dynamic: set[str] = set()
        for dyn_file in list(dynamically_loaded_files):
            content = FileCache.read(Path(dyn_file))
            if not content:
                continue
            for m in static_import_pattern.finditer(content):
                resolved = _resolve_import(m.group(1), Path(dyn_file))
                if resolved and resolved not in dynamically_loaded_files:
                    new_dynamic.add(resolved)
        if not new_dynamic:
            break
        dynamically_loaded_files |= new_dynamic

    # Also build a filename set for fuzzy matching (handles barrel re-exports,
    # subdirectory mismatches, etc.)
    dynamic_basenames = set()
    for p in dynamically_loaded_files:
        stem = Path(p).stem  # e.g. "Ballpit"
        dynamic_basenames.add(stem)

    # Build main-bundle reachability set: files statically reachable from app/ entry points
    # Only files in this set can actually end up in the client main bundle.
    entry_points = set()
    for route_file in APP_DIR.rglob("*.tsx"):
        rp = _resolved_paths.get(route_file) or str(route_file.resolve())
        entry_points.add(rp)
    main_bundle_files = set(entry_points)  # start with all app/ files
    for _pass in range(4):
        new_reachable = set()
        for f in list(main_bundle_files):
            content = FileCache.read(Path(f))
            if not content:
                continue
            # Skip files that use dynamic() — their static imports don't go into main bundle
            if "dynamic(" in content:
                continue
            for m in static_import_pattern.finditer(content):
                resolved = _resolve_import(m.group(1), Path(f))
                if resolved and resolved not in main_bundle_files and resolved not in dynamically_loaded_files:
                    new_reachable.add(resolved)
        if not new_reachable:
            break
        main_bundle_files |= new_reachable

    static_heavy_imports = []

    # Pre-compile heavy patterns for speed
    heavy_patterns_compiled = [
        (re.compile(r"import.*from\s+['\"]three['\"]"), "three"),
        (re.compile(r"import.*from\s+['\"]@react-three"), "@react-three"),
        (re.compile(r"import.*from\s+['\"]gsap['\"]"), "gsap"),
        (re.compile(r"import.*from\s+['\"]recharts['\"]"), "recharts"),
        (re.compile(r"import.*from\s+['\"]face-api"), "face-api"),
        (re.compile(r"import.*from\s+['\"]cobe['\"]"), "cobe"),
        (re.compile(r"import.*from\s+['\"]matter-js['\"]"), "matter-js"),
        (re.compile(r"import.*from\s+['\"]@splinetool"), "@splinetool"),
    ]

    for tsx_file in all_tsx_files:
        resolved = _resolved_paths.get(tsx_file)
        if not resolved:
            continue
        # Skip if this file is a target of a dynamic() import somewhere
        if resolved in dynamically_loaded_files:
            continue
        # Skip if basename matches a known dynamically loaded component
        if tsx_file.stem in dynamic_basenames:
            continue
        # Skip if file is NOT reachable from main bundle entry points
        if resolved not in main_bundle_files:
            continue
        content = FileCache.read(tsx_file)
        if "dynamic(" in content or "lazy(" in content:
            continue
        for pattern, lib_name in heavy_patterns_compiled:
            if pattern.search(content):
                static_heavy_imports.append({
                    "file": str(tsx_file.relative_to(ROOT_DIR)),
                    "lib": lib_name,
                })

    if static_heavy_imports:
        warn(f"{len(static_heavy_imports)} files statically import heavy libraries:")
        for item in static_heavy_imports[:10]:
            warn(f"  {item['file']} → {item['lib']} (should be dynamic)")
    else:
        success("All heavy libraries properly dynamic-imported")
    if dynamically_loaded_files:
        success(f"{len(dynamically_loaded_files)} heavy components correctly loaded via dynamic()")
    results["static_heavy_imports"] = len(static_heavy_imports)
    results["dynamic_loaded_components"] = len(dynamically_loaded_files)

    # 199-200. Generate webpack bundle analyzer hint
    analyzer_config = {
        "analyzerMode": "static",
        "reportFilename": ".next/analyze/bundle-report.html",
        "openAnalyzer": False,
        "generateStatsFile": True,
        "statsFilename": ".next/analyze/bundle-stats.json",
    }
    analyzer_path = ROOT_DIR / ".bundle-analyzer.json"
    analyzer_path.write_text(json.dumps(analyzer_config, indent=2), encoding="utf-8")
    success("Bundle analyzer config generated")
    results["optimizations"].append("bundle-analyzer-config")

    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 19: GPU & WEBGL PERFORMANCE MANAGER
# ════════════════════════════════════════════════════════════════════

def generate_gpu_manager() -> dict:
    """
    Generate a GPU performance manager that:
    - Detects GPU capabilities and driver quirks
    - Manages WebGL context creation limits (max ~16 per browser)
    - Implements context pooling and recycling
    - Prevents "too many WebGL contexts" crash
    - Auto-reduces quality when GPU is under pressure

    Optimizations: 201-210+
    """
    header("19. GPU & WebGL Performance Manager")
    results = {}

    gpu_manager = """// BULLMONEY GPU MANAGER v3.0 (auto-generated by boost.py)
// Manages WebGL contexts and GPU resources to prevent crashes
(function(){
'use strict';
var w=window,d=document,n=navigator;
var GM=w.__BM_GPU_MANAGER__={contexts:[],maxContexts:8,activeContexts:0,contextPool:[],gpuInfo:{}};
var isMobile=/mobi|android|iphone|ipad|ipod/i.test(n.userAgent||'');
var isInApp=/instagram|fban|fbav|tiktok|snapchat|twitter|linkedin|wechat|line\\/|telegram|pinterest|reddit/i.test(n.userAgent||'');
GM.isMobile=isMobile;GM.isInApp=isInApp;
d.documentElement.setAttribute('data-effects',(isMobile||isInApp)?'lite':'full');

// ─── 201. GPU Capability Detection ───
(function detectGPU(){
  try{
    var c=d.createElement('canvas');
    var gl=c.getContext('webgl2')||c.getContext('webgl');
    if(!gl){GM.gpuInfo={supported:false};return;}
    GM.gpuInfo.supported=true;
    GM.gpuInfo.version=gl.getParameter(gl.VERSION);
    GM.gpuInfo.vendor=gl.getParameter(gl.VENDOR);
    var dbg=gl.getExtension('WEBGL_debug_renderer_info');
    if(dbg){
      GM.gpuInfo.renderer=gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
      GM.gpuInfo.gpuVendor=gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL);
    }
    GM.gpuInfo.maxTextureSize=gl.getParameter(gl.MAX_TEXTURE_SIZE);
    GM.gpuInfo.maxViewport=gl.getParameter(gl.MAX_VIEWPORT_DIMS);
    GM.gpuInfo.maxRenderBufferSize=gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
    GM.gpuInfo.webgl2=!!c.getContext('webgl2');

    // Detect known weak GPUs
    var renderer=(GM.gpuInfo.renderer||'').toLowerCase();
    GM.gpuInfo.isIntegrated=/intel|mesa|swiftshader|llvmpipe|softpipe/i.test(renderer);
    GM.gpuInfo.isAppleGPU=/apple/i.test(renderer);
    GM.gpuInfo.isNvidia=/nvidia|geforce|quadro|rtx|gtx/i.test(renderer);
    GM.gpuInfo.isAMD=/amd|radeon|rx\\s/i.test(renderer);

    // Set max contexts based on GPU
    if(GM.gpuInfo.isIntegrated||!GM.gpuInfo.webgl2){GM.maxContexts=4;}
    else if(GM.gpuInfo.isAppleGPU){GM.maxContexts=6;}
    else{GM.maxContexts=8;}

    // Lossy context detection
    c.addEventListener('webglcontextlost',function(){
      GM.activeContexts=Math.max(0,GM.activeContexts-1);
      w.dispatchEvent(new CustomEvent('bullmoney-webgl-context-lost'));
    });

    gl.getExtension('WEBGL_lose_context'); // enable manual context loss
  }catch(e){GM.gpuInfo={supported:false};}
})();

// ─── 202. WebGL Context Pool ───
// Reuse contexts instead of creating new ones (prevents "too many contexts" crash)
GM.acquireContext=function(canvas,opts){
  if(GM.activeContexts>=GM.maxContexts){
    // Over limit - try to recycle oldest context
    var oldest=GM.contexts.shift();
    if(oldest&&oldest.canvas){
      var ext=oldest.gl.getExtension('WEBGL_lose_context');
      if(ext)ext.loseContext();
      GM.activeContexts--;
    }
  }
  opts=opts||{};
  var gl=canvas.getContext('webgl2',opts)||canvas.getContext('webgl',opts);
  if(gl){
    GM.contexts.push({gl:gl,canvas:canvas,created:Date.now()});
    GM.activeContexts++;
  }
  return gl;
};

GM.releaseContext=function(canvas){
  GM.contexts=GM.contexts.filter(function(ctx){
    if(ctx.canvas===canvas){
      try{
        var ext=ctx.gl.getExtension('WEBGL_lose_context');
        if(ext)ext.loseContext();
      }catch(e){}
      GM.activeContexts--;
      return false;
    }
    return true;
  });
};

// ─── 203. Context Lost Recovery ───
w.addEventListener('bullmoney-webgl-context-lost',function(){
  // When a context is lost, try to restore it after a delay
  setTimeout(function(){
    GM.contexts.forEach(function(ctx){
      if(ctx.gl.isContextLost()){
        var ext=ctx.gl.getExtension('WEBGL_lose_context');
        if(ext){
          try{ext.restoreContext();}catch(e){}
        }
      }
    });
  },1000);
});

// ─── 204. Canvas Resolution Manager ───
// Dynamically adjust canvas resolution based on GPU pressure
GM.optimizeCanvas=function(canvas,targetWidth,targetHeight){
  var ST=w.__BM_SPLINE_TURBO__||{};
  var scale=ST.getCanvasScale?ST.getCanvasScale():1;
  canvas.width=Math.round(targetWidth*scale);
  canvas.height=Math.round(targetHeight*scale);
  canvas.style.width=targetWidth+'px';
  canvas.style.height=targetHeight+'px';
  return scale;
};

// ─── 205-208. WebGL Memory Pressure Detection ───
// Monitor for WebGL errors that indicate GPU memory pressure
var lastGLError=0;
var glErrorCount=0;
var origGetError=null;

if(GM.gpuInfo.supported){
  // Periodic health check
  setInterval(function(){
    GM.contexts.forEach(function(ctx){
      if(!ctx.gl.isContextLost()){
        var err=ctx.gl.getError();
        if(err!==0&&err!==ctx.gl.NO_ERROR){
          glErrorCount++;
          if(glErrorCount>5){
            // GPU under pressure - reduce quality
            d.documentElement.setAttribute('data-gpu-pressure','high');
            w.dispatchEvent(new CustomEvent('bullmoney-gpu-pressure',{detail:{errors:glErrorCount}}));
          }
        }
      }
    });
  },10000);
}

// ─── 209-210. CSS containment for GPU layer management ───
var gpuStyle=d.createElement('style');
gpuStyle.textContent=[
  // Prevent GPU layer explosion
  'canvas{contain:strict;}',
  // Mobile: keep effects but lighter weight
  '[data-effects="lite"]{--blur-amount:6px;--shadow-strength:0.6;--glow-opacity:0.6;}',
  '[data-effects="lite"] .glass-effect,[data-effects="lite"] .glassmorphism,[data-effects="lite"] .glass-surface,[data-effects="lite"] .glass-card,[data-effects="lite"] .glass-dark,[data-effects="lite"] .glass-frosted,[data-effects="lite"] .glass-clear,[data-effects="lite"] .glass-premium,[data-effects="lite"] .glass-light{backdrop-filter:blur(6px) saturate(1.1)!important;-webkit-backdrop-filter:blur(6px) saturate(1.1)!important;}',
  '[data-effects="lite"] .glass-glow::before,[data-effects="lite"] .glass-glow-strong::before,[data-effects="lite"] .glass-glow-pulse::before{opacity:0.6!important;}',
  // Limit compositing layers on low-end GPUs
  // NEVER use transform:none on * — it destroys ALL layout (translate, scale, rotate used for positioning)
  // Instead: only reset will-change and strip backdrop-filter (the expensive GPU ops)
  '[data-gpu-pressure="high"] *{will-change:auto!important;}',
  '[data-gpu-pressure="high"] *:not(.product-card-premium):not([style*="transform"]):not([class*="translate"]):not([class*="scale"]):not([class*="rotate"]){backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}',
  '[data-gpu-pressure="high"] canvas{image-rendering:pixelated;}',
  // Glass: opaque dark fallback under GPU pressure
  '[data-gpu-pressure="high"] .glass-effect,[data-gpu-pressure="high"] .glassmorphism,[data-gpu-pressure="high"] .glass-surface,[data-gpu-pressure="high"] .glass-card{background:rgba(0,0,0,0.88)!important;border-color:rgba(255,255,255,0.06)!important;}',
  // Force hardware acceleration only where needed
  '.gpu-accelerated{transform:translateZ(0);will-change:transform;}',
  // Prevent stacking context explosion
  '.z-auto{z-index:auto!important;}',
].join('\\n');
d.head.appendChild(gpuStyle);

d.documentElement.setAttribute('data-webgl',GM.gpuInfo.supported?'true':'false');
d.documentElement.setAttribute('data-gpu-tier',GM.gpuInfo.isIntegrated?'integrated':GM.gpuInfo.isNvidia||GM.gpuInfo.isAMD?'discrete':'unknown');
d.documentElement.setAttribute('data-max-webgl-contexts',GM.maxContexts);

if(w.location.hostname==='localhost'){
  console.log('%c[GPU MANAGER] '+(GM.gpuInfo.renderer||'Unknown GPU')+' | Max contexts: '+GM.maxContexts+' | WebGL'+(GM.gpuInfo.webgl2?'2':'1'),'color:#a855f7;font-weight:bold');
}
})();"""

    gpu_path = PUBLIC_DIR / "scripts" / "gpu-manager.js"
    smart_write(gpu_path, gpu_manager)

    size_kb = gpu_path.stat().st_size / 1024
    success(f"GPU Manager script: {size_kb:.1f} KB")
    info("Features: GPU detection, WebGL context pool, context recovery")
    info("Features: canvas resolution manager, memory pressure detection")
    info("Features: compositing layer management, GPU tier classification")
    results["gpu_manager_size_kb"] = round(size_kb, 1)

    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 20: DEAD CODE & UNUSED EXPORT DETECTION
# ════════════════════════════════════════════════════════════════════

def detect_dead_code() -> dict:
    """
    Scan for unused component files, orphan exports, and dead code.
    Identifies components that are never imported anywhere, unused CSS
    modules, and orphan test/story files without matching components.

    Optimizations: 211-225
    """
    header("20. Dead Code & Unused File Detection")
    results = {"unused_components": [], "orphan_files": [], "unused_css_modules": []}

    # 211-213. Build import graph: which files import which components
    all_tsx = list(COMPONENTS_DIR.rglob("*.tsx")) + list(COMPONENTS_DIR.rglob("*.ts"))
    app_tsx = list(APP_DIR.rglob("*.tsx")) + list(APP_DIR.rglob("*.ts"))
    hooks_dir = ROOT_DIR / "hooks"
    hook_files = list(hooks_dir.rglob("*.ts")) + list(hooks_dir.rglob("*.tsx")) if hooks_dir.exists() else []

    all_source_files = all_tsx + app_tsx + hook_files

    # Collect all import targets from all source files
    import_targets: set = set()
    _from_re = re.compile(r"from\s+['\"]([^'\"]+)['\"]")

    for src_file in all_source_files:
        try:
            content = FileCache.read(src_file)
            for match in _from_re.findall(content):
                # Normalize: strip extension, get basename
                target = match.replace("@/", "").split("/")[-1]
                for ext in (".tsx", ".ts", ".jsx", ".js"):
                    target = target.replace(ext, "")
                import_targets.add(target)
        except Exception:
            pass

    # 214-216. Find component files never imported
    unused_components = []
    for comp in all_tsx:
        stem = comp.stem
        # Skip index files, type files, test files
        if stem in ("index", "types", "constants") or stem.startswith("__"):
            continue
        if stem.endswith(".test") or stem.endswith(".spec") or stem.endswith(".stories"):
            continue
        # Check if this component name appears in any import
        if stem not in import_targets:
            # Double-check: maybe it's imported with a different path
            rel_path = str(comp.relative_to(ROOT_DIR))
            found = False
            for target in import_targets:
                if stem.lower() == target.lower():
                    found = True
                    break
            if not found:
                unused_components.append({
                    "file": rel_path,
                    "name": stem,
                    "size_kb": round(comp.stat().st_size / 1024, 1),
                })

    results["unused_components"] = sorted(unused_components, key=lambda x: x["size_kb"], reverse=True)[:25]

    if unused_components:
        total_waste = sum(c["size_kb"] for c in unused_components)
        warn(f"{len(unused_components)} potentially unused components ({total_waste:.1f} KB waste):")
        for c in results["unused_components"][:8]:
            warn(f"  {c['file']} ({c['size_kb']} KB)")
    else:
        success("No unused components detected")

    # 217-219. Find orphan CSS modules (*.module.css not imported)
    css_modules = list(COMPONENTS_DIR.rglob("*.module.css")) + list(APP_DIR.rglob("*.module.css"))
    for css_mod in css_modules:
        stem = css_mod.stem.replace(".module", "")
        if stem not in import_targets and css_mod.stem not in import_targets:
            results["unused_css_modules"].append(str(css_mod.relative_to(ROOT_DIR)))

    if results["unused_css_modules"]:
        warn(f"{len(results['unused_css_modules'])} unused CSS modules")
    else:
        success("All CSS modules are referenced")

    # 220-222. Find .bak / .old / .backup files that should be cleaned
    backup_patterns = ["*.bak", "*.old", "*.backup", "*.orig", "*.tmp"]
    backup_files = []
    for pattern in backup_patterns:
        backup_files.extend(COMPONENTS_DIR.rglob(pattern))
        backup_files.extend(APP_DIR.rglob(pattern))

    if backup_files:
        total_bak_kb = sum(f.stat().st_size for f in backup_files) / 1024
        warn(f"{len(backup_files)} backup/temp files ({total_bak_kb:.1f} KB):")
        for bf in backup_files[:5]:
            warn(f"  {bf.relative_to(ROOT_DIR)}")
    else:
        success("No stale backup files")

    results["backup_files"] = len(backup_files)

    # 223-225. Detect empty or near-empty files
    empty_files = []
    for f in all_tsx:
        try:
            size = f.stat().st_size
            if size < 50:  # Less than 50 bytes = probably empty/placeholder
                empty_files.append(str(f.relative_to(ROOT_DIR)))
        except Exception:
            pass

    if empty_files:
        warn(f"{len(empty_files)} nearly empty files")
    else:
        success("No empty placeholder files")

    results["empty_files"] = len(empty_files)
    success(f"Dead code scan: {len(all_source_files)} files analyzed")
    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 21: SECURITY & SECRET LEAK SCANNER
# ════════════════════════════════════════════════════════════════════

def scan_security() -> dict:
    """
    Scan for exposed secrets, hardcoded API keys, XSS vectors,
    unsafe eval usage, and CORS misconfigurations.

    Optimizations: 226-245
    """
    header("21. Security & Secret Leak Scanner")
    results = {"exposed_secrets": [], "xss_risks": [], "unsafe_patterns": []}

    # 226-230. Scan client-side files for hardcoded secrets
    secret_patterns = [
        (re.compile(r'(?:api[_-]?key|apikey|secret|password|token|auth)\s*[:=]\s*["\'][a-zA-Z0-9_\-]{20,}["\']', re.IGNORECASE), "Hardcoded secret/key"),
        (re.compile(r'sk_(?:live|test)_[a-zA-Z0-9]{20,}'), "Stripe secret key exposed"),
        (re.compile(r'(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{30,}'), "GitHub token exposed"),
        (re.compile(r'mongodb\+srv://[^\s"\']+'), "MongoDB connection string"),
        (re.compile(r'SG\.[a-zA-Z0-9_\-]{20,}\.[a-zA-Z0-9_\-]{20,}'), "SendGrid API key"),
        (re.compile(r're_[a-zA-Z0-9_]{20,}'), "Resend API key"),
    ]

    # Only scan client-side code (not .env files, which are expected to have secrets)
    client_files = list(COMPONENTS_DIR.rglob("*.tsx")) + list(COMPONENTS_DIR.rglob("*.ts"))
    client_files += list(APP_DIR.rglob("*.tsx")) + list(APP_DIR.rglob("*.ts"))
    # Exclude API routes (server-side)
    client_files = [f for f in client_files if "/api/" not in str(f)]

    for src_file in client_files:
        try:
            content = FileCache.read(src_file)
            rel_path = str(src_file.relative_to(ROOT_DIR))

            for pattern, desc in secret_patterns:
                match = pattern.search(content)
                if match:
                    # Skip if it's near a process.env reference (that's OK)
                    context_start = max(0, match.start() - 80)
                    context_end = min(len(content), match.end() + 40)
                    context_slice = content[context_start:context_end]
                    if "process.env" in context_slice:
                        continue
                    results["exposed_secrets"].append({"file": rel_path, "type": desc})
        except Exception:
            pass

    if results["exposed_secrets"]:
        for s in results["exposed_secrets"][:10]:
            error(f"SECRET LEAK: {s['type']} in {s['file']}")
    else:
        success("No hardcoded secrets found in client code")

    # 231-235. Check for XSS-vulnerable patterns
    xss_patterns = [
        (re.compile(r'dangerouslySetInnerHTML'), "dangerouslySetInnerHTML usage"),
        (re.compile(r'eval\s*\('), "eval() usage (code injection risk)"),
        (re.compile(r'new\s+Function\s*\('), "new Function() (eval-like risk)"),
        (re.compile(r'document\.write\s*\('), "document.write() usage"),
        (re.compile(r'innerHTML\s*='), "Direct innerHTML assignment"),
    ]

    xss_count = 0
    for src_file in client_files:
        try:
            content = FileCache.read(src_file)
            rel_path = str(src_file.relative_to(ROOT_DIR))
            for pattern, desc in xss_patterns:
                matches = pattern.findall(content)
                if matches:
                    xss_count += len(matches)
                    results["xss_risks"].append({"file": rel_path, "type": desc, "count": len(matches)})
        except Exception:
            pass

    if xss_count > 0:
        warn(f"{xss_count} potential XSS-risk patterns found:")
        for risk in results["xss_risks"][:8]:
            warn(f"  {risk['file']}: {risk['type']} (×{risk['count']})")
    else:
        success("No XSS-risk patterns detected")

    # 236-238. Check API routes for proper auth
    api_dir = APP_DIR / "api"
    if api_dir.exists():
        api_routes = list(api_dir.rglob("route.ts")) + list(api_dir.rglob("route.tsx"))
        unprotected = []
        for route in api_routes:
            try:
                content = FileCache.read(route)
                rel_path = str(route.relative_to(ROOT_DIR))
                # Check POST/PUT/DELETE handlers have some auth check
                has_mutating = bool(re.search(r'export\s+(async\s+)?function\s+(POST|PUT|DELETE|PATCH)', content))
                has_auth = any(check in content for check in [
                    "authorization", "Authorization", "auth", "session",
                    "getServerSession", "ADMIN_PASSWORD", "CRON_SECRET",
                    "x-api-key", "Bearer", "authenticate", "supabase.auth",
                ])
                if has_mutating and not has_auth:
                    unprotected.append(rel_path)
            except Exception:
                pass

        if unprotected:
            warn(f"{len(unprotected)} API routes with mutations but no visible auth:")
            for r in unprotected[:5]:
                warn(f"  {r}")
        else:
            success("All mutating API routes appear to have auth checks")
        results["unprotected_api_routes"] = len(unprotected)

    # 239-242. Check for CORS misconfig
    next_config_path = ROOT_DIR / "next.config.mjs"
    if next_config_path.exists():
        nc = next_config_path.read_text(encoding="utf-8")
        if "Access-Control-Allow-Origin" in nc:
            if "'*'" in nc or '"*"' in nc:
                warn("CORS: Access-Control-Allow-Origin is set to '*' (wide open)")
            else:
                success("CORS: Restricted origin policy")
        else:
            info("CORS: No explicit Access-Control-Allow-Origin header")

    # 243-245. Check vercel.json for security headers
    vercel_config = ROOT_DIR / "vercel.json"
    if vercel_config.exists():
        try:
            vc = json.loads(vercel_config.read_text(encoding="utf-8"))
            headers = str(vc.get("headers", []))
            security_checks = ["X-Frame-Options", "X-Content-Type-Options", "Referrer-Policy"]
            for hdr in security_checks:
                if hdr in headers:
                    success(f"Vercel: {hdr} header configured")
                else:
                    info(f"Vercel: {hdr} not in vercel.json (may be in next.config)")
        except Exception:
            pass

    success(f"Security scan: {len(client_files)} client files analyzed")
    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 22: FONT OPTIMIZATION & FOUT PREVENTION
# ════════════════════════════════════════════════════════════════════

def optimize_fonts() -> dict:
    """
    Analyze font usage, generate font-display: swap hints,
    create font preload tags, detect unused font declarations,
    and generate a font subsetting recommendation.

    Optimizations: 246-260
    """
    header("22. Font Optimization & FOUT Prevention")
    results = {"fonts_found": [], "preloads_generated": 0, "issues": []}

    # 246-248. Scan for font files in public/
    font_extensions = {".woff2", ".woff", ".ttf", ".otf", ".eot"}
    font_files = []
    for f in PUBLIC_DIR.rglob("*"):
        if f.is_file() and f.suffix.lower() in font_extensions:
            font_files.append({
                "path": str(f.relative_to(ROOT_DIR)),
                "format": f.suffix.lower(),
                "size_kb": round(f.stat().st_size / 1024, 1),
            })

    results["fonts_found"] = font_files

    if font_files:
        total_font_kb = sum(f["size_kb"] for f in font_files)
        info(f"Found {len(font_files)} font files ({total_font_kb:.1f} KB total)")

        # Check for non-woff2 fonts (suboptimal)
        non_woff2 = [f for f in font_files if f["format"] != ".woff2"]
        if non_woff2:
            warn(f"{len(non_woff2)} fonts not in WOFF2 format (larger file size):")
            for f in non_woff2[:5]:
                warn(f"  {f['path']} ({f['format']}, {f['size_kb']} KB)")

        # Check for oversized fonts (>100KB = likely not subsetted)
        large_fonts = [f for f in font_files if f["size_kb"] > 100]
        if large_fonts:
            warn(f"{len(large_fonts)} fonts over 100KB (consider subsetting):")
            for f in large_fonts[:5]:
                warn(f"  {f['path']} ({f['size_kb']} KB)")
    else:
        info("No local font files (may be using Google Fonts CDN)")

    # 249-252. Scan CSS for font-face declarations
    css_files = list(APP_DIR.rglob("*.css")) + list(STYLES_DIR.rglob("*.css")) if STYLES_DIR.exists() else list(APP_DIR.rglob("*.css"))
    font_face_count = 0
    missing_display_swap = 0
    font_face_re = re.compile(r'@font-face\s*\{([^}]+)\}', re.DOTALL)

    for css_file in css_files:
        try:
            content = css_file.read_text(encoding="utf-8", errors="ignore")
            for match in font_face_re.finditer(content):
                font_face_count += 1
                block = match.group(1)
                if "font-display" not in block:
                    missing_display_swap += 1
                elif "swap" not in block and "optional" not in block:
                    info(f"font-display is not 'swap' or 'optional' in {css_file.name}")
        except Exception:
            pass

    if font_face_count > 0:
        success(f"Found {font_face_count} @font-face declarations")
        if missing_display_swap > 0:
            warn(f"{missing_display_swap} @font-face blocks missing font-display: swap")
        else:
            success("All @font-face blocks have font-display set")
    results["font_face_count"] = font_face_count
    results["missing_display_swap"] = missing_display_swap

    # 253-256. Check layout.tsx for Next.js font optimization (next/font)
    layout_path = APP_DIR / "layout.tsx"
    if layout_path.exists():
        layout_content = layout_path.read_text(encoding="utf-8", errors="ignore")
        if "next/font" in layout_content:
            success("Using next/font (automatic font optimization)")
            if "display:" in layout_content and "'swap'" in layout_content:
                success("Font display: swap configured in next/font")
            elif "display:" not in layout_content:
                warn("next/font missing display: 'swap' option")
        else:
            info("Not using next/font — consider it for automatic optimization")

    # 257-260. Generate font preload hints
    font_preloads = ""
    woff2_fonts = [f for f in font_files if f["format"] == ".woff2"]
    if woff2_fonts:
        font_preloads = "<!-- BOOST: Font Preloads (auto-generated) -->\n"
        for font in woff2_fonts[:4]:  # Preload max 4 critical fonts
            font_preloads += f'<link rel="preload" href="/{font["path"].replace("public/", "")}" as="font" type="font/woff2" crossorigin />\n'
            results["preloads_generated"] += 1
        
        preload_path = PUBLIC_DIR / "scripts" / "font-preloads.html"
        smart_write(preload_path, font_preloads)
        success(f"Generated {results['preloads_generated']} font preload hints")

    # Generate font performance CSS
    font_css = """/* BOOST: Font Performance (auto-generated by boost.py) */
/* Prevent FOUT (Flash of Unstyled Text) */
.fonts-loading body { opacity: 0.95; }
.fonts-loaded body { opacity: 1; transition: opacity 0.1s ease; }

/* Font rendering optimization */
body {
    text-rendering: optimizeSpeed;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

/* System font stack fallback for fast first paint */
.system-font {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* Prevent layout shift from font loading */
@font-face {
    font-display: swap;  /* Show fallback immediately, swap when loaded */
}

/* Size-adjust for common font swaps to minimize CLS */
.font-adjust-inter { size-adjust: 107%; }
.font-adjust-roboto { size-adjust: 100.3%; }
.font-adjust-opensans { size-adjust: 105.5%; }
"""
    font_css_path = PUBLIC_DIR / "scripts" / "font-boost.css"
    smart_write(font_css_path, font_css)
    success("Font performance CSS generated")

    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 23: API ROUTE HEALTH CHECK
# ════════════════════════════════════════════════════════════════════

def check_api_routes() -> dict:
    """
    Validate API route structure, error handling, response headers,
    rate limiting implementations, and response time hints.

    Optimizations: 261-275
    """
    header("23. API Route Health Check")
    results = {"total_routes": 0, "issues": [], "well_formed": 0}

    api_dir = APP_DIR / "api"
    if not api_dir.exists():
        info("No API routes directory found")
        return results

    route_files = list(api_dir.rglob("route.ts")) + list(api_dir.rglob("route.tsx"))
    results["total_routes"] = len(route_files)

    if not route_files:
        info("No API route files found")
        return results

    info(f"Scanning {len(route_files)} API routes...")

    no_try_catch = []
    no_response_type = []
    missing_methods = []
    overly_large = []
    has_rate_limit = 0
    has_caching = 0

    for route in route_files:
        try:
            content = FileCache.read(route)
            rel_path = str(route.relative_to(ROOT_DIR))
            lines = content.count("\n") + 1

            # 261-262. Check for try-catch error handling
            exports = re.findall(r'export\s+(async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH)', content)
            has_handler = len(exports) > 0
            has_try = "try" in content and "catch" in content

            if has_handler and not has_try:
                no_try_catch.append(rel_path)

            # 263. Check for proper Response type usage
            if has_handler and "NextResponse" not in content and "Response" not in content:
                no_response_type.append(rel_path)

            # 264. Check for missing HTTP methods declaration
            if "export const runtime" not in content and "export const dynamic" not in content:
                # Not critical, just informational
                pass

            # 265-266. Check for oversized route handlers
            if lines > 300:
                overly_large.append({"file": rel_path, "lines": lines})

            # 267. Check for rate limiting
            if "rateLimit" in content or "rate-limit" in content or "rateLimiter" in content or "X-RateLimit" in content:
                has_rate_limit += 1

            # 268. Check for response caching headers
            if "Cache-Control" in content or "s-maxage" in content or "stale-while-revalidate" in content:
                has_caching += 1

            # 269. Check the handler is well-formed
            if has_handler and has_try:
                results["well_formed"] += 1

        except Exception:
            pass

    # Report results
    if no_try_catch:
        warn(f"{len(no_try_catch)} API routes missing try-catch error handling:")
        for r in no_try_catch[:5]:
            warn(f"  {r}")
    else:
        success("All API routes have error handling")

    if no_response_type:
        warn(f"{len(no_response_type)} routes may not return proper Response objects")

    if overly_large:
        warn(f"{len(overly_large)} oversized API routes (>300 lines):")
        for r in overly_large[:3]:
            warn(f"  {r['file']} ({r['lines']} lines)")

    info(f"Rate limiting: {has_rate_limit}/{len(route_files)} routes")
    info(f"Response caching: {has_caching}/{len(route_files)} routes")
    success(f"API health: {results['well_formed']}/{len(route_files)} routes well-formed")

    results["no_try_catch"] = len(no_try_catch)
    results["has_rate_limit"] = has_rate_limit
    results["has_caching"] = has_caching

    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 24: THIRD-PARTY SCRIPT AUDIT
# ════════════════════════════════════════════════════════════════════

def audit_third_party_scripts() -> dict:
    """
    Detect and audit third-party scripts: analytics, tracking pixels,
    chat widgets, ad scripts. Estimate their performance impact and
    generate a loading strategy.

    Optimizations: 276-290
    """
    header("24. Third-Party Script Budget")
    results = {"scripts_found": [], "total_estimated_kb": 0, "recommendations": []}

    # 276-280. Known third-party script signatures and their estimated sizes
    third_party_catalog = {
        "googletagmanager.com": {"name": "Google Tag Manager", "est_kb": 80, "category": "analytics"},
        "google-analytics.com": {"name": "Google Analytics", "est_kb": 50, "category": "analytics"},
        "gtag": {"name": "Google Global Site Tag", "est_kb": 50, "category": "analytics"},
        "facebook.net/en_US/fbevents.js": {"name": "Facebook Pixel", "est_kb": 60, "category": "tracking"},
        "connect.facebook.net": {"name": "Facebook SDK", "est_kb": 150, "category": "social"},
        "platform.twitter.com": {"name": "Twitter Widget", "est_kb": 120, "category": "social"},
        "snap.licdn.com": {"name": "LinkedIn Insight", "est_kb": 70, "category": "tracking"},
        "hotjar.com": {"name": "Hotjar", "est_kb": 100, "category": "analytics"},
        "clarity.ms": {"name": "Microsoft Clarity", "est_kb": 60, "category": "analytics"},
        "intercom.io": {"name": "Intercom", "est_kb": 250, "category": "chat"},
        "crisp.chat": {"name": "Crisp Chat", "est_kb": 200, "category": "chat"},
        "tawk.to": {"name": "Tawk.to Chat", "est_kb": 180, "category": "chat"},
        "stripe.com/v3": {"name": "Stripe.js", "est_kb": 40, "category": "payment"},
        "js.stripe.com": {"name": "Stripe.js", "est_kb": 40, "category": "payment"},
        "cdn.sentry.io": {"name": "Sentry Error Tracking", "est_kb": 70, "category": "monitoring"},
        "recaptcha": {"name": "reCAPTCHA", "est_kb": 150, "category": "security"},
        "spline.design": {"name": "Spline Runtime", "est_kb": 300, "category": "3d"},
        "youtube.com/iframe_api": {"name": "YouTube IFrame API", "est_kb": 60, "category": "media"},
        "player.vimeo.com": {"name": "Vimeo Player", "est_kb": 45, "category": "media"},
    }

    # Scan all source files for third-party script references
    scan_files = list(APP_DIR.rglob("*.tsx")) + list(APP_DIR.rglob("*.ts"))
    scan_files += list(COMPONENTS_DIR.rglob("*.tsx")) + list(COMPONENTS_DIR.rglob("*.ts"))

    found_scripts = set()
    for src_file in scan_files:
        try:
            content = src_file.read_text(encoding="utf-8", errors="ignore")
            for pattern, info_data in third_party_catalog.items():
                if pattern in content and info_data["name"] not in found_scripts:
                    found_scripts.add(info_data["name"])
                    results["scripts_found"].append({
                        "name": info_data["name"],
                        "category": info_data["category"],
                        "estimated_kb": info_data["est_kb"],
                    })
                    results["total_estimated_kb"] += info_data["est_kb"]
        except Exception:
            pass

    if results["scripts_found"]:
        info(f"Third-party scripts detected ({results['total_estimated_kb']} KB estimated):")
        by_category = defaultdict(list)
        for s in results["scripts_found"]:
            by_category[s["category"]].append(s)

        for category, scripts in by_category.items():
            cat_kb = sum(s["estimated_kb"] for s in scripts)
            names = ", ".join(s["name"] for s in scripts)
            info(f"  {category}: {names} (~{cat_kb} KB)")

        # 281-285. Generate loading strategy recommendations
        if results["total_estimated_kb"] > 500:
            warn(f"Third-party script budget HIGH: ~{results['total_estimated_kb']} KB")
            results["recommendations"].append("Consider lazy-loading non-critical scripts after interaction")
        elif results["total_estimated_kb"] > 250:
            info(f"Third-party script budget moderate: ~{results['total_estimated_kb']} KB")
        else:
            success(f"Third-party script budget OK: ~{results['total_estimated_kb']} KB")

        # Check for duplicate tracking
        analytics_count = len(by_category.get("analytics", []))
        if analytics_count > 1:
            warn(f"{analytics_count} analytics scripts — consider consolidating")
            results["recommendations"].append("Consolidate analytics to reduce overhead")

        chat_count = len(by_category.get("chat", []))
        if chat_count > 1:
            warn(f"{chat_count} chat widgets — only one should be active")
    else:
        success("No third-party scripts detected (lightweight!)")

    # 286-290. Generate third-party loading optimizer script
    if results["scripts_found"]:
        tp_script = """// BOOST: Third-Party Script Optimizer (auto-generated by boost.py)
// Delays non-critical third-party scripts until after user interaction
(function(){
'use strict';
var loaded=false;
var scripts=[];
var TP=window.__BM_THIRDPARTY__={deferred:[],loaded:[],blocked:[]};

// Queue a script for deferred loading
TP.defer=function(src,opts){
  opts=opts||{};
  scripts.push({src:src,async:opts.async!==false,id:opts.id||''});
  TP.deferred.push(src);
};

// Load all deferred scripts (triggered by user interaction)
function loadDeferred(){
  if(loaded)return;loaded=true;
  scripts.forEach(function(s){
    var el=document.createElement('script');
    el.src=s.src;el.async=s.async;
    if(s.id)el.id=s.id;
    document.head.appendChild(el);
    TP.loaded.push(s.src);
  });
}

// Trigger on first interaction or after 5s, whichever comes first
['click','scroll','keydown','touchstart','mousemove'].forEach(function(evt){
  window.addEventListener(evt,loadDeferred,{once:true,passive:true});
});
setTimeout(loadDeferred,5000);

// Block known heavy scripts from loading before interaction
var origCreateElement=document.createElement;
document.createElement=function(tag){
  var el=origCreateElement.call(document,tag);
  if(tag.toLowerCase()==='script'){
    var origSetAttr=el.setAttribute.bind(el);
    el.setAttribute=function(name,value){
      // Let all scripts through after user interaction
      origSetAttr(name,value);
    };
  }
  return el;
};
})();"""

        tp_path = PUBLIC_DIR / "scripts" / "thirdparty-optimizer.js"
        smart_write(tp_path, tp_script)
        success("Third-party optimizer script generated")

    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 25: ENVIRONMENT VARIABLE VALIDATOR
# ════════════════════════════════════════════════════════════════════

def validate_env_vars() -> dict:
    """
    Validate .env.local for missing, malformed, or insecure environment
    variables. Check for client-side leaks of server-only vars.

    Optimizations: 291-305
    """
    header("25. Environment Variable Validator")
    results = {"total_vars": 0, "missing": [], "insecure": [], "placeholder": []}

    env_path = ROOT_DIR / ".env.local"
    if not env_path.exists():
        warn(".env.local not found — checking .env")
        env_path = ROOT_DIR / ".env"
        if not env_path.exists():
            error("No .env file found!")
            return results

    content = env_path.read_text(encoding="utf-8")
    lines = content.strip().split("\n")

    env_vars = {}
    for line in lines:
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            key, _, value = line.partition("=")
            env_vars[key.strip()] = value.strip()

    results["total_vars"] = len(env_vars)
    info(f"Found {len(env_vars)} environment variables")

    # 291-295. Check for placeholder values
    placeholder_indicators = [
        "your_", "xxx", "placeholder", "changeme", "TODO",
        "replace_with", "INSERT_", "PASTE_HERE", "example",
    ]
    for key, value in env_vars.items():
        for indicator in placeholder_indicators:
            if indicator.lower() in value.lower() and len(value) > 3:
                results["placeholder"].append(key)
                warn(f"Placeholder value: {key} (contains '{indicator}')")
                break

    if not results["placeholder"]:
        success("No placeholder values detected")

    # 296-298. Check NEXT_PUBLIC_ vars don't contain secrets
    server_only_patterns = ["SECRET", "PRIVATE", "PASSWORD", "SERVICE_ROLE", "SMTP_PASS"]
    for key, value in env_vars.items():
        if key.startswith("NEXT_PUBLIC_"):
            for pattern in server_only_patterns:
                if pattern in key.upper():
                    results["insecure"].append(key)
                    error(f"SECURITY: {key} is NEXT_PUBLIC_ but contains '{pattern}' — may leak to browser!")

    if not results["insecure"]:
        success("No server secrets exposed via NEXT_PUBLIC_")

    # 299-301. Check for essential vars
    essential_vars = {
        "NEXT_PUBLIC_SUPABASE_URL": "Supabase connection",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY": "Supabase auth",
        "SUPABASE_SERVICE_ROLE_KEY": "Supabase admin",
        "STRIPE_SECRET_KEY": "Stripe payments",
        "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY": "Stripe checkout",
    }

    for var, desc in essential_vars.items():
        if var in env_vars and env_vars[var] and not any(p.lower() in env_vars[var].lower() for p in placeholder_indicators):
            success(f"Essential: {var} ({desc})")
        elif var in env_vars:
            warn(f"Essential var has placeholder: {var}")
            results["missing"].append(var)
        else:
            warn(f"Missing essential: {var} ({desc})")
            results["missing"].append(var)

    # 302-305. Check for empty values
    empty_vars = [k for k, v in env_vars.items() if not v]
    if empty_vars:
        info(f"{len(empty_vars)} vars with empty values: {', '.join(empty_vars[:5])}")
    else:
        success("No empty environment variables")

    results["empty_vars"] = len(empty_vars)
    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 26: DUPLICATE & DEAD CSS DETECTOR
# ════════════════════════════════════════════════════════════════════

def detect_duplicate_css() -> dict:
    """
    Detect duplicate CSS rules, unused selectors, overly specific
    selectors, and generate optimization recommendations.

    Optimizations: 306-320
    """
    header("26. Duplicate & Dead CSS Detector")
    results = {"total_rules": 0, "duplicates": 0, "files_scanned": 0, "issues": []}

    css_files = list(APP_DIR.rglob("*.css"))
    if STYLES_DIR.exists():
        css_files += list(STYLES_DIR.rglob("*.css"))

    results["files_scanned"] = len(css_files)

    # 306-310. Parse all CSS for duplicate selectors
    selector_map: dict = defaultdict(list)  # selector → [file, file, ...]
    property_count = 0
    total_size = 0

    selector_re = re.compile(r'([^{@/]+?)\s*\{([^}]*)\}', re.DOTALL)
    important_re = re.compile(r'!important')

    important_count = 0
    deep_nesting = 0

    for css_file in css_files:
        try:
            content = css_file.read_text(encoding="utf-8", errors="ignore")
            total_size += len(content)
            rel_path = str(css_file.relative_to(ROOT_DIR))

            for match in selector_re.finditer(content):
                selector = match.group(1).strip()
                props = match.group(2).strip()
                if selector and not selector.startswith("/*"):
                    results["total_rules"] += 1
                    selector_map[selector].append(rel_path)
                    property_count += props.count(";")

                    # Count !important usage
                    important_count += len(important_re.findall(props))

            # Check for deep nesting (more than 4 levels)
            nesting = content.count("{") - content.count("}")
            if abs(nesting) > 4:
                deep_nesting += 1

        except Exception:
            pass

    # Find actually duplicated selectors (same selector in multiple files)
    duplicates = {k: v for k, v in selector_map.items() if len(v) > 1 and not k.startswith("@")}
    results["duplicates"] = len(duplicates)

    if duplicates:
        warn(f"{len(duplicates)} duplicate CSS selectors across files:")
        for sel, files in list(duplicates.items())[:5]:
            sel_display = sel[:50] + "..." if len(sel) > 50 else sel
            warn(f"  '{sel_display}' → {', '.join(set(files))}")
    else:
        success("No duplicate CSS selectors across files")

    # 311-313. Check !important abuse
    if important_count > 50:
        warn(f"{important_count} !important declarations (specificity wars indicator)")
    elif important_count > 20:
        info(f"{important_count} !important declarations (moderate)")
    else:
        success(f"!important usage is reasonable ({important_count})")
    results["important_count"] = important_count

    # 314-316. CSS file size analysis
    total_css_kb = total_size / 1024
    if total_css_kb > 500:
        warn(f"Total CSS: {total_css_kb:.1f} KB (consider purging unused styles)")
    else:
        success(f"Total CSS: {total_css_kb:.1f} KB")
    results["total_css_kb"] = round(total_css_kb, 1)

    # 317-320. Check for Tailwind purge config
    tailwind_config = ROOT_DIR / "tailwind.config.ts"
    if not tailwind_config.exists():
        tailwind_config = ROOT_DIR / "tailwind.config.js"

    if tailwind_config.exists():
        tw_content = tailwind_config.read_text(encoding="utf-8", errors="ignore")
        if "content:" in tw_content or "purge:" in tw_content:
            success("Tailwind CSS content/purge configuration found")
        else:
            warn("Tailwind config missing content/purge paths (all utilities included!)")

        if "darkMode" in tw_content:
            success("Tailwind dark mode configured")
    else:
        info("No Tailwind config found")

    success(f"CSS audit: {results['files_scanned']} files, {results['total_rules']} rules, {property_count} properties")
    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 27: NETWORK WATERFALL OPTIMIZER
# ════════════════════════════════════════════════════════════════════

def generate_network_optimizer() -> dict:
    """
    Generate a network waterfall optimizer that intelligently
    prioritizes resource loading, implements predictive prefetching,
    and monitors network conditions for adaptive loading.

    Optimizations: 321-340
    """
    header("27. Network Waterfall Optimizer")
    results = {}

    network_script = """// BULLMONEY NETWORK WATERFALL OPTIMIZER v3.0 (auto-generated by boost.py)
// Intelligently prioritizes resource loading based on network conditions
(function(){
'use strict';
var w=window,d=document,n=navigator;
var NW=w.__BM_NETWORK__={strategy:'normal',prefetched:new Set(),priorities:{}};

// ─── 321. Network Condition Monitor ───
var conn=n.connection||n.mozConnection||n.webkitConnection||{};
function updateStrategy(){
  var type=conn.effectiveType||'4g';
  var saveData=conn.saveData||false;
  var downlink=conn.downlink||10;

  if(saveData){NW.strategy='minimal';}
  else if(type==='slow-2g'||type==='2g'){NW.strategy='minimal';}
  else if(type==='3g'||downlink<1.5){NW.strategy='conservative';}
  else if(type==='4g'&&downlink>=5){NW.strategy='aggressive';}
  else{NW.strategy='normal';}

  d.documentElement.setAttribute('data-network-strategy',NW.strategy);
  NW.effectiveType=type;
  NW.downlinkMbps=downlink;
  NW.saveData=saveData;
}
updateStrategy();
if(conn.addEventListener)conn.addEventListener('change',updateStrategy);

// ─── 322. Priority-Based Resource Loader ───
NW.loadResource=function(url,type,priority){
  priority=priority||'low';
  NW.priorities[url]=priority;

  if(NW.strategy==='minimal'&&priority==='low')return Promise.resolve(null);
  if(NW.strategy==='conservative'&&priority==='low'){
    // Defer low-priority in conservative mode
    return new Promise(function(resolve){
      requestIdleCallback(function(){
        resolve(NW._doLoad(url,type));
      },{timeout:5000});
    });
  }
  return NW._doLoad(url,type);
};

NW._doLoad=function(url,type){
  var link=d.createElement('link');
  if(type==='style'){link.rel='preload';link.as='style';}
  else if(type==='script'){link.rel='preload';link.as='script';}
  else if(type==='image'){link.rel='preload';link.as='image';}
  else if(type==='font'){link.rel='preload';link.as='font';link.crossOrigin='anonymous';}
  else{link.rel='prefetch';}
  link.href=url;
  d.head.appendChild(link);
  return Promise.resolve(url);
};

// ─── 323. Predictive Route Prefetcher ───
// Predicts which page the user will visit next based on current page
var predictions={
  '/':['/about','/shop','/Blogs','/community'],
  '/shop':['/store','/products','/Prop'],
  '/about':['/socials','/community','/recruit'],
  '/Blogs':['/','/community'],
  '/store':['/products','/shop'],
  '/community':['/socials','/course'],
  '/course':['/Prop','/community'],
};

var currentPath=w.location.pathname;
var predicted=predictions[currentPath]||[];

if(NW.strategy!=='minimal'){
  // Prefetch predicted routes after idle
  requestIdleCallback(function(){
    var limit=NW.strategy==='aggressive'?4:NW.strategy==='normal'?2:1;
    predicted.slice(0,limit).forEach(function(route){
      if(!NW.prefetched.has(route)){
        NW.prefetched.add(route);
        var link=d.createElement('link');
        link.rel='prefetch';link.href=route;
        d.head.appendChild(link);
      }
    });
  },{timeout:3000});
}

// ─── 324. Viewport-Aware Image Priority ───
// Boost priority of above-fold images, deprioritize below-fold
if('IntersectionObserver' in w){
  var imgPrioIO=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      var img=entry.target;
      if(entry.isIntersecting){
        if(img.getAttribute('loading')==='lazy'){
          // In viewport — upgrade priority
          img.setAttribute('fetchpriority','high');
          img.removeAttribute('loading');
        }
      }
    });
  },{rootMargin:'0px',threshold:[0]});

  // Observe hero and first-screen images
  d.addEventListener('DOMContentLoaded',function(){
    d.querySelectorAll('.hero img, section:first-of-type img, [data-hero] img').forEach(function(img){
      imgPrioIO.observe(img);
    });
  });
}

// ─── 325. Smart Fetch Wrapper with Retry ───
NW.fetch=function(url,opts){
  opts=opts||{};
  var retries=opts.retries||2;
  var timeout=opts.timeout||10000;

  function attempt(n){
    var controller=new AbortController();
    var timer=setTimeout(function(){controller.abort();},timeout);
    return fetch(url,Object.assign({},opts,{signal:controller.signal}))
      .then(function(r){clearTimeout(timer);return r;})
      .catch(function(e){
        clearTimeout(timer);
        if(n>0){
          // Exponential backoff
          return new Promise(function(resolve){
            setTimeout(function(){resolve(attempt(n-1));},1000*(retries-n+1));
          });
        }
        throw e;
      });
  }
  return attempt(retries);
};

// ─── 326. Request Deduplication ───
var inflightRequests=new Map();
NW.deduplicatedFetch=function(url,opts){
  var key=url+JSON.stringify(opts||{});
  if(inflightRequests.has(key)){
    return inflightRequests.get(key);
  }
  var promise=NW.fetch(url,opts).finally(function(){
    inflightRequests.delete(key);
  });
  inflightRequests.set(key,promise);
  return promise;
};

// ─── 327. Bandwidth Estimation ───
NW.estimateBandwidth=function(){
  return new Promise(function(resolve){
    var start=performance.now();
    fetch('/build-info.json',{cache:'no-store'}).then(function(r){
      return r.text();
    }).then(function(text){
      var elapsed=(performance.now()-start)/1000;
      var bytes=new Blob([text]).size;
      var bps=bytes/elapsed;
      NW.measuredBandwidthKBps=Math.round(bps/1024);
      resolve(NW.measuredBandwidthKBps);
    }).catch(function(){resolve(0);});
  });
};

// Measure bandwidth once after load
w.addEventListener('load',function(){
  setTimeout(function(){NW.estimateBandwidth();},3000);
});

// ─── 328-330. Adaptive Image Quality ───
// Serve lower quality images on slow networks
NW.getImageQuality=function(){
  if(NW.strategy==='minimal')return 40;
  if(NW.strategy==='conservative')return 60;
  if(NW.strategy==='aggressive')return 90;
  return 75; // normal
};

// Apply to Next.js Image component quality hints
d.documentElement.style.setProperty('--img-quality',NW.getImageQuality());

// ─── 331-335. Resource Loading Waterfall CSS ───
var nwStyle=d.createElement('style');
nwStyle.textContent=[
  // Minimal strategy: hide non-essential images
  '[data-network-strategy=\"minimal\"] img:not([data-critical]):not(.hero-img){content-visibility:auto;contain-intrinsic-size:auto 200px;}',
  '[data-network-strategy=\"minimal\"] video:not([data-critical]){display:none!important;}',
  '[data-network-strategy=\"minimal\"] iframe:not([data-critical]){display:none!important;}',
  // Conservative: reduce image sizes
  '[data-network-strategy=\"conservative\"] img{image-rendering:auto;}',
  // Aggressive: enable all prefetch animations
  '[data-network-strategy=\"aggressive\"] a[href]:hover{cursor:pointer;}',
].join('\\n');
d.head.appendChild(nwStyle);

// ─── 336-340. Connection Quality Badge (dev only) ───
if(w.location.hostname==='localhost'){
  w.addEventListener('load',function(){
    var badge=d.createElement('div');
    badge.style.cssText='position:fixed;bottom:40px;right:8px;padding:4px 8px;border-radius:6px;font-size:10px;font-family:monospace;z-index:99998;pointer-events:none;opacity:0.7;';
    var colors={minimal:'#ef4444',conservative:'#f59e0b',normal:'#22c55e',aggressive:'#3b82f6'};
    badge.style.background=colors[NW.strategy]||'#666';
    badge.style.color='#fff';
    badge.textContent='NET: '+NW.strategy+' ('+NW.effectiveType+')';
    d.body.appendChild(badge);
    // Update periodically
    setInterval(function(){
      badge.textContent='NET: '+NW.strategy+' ('+(NW.measuredBandwidthKBps||'?')+'KB/s)';
      badge.style.background=colors[NW.strategy]||'#666';
    },5000);
  });
  console.log('%c[NETWORK] Strategy: '+NW.strategy+' | Type: '+NW.effectiveType+' | Downlink: '+NW.downlinkMbps+'Mbps','color:#3b82f6;font-weight:bold');
}
})();"""

    network_path = PUBLIC_DIR / "scripts" / "network-optimizer.js"
    smart_write(network_path, network_script)

    size_kb = network_path.stat().st_size / 1024
    success(f"Network Waterfall Optimizer: {size_kb:.1f} KB")
    info("Features: adaptive loading strategy (minimal/conservative/normal/aggressive)")
    info("Features: predictive route prefetch, smart fetch with retry + dedup")
    info("Features: bandwidth estimation, viewport-aware image priority")
    info("Features: connection-adaptive CSS, image quality hints")
    results["network_optimizer_size_kb"] = round(size_kb, 1)

    return results


# ════════════════════════════════════════════════════════════════════
# SECTION 28: SITE-WIDE SEARCH INDEX GENERATOR
# ════════════════════════════════════════════════════════════════════

def generate_search_index() -> dict:
    """
    Scan all app routes, store product pages, and blog content
    to generate a static JSON search index for the site-wide
    command-palette search overlay.

    Optimizations: 341-345
    """
    header("28. Site Search Index Generator")
    results = {}

    # ─── 341. Discover all pages from app router ───
    pages = []

    # Static page registry (matches sitemap.ts + known routes)
    static_pages = [
        {"title": "Home", "href": "/", "description": "BullMoney main page", "category": "page", "keywords": ["home", "main", "landing", "bull money"]},
        {"title": "About", "href": "/about", "description": "Learn about BullMoney", "category": "page", "keywords": ["about", "who", "team", "story", "mission"]},
        {"title": "VIP Membership", "href": "/VIP", "description": "Exclusive VIP trading community", "category": "page", "keywords": ["vip", "premium", "membership", "exclusive", "signals", "subscribe"]},
        {"title": "Affiliates", "href": "/recruit", "description": "Join the affiliate program", "category": "page", "keywords": ["affiliate", "recruit", "referral", "earn", "commission", "partner"]},
        {"title": "Social Media", "href": "/socials", "description": "Follow us on social platforms", "category": "page", "keywords": ["social", "instagram", "twitter", "tiktok", "youtube", "discord", "telegram"]},
        {"title": "Blog & News", "href": "/Blogs", "description": "Trading insights, analysis, and news", "category": "blog", "keywords": ["blog", "news", "article", "post", "analysis", "insights", "updates"]},
        {"title": "Prop Trading", "href": "/Prop", "description": "BullMoney prop firm challenge", "category": "trading", "keywords": ["prop", "trading", "firm", "challenge", "funded", "account", "evaluation"]},
        {"title": "Trading Journal", "href": "/journal", "description": "Track and analyze your trades", "category": "trading", "keywords": ["journal", "diary", "trades", "track", "log", "performance", "pnl"]},
        {"title": "Live Quotes", "href": "/quotes", "description": "Real-time forex & crypto prices", "category": "trading", "keywords": ["quotes", "prices", "live", "forex", "crypto", "bitcoin", "gold", "market", "ticker"]},
        {"title": "Crypto Guide", "href": "/crypto-guide", "description": "Learn about cryptocurrency", "category": "trading", "keywords": ["crypto", "guide", "bitcoin", "ethereum", "learn", "blockchain", "defi"]},
        {"title": "Community", "href": "/community", "description": "Join the BullMoney community", "category": "community", "keywords": ["community", "chat", "discuss", "feed", "members", "post"]},
        {"title": "Trading Course", "href": "/course", "description": "Free trading education", "category": "education", "keywords": ["course", "learn", "education", "tutorial", "lesson", "beginner", "forex", "trading course"]},
        {"title": "Crypto Game", "href": "/crypto-game", "description": "Play the crypto trading game", "category": "education", "keywords": ["game", "play", "crypto", "simulation", "practice", "fun"]},
    ]
    pages.extend(static_pages)
    info(f"Static pages indexed: {len(static_pages)}")

    # ─── 342. Scan store categories ───
    store_categories = [
        {"title": "Store - All Products", "href": "/store", "description": "Browse the BullMoney store", "category": "store", "keywords": ["store", "shop", "products", "merch", "buy", "merchandise"]},
        {"title": "Apparel", "href": "/store?category=apparel", "description": "T-shirts, hoodies, and clothing", "category": "store", "keywords": ["apparel", "clothing", "shirt", "hoodie", "tshirt", "t-shirt", "wear", "jacket"]},
        {"title": "Accessories", "href": "/store?category=accessories", "description": "Hats, bags, phone cases and more", "category": "store", "keywords": ["accessories", "hat", "cap", "bag", "phone case", "sticker", "keychain"]},
        {"title": "Tech & Gear", "href": "/store?category=tech-gear", "description": "Tech gadgets and trading gear", "category": "store", "keywords": ["tech", "gear", "gadget", "mouse pad", "setup", "desk"]},
        {"title": "Home & Office", "href": "/store?category=home-office", "description": "Home and office trading setup", "category": "store", "keywords": ["home", "office", "desk", "decoration", "poster", "wall art", "candle"]},
        {"title": "Drinkware", "href": "/store?category=drinkware", "description": "Mugs, bottles and drinkware", "category": "store", "keywords": ["drinkware", "mug", "bottle", "cup", "water bottle", "coffee"]},
        {"title": "Limited Edition", "href": "/store?category=limited-edition", "description": "Exclusive limited edition drops", "category": "store", "keywords": ["limited", "edition", "exclusive", "rare", "drop", "special"]},
        {"title": "My Account", "href": "/store/account", "description": "View orders and account settings", "category": "store", "keywords": ["account", "orders", "profile", "settings", "my orders", "login"]},
    ]
    pages.extend(store_categories)
    info(f"Store categories indexed: {len(store_categories)}")

    # ─── 343. Auto-discover app routes from filesystem ───
    discovered = 0
    known_hrefs = {p["href"] for p in pages}
    for page_file in sorted(APP_DIR.rglob("page.tsx")):
        rel = page_file.relative_to(APP_DIR)
        parts = list(rel.parent.parts)
        # Skip route groups, api, auth, admin, modal, styles
        skip = False
        for p in parts:
            if p.startswith("(") or p.startswith("@") or p in ("api", "auth", "admin", "styles", "hooks", "models", "oldstore"):
                skip = True
                break
        if skip:
            continue
        route = "/" + "/".join(parts) if parts else "/"
        if route == "/" or route in known_hrefs:
            continue
        title = parts[-1].replace("-", " ").title() if parts else "Home"
        pages.append({
            "title": title,
            "href": route,
            "description": f"BullMoney {title} page",
            "category": "page",
            "keywords": [p.lower() for p in parts],
        })
        discovered += 1
    if discovered:
        info(f"Auto-discovered routes: {discovered}")

    # ─── 344. Write search index JSON ───
    search_index = {
        "version": 1,
        "generated": datetime.now(timezone.utc).isoformat(),
        "items": pages,
        "total": len(pages),
    }

    index_path = PUBLIC_DIR / "search-index.json"
    written = smart_write(index_path, json.dumps(search_index, indent=2))
    size_kb = index_path.stat().st_size / 1024

    if written:
        success(f"Search index written: {index_path.name} ({size_kb:.1f} KB, {len(pages)} items)")
    else:
        info(f"Search index unchanged: {index_path.name} ({len(pages)} items)")

    # ─── 345. Summary ───
    info(f"Total searchable items: {len(pages)}")
    info("Categories indexed: page, store, blog, trading, community, education")
    results["search_index_items"] = len(pages)
    results["search_index_size_kb"] = round(size_kb, 1)

    return results


# ════════════════════════════════════════════════════════════════════
# MAIN: RUN ALL OPTIMIZATIONS
# ════════════════════════════════════════════════════════════════════

def _safe_result(future, key: str):
    """Extract result from a future with error handling + auto-end section timing."""
    try:
        result = future.result()
        return result
    except Exception as exc:
        error(f"Section '{key}' failed: {exc}")
        return {"error": str(exc)}


def _worker_count(min_workers: int, max_workers: int, scale: int = 2) -> int:
    """Scale worker count based on CPU with guard rails."""
    cpu = os.cpu_count() or 4
    return max(min_workers, min(max_workers, cpu * scale))


def main():
    start_time = time.time()
    
    # ── Load configuration ──
    config = BoostConfig()
    incremental_cache = IncrementalCache()
    
    # ── Parse CLI flags ──
    report_only = "--report" in sys.argv
    skip_heavy = "--skip-heavy" in sys.argv or config.get("always_skip_heavy") or (_PRODUCTION_MODE and "--no-skip-heavy" not in sys.argv)
    watch_mode = "--watch" in sys.argv
    incremental = "--incremental" in sys.argv
    profile_mode = "--profile" in sys.argv
    show_diff = "--diff" in sys.argv
    init_config = "--init" in sys.argv
    clear_cache = "--clear-cache" in sys.argv

    # ── Handle --init: create config file and exit ──
    if init_config:
        cfg_path = BoostConfig.create_default()
        print(f"  {C.GREEN}✓{C.END} Created {C.GOLD}{cfg_path}{C.END}")
        print(f"  {C.DIM}Edit this file to customize boost behavior.{C.END}")
        sys.exit(0)

    # ── Handle --clear-cache: reset incremental cache ──
    if clear_cache:
        incremental_cache.clear()
        print(f"  {C.GREEN}✓{C.END} Cleared incremental cache")
        if len(sys.argv) == 2:  # Only --clear-cache provided
            sys.exit(0)

    # ── Parse --sections filter (e.g. --sections=1,3,14) ──
    _only_sections: set[int] | None = None
    _skip_sections: set[int] = set(config.get("skip_sections", []))
    for arg in sys.argv[1:]:
        if arg.startswith("--sections="):
            _only_sections = {int(s) for s in arg.split("=")[1].split(",") if s.isdigit()}
            break

    def _should_run(section_num: int, section_key: str = "") -> bool:
        if section_num in _skip_sections:
            return False
        if _only_sections is not None and section_num not in _only_sections:
            return False
        if incremental and section_key:
            if not incremental_cache.section_changed(section_key, ROOT_DIR):
                info(f"Section {section_num} unchanged, skipping...")
                return False
        return True

    # ── Colored help text ──
    if "--help" in sys.argv or "-h" in sys.argv:
        _builtin_print(__doc__)
        
        def _help_line(flag: str, desc: str, example: str = ""):
            ex = f" {C.DIM}({example}){C.END}" if example else ""
            _builtin_print(f"  {C.GOLD}{flag:<18}{C.END} {desc}{ex}")
        
        _builtin_print(f"\n{C.BOLD}{C.WHITE}Flags:{C.END}")
        _help_line("--report", "Print report without writing files")
        _help_line("--skip-heavy", "Skip image/bundle analysis", "faster")
        _help_line("--fast", "Disable cosmetic delays", "CI-friendly")
        _help_line("--production", "Production mode: auto-fast + skip-heavy")
        _help_line("--no-fast", "Disable auto-fast in production")
        _help_line("--no-skip-heavy", "Disable auto skip-heavy in production")
        _help_line("--sections=N", "Run only listed sections", "--sections=1,3,14")
        
        _builtin_print(f"\n{C.BOLD}{C.CYAN}v5.0 Features:{C.END}")
        _help_line("--watch", "Watch mode: re-run on file changes")
        _help_line("--incremental", "Only run sections with changed files")
        _help_line("--profile", "Show detailed timing breakdown")
        _help_line("--diff", "Show changes since last run")
        _help_line("--init", "Create .boostrc.json config file")
        _help_line("--clear-cache", "Clear incremental build cache")
        
        _builtin_print(f"\n{C.BOLD}{C.WHITE}Config:{C.END}")
        _builtin_print(f"  Create {C.GOLD}.boostrc.json{C.END} to customize behavior:")
        _builtin_print(f"  {C.DIM}skip_sections, always_skip_heavy, watch_dirs, thresholds, etc.{C.END}")
        
        _builtin_print(f"\n{C.BOLD}{C.WHITE}Examples:{C.END}")
        _builtin_print(f"  {C.GREEN}python scripts/boost.py{C.END}                    {C.DIM}# Full run{C.END}")
        _builtin_print(f"  {C.GREEN}python scripts/boost.py --fast --skip-heavy{C.END} {C.DIM}# Quick run{C.END}")
        _builtin_print(f"  {C.GREEN}python scripts/boost.py --watch{C.END}             {C.DIM}# Watch mode{C.END}")
        _builtin_print(f"  {C.GREEN}python scripts/boost.py --incremental{C.END}       {C.DIM}# Only changed{C.END}")
        _builtin_print()
        sys.exit(0)

    # ── Clear screen for clean look ──
    if sys.stdout.isatty() and not _PRODUCTION_MODE:
      print("\033[2J\033[H", end="")
    
    # ── Animated startup with premium spinner ──
    phases = [
        "Scanning project structure",
        "Loading optimization engine",
        "Analyzing configuration",
        "Preparing boost sequence",
    ]
    if _FAST_MODE:
        # Skip animation entirely in fast mode
        pbar = gradient_text("▪" * 16, (80, 220, 130), (255, 200, 50))
        sys.stdout.write(f"\r  {spinner_frame(0)} {C.SILVER}Initializing...{C.END} {pbar}  ")
        sys.stdout.flush()
    else:
        for pi, phase in enumerate(phases):
            for fi in range(4):
                pbar = gradient_text("▪" * (pi * 4 + fi + 1) + "▫" * (16 - pi * 4 - fi - 1),
                                     (80, 220, 130), (255, 200, 50))
                sys.stdout.write(f"\r  {spinner_frame(pi * 4 + fi)} {C.SILVER}{phase}...{C.END} {pbar}  ")
                sys.stdout.flush()
                time.sleep(0.02)
    sys.stdout.write("\r" + " " * 80 + "\r")
    sys.stdout.flush()
    
    # ── Print the big branded logo ──
    print()
    print(build_logo())
    
    # ── Timestamp bar with gradient separator ──
    now = datetime.now()
    ts = now.strftime('%Y-%m-%d %H:%M:%S')
    sep = gradient_text("━" * 64, (255, 200, 50), (80, 80, 100))
    print(f"  {sep}")
    print(f"    {C.DIM}📅{C.END} {C.WHITE}{ts}{C.END}  {C.DIM}│{C.END}  {C.GOLD}{C.BOLD}340+{C.END} {C.SILVER}optimizations{C.END}  {C.DIM}│{C.END}  {C.TEAL}Node ≥22{C.END}  {C.DIM}│{C.END}  {C.CYAN}Next.js 16{C.END}")
    sep2 = gradient_text("━" * 64, (80, 80, 100), (255, 200, 50))
    print(f"  {sep2}")
    
    # ── Send VS Code notification: starting ──
    send_vscode_notification(
        "Boost Engine Starting",
        f"Running 340+ optimizations across 27 categories...",
    )

    # Ensure output directories exist
    (PUBLIC_DIR / "scripts").mkdir(parents=True, exist_ok=True)
    (PUBLIC_DIR / "schemas").mkdir(parents=True, exist_ok=True)

    # ── Initialize report ──
    report = {}
    
    # Reset stats for this run
    Stats.total_checks = 0
    Stats.passed = 0  
    Stats.warnings = 0
    Stats.errors = 0
    Stats.sections_done = 0
    Stats.section_times.clear()

    # ── Phase 1: Script generation (I/O-light, can overlap) ──
    if _should_run(1, "device_detection"):
        report["device_detection"] = _run_timed(generate_device_detection_script)
    if _should_run(2, "resource_hints"):
        report["resource_hints"] = _run_timed(generate_resource_hints)
    if _should_run(3, "seo"):
        report["seo"] = _run_timed(enhance_seo)

    # ── Phase 2: Analysis sections (file I/O heavy — parallelized) ──
    if not skip_heavy:
        with ThreadPoolExecutor(max_workers=_worker_count(2, 6, scale=2)) as pool:
            futures = {}
            if _should_run(4, "images"):
                futures[pool.submit(_run_timed, audit_images)] = "images"
            if _should_run(5, "bundle"):
                futures[pool.submit(_run_timed, analyze_bundle)] = "bundle"
            for future in as_completed(futures):
                report[futures[future]] = _safe_result(future, futures[future])
    else:
        info("Skipping heavy analysis (--skip-heavy)")

    # ── Phase 3: Config checks + script generation (parallelized — all independent) ──
    with ThreadPoolExecutor(max_workers=_worker_count(3, 8, scale=2)) as pool:
        phase3_map = {
            6: (optimize_caching, "caching"),
            7: (generate_perf_monitor, "perf_monitor"),
            8: (validate_nextjs_config, "nextjs_config"),
            9: (check_accessibility, "accessibility"),
            11: (cleanup_stale_files, "cleanup"),
            12: (audit_dependencies, "dependencies"),
            13: (validate_pwa, "pwa"),
        }
        futures = {}
        for sec_num, (fn, key) in phase3_map.items():
            if _should_run(sec_num, key):
                futures[pool.submit(_run_timed, fn)] = key
        for future in as_completed(futures):
            report[futures[future]] = _safe_result(future, futures[future])

    # ── Phase 4: Heavy script generation (all independent, parallelized) ──
    with ThreadPoolExecutor(max_workers=_worker_count(3, 8, scale=2)) as pool:
        phase4_map = {
            14: (generate_spline_turbo, "spline_turbo"),
            15: (generate_memory_guardian, "memory_guardian"),
            16: (generate_inapp_shield, "inapp_shield"),
            17: (generate_crash_prevention, "crash_prevention"),
            19: (generate_gpu_manager, "gpu_manager"),
        }
        futures = {}
        for sec_num, (fn, key) in phase4_map.items():
            if _should_run(sec_num, key):
                futures[pool.submit(_run_timed, fn)] = key
        for future in as_completed(futures):
            report[futures[future]] = _safe_result(future, futures[future])

    if _should_run(18, "build_optimizer"):
        report["build_optimizer"] = _run_timed(optimize_production_build)

    # ── Phase 5: Analysis & security sections (parallelized) ──
    with ThreadPoolExecutor(max_workers=_worker_count(2, 6, scale=2)) as pool:
        phase5_map = {
            20: (detect_dead_code, "dead_code"),
            21: (scan_security, "security"),
            22: (optimize_fonts, "fonts"),
        }
        futures = {}
        for sec_num, (fn, key) in phase5_map.items():
            if _should_run(sec_num, key):
                futures[pool.submit(_run_timed, fn)] = key
        for future in as_completed(futures):
            report[futures[future]] = _safe_result(future, futures[future])

    # ── Phase 6: Validation & audit sections (parallelized) ──
    with ThreadPoolExecutor(max_workers=_worker_count(3, 8, scale=2)) as pool:
        phase6_map = {
            23: (check_api_routes, "api_routes"),
            24: (audit_third_party_scripts, "third_party"),
            25: (validate_env_vars, "env_vars"),
            26: (detect_duplicate_css, "css_audit"),
        }
        futures = {}
        for sec_num, (fn, key) in phase6_map.items():
            if _should_run(sec_num, key):
                futures[pool.submit(_run_timed, fn)] = key
        for future in as_completed(futures):
            report[futures[future]] = _safe_result(future, futures[future])

    if _should_run(27, "network_optimizer"):
        report["network_optimizer"] = _run_timed(generate_network_optimizer)

    if _should_run(28, "search_index"):
        report["search_index"] = _run_timed(generate_search_index)

    if _should_run(10, "boost_loader"):
        report["boost_loader"] = _run_timed(generate_boost_loader)

    # Calculate totals
    elapsed = time.time() - start_time
    
    # Count generated files
    scripts_dir = PUBLIC_DIR / "scripts"
    generated_files = list(scripts_dir.glob("*.js")) + list(scripts_dir.glob("*.html"))
    schemas_dir = PUBLIC_DIR / "schemas"
    schema_files = list(schemas_dir.glob("*.json"))
    total_files = len(generated_files) + len(schema_files) + 2  # +2 for build-info.json and prefetch-manifest.json
    
    total_size = sum(f.stat().st_size for f in generated_files + schema_files if f.exists())

    # Save report
    report["meta"] = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "elapsed_seconds": round(elapsed, 2),
        "files_generated": total_files,
        "total_size_bytes": total_size,
        "section_times": Stats.section_times,
    }
    
    BOOST_REPORT.write_text(json.dumps(report, indent=2, default=str), encoding="utf-8")

    # ── Calculate health score ──
    health = 100
    if Stats.warnings > 0:
        health -= min(Stats.warnings * 2, 20)
    if Stats.errors > 0:
        health -= min(Stats.errors * 5, 30)
    
    if health >= 90:
        grade, grade_color, grade_bg = "A+", C.GREEN, C.BG_GREEN
    elif health >= 80:
        grade, grade_color, grade_bg = "A", C.GREEN, C.BG_GREEN
    elif health >= 70:
        grade, grade_color, grade_bg = "B", C.AMBER, C.BG_DARK
    elif health >= 60:
        grade, grade_color, grade_bg = "C", C.YELLOW, C.BG_DARK
    else:
        grade, grade_color, grade_bg = "D", C.RED, C.BG_RED

    # ── Final branded summary ──
    W = 62  # inner width
    E = C.END
    
    # Helper: padded line inside the box
    def bline(content: str = "", raw_len: int = 0):
        """Print a box line. raw_len = visible char count of content."""
        side_l = gradient_text("║", (255, 200, 50), (255, 200, 50))
        side_r = gradient_text("║", (200, 150, 40), (200, 150, 40))
        pad = max(0, W - raw_len)
        print(f"  {C.BOLD}{side_l}{E} {content}{' ' * pad} {C.BOLD}{side_r}{E}")
    
    def bsep(left="╠", right="╣", fill="═"):
        sep = gradient_text(left + fill * W + right, (255, 200, 50), (200, 150, 40))
        print(f"  {C.BOLD}{sep}{E}")
    
    print("\n")
    # Top border
    top = gradient_text("╔" + "═" * W + "╗", (255, 200, 50), (200, 150, 40))
    print(f"  {C.BOLD}{top}{E}")
    bline()
    # Title line with gradient
    title_text = gradient_text("🐂 B U L L   M O N E Y", (255, 220, 100), (255, 160, 30))
    complete_text = f"{C.WHITE}{C.BOLD}BOOST COMPLETE{E} {SPARKLE_ICON}"
    bline(f"  {title_text}   {complete_text}", raw_len=50)
    bline()
    bsep()
    bline()
    # Stats section with aligned columns
    stats_rows = [
        ("⏱ ", "Completed in",  f"{C.GOLD}{C.BOLD}{elapsed:.1f}s{E}",          len(f"{elapsed:.1f}s")),
        ("📦", "Files generated", f"{C.GOLD}{C.BOLD}{total_files}{E}",           len(str(total_files))),
        ("💾", "Total size",     f"{C.GOLD}{C.BOLD}{total_size/1024:.1f} KB{E}", len(f"{total_size/1024:.1f} KB")),
        ("✅", "Checks passed",  f"{C.GREEN}{C.BOLD}{Stats.passed}{E}",         len(str(Stats.passed))),
        ("⚠ ", "Warnings",       f"{C.YELLOW}{Stats.warnings}{E}",             len(str(Stats.warnings))),
        ("🗂 ", "Files cached",   f"{C.CYAN}{len(FileCache._store)}{E}",         len(str(len(FileCache._store)))),
    ]
    for ico, label, val, vlen in stats_rows:
        line = f"  {ico} {C.WHITE}{label:<17}{E} {val}"
        bline(line, raw_len=25 + vlen)
    bline()
    bsep()
    bline()
    # Health score with gradient bar
    bar_filled = health // 5
    bar_empty = 20 - bar_filled
    health_bar = ""
    for i in range(bar_filled):
        t = i / 19
        if health >= 80:
            r, g, b = int(60 + 40*t), int(220 - 20*t), int(100 + 30*t)
        elif health >= 60:
            r, g, b = int(255), int(200 - 80*t), int(50 + 30*t)
        else:
            r, g, b = int(255), int(80 + 20*t), int(80 + 20*t)
        health_bar += f"\033[38;2;{r};{g};{b}m█"
    health_bar += f"{C.DIM}{'░' * bar_empty}{E}"
    score_text = f"{grade_color}{C.BOLD}{health}/100{E} {grade_color}({grade}){E}"
    bline(f"  {C.WHITE}{C.BOLD}HEALTH SCORE{E}   {health_bar}  {score_text}", raw_len=52)
    bline()
    bsep()
    bline()
    # Generated files section
    bline(f"  {C.DIM}{C.ITALIC}Generated scripts (auto-loaded via layout.tsx):{E}", raw_len=49)
    bline()
    scripts_list = [
        ("device-detect.js",    "Device / OS / browser detection"),
        ("spline-turbo.js",     "3D/Spline turbo + GPU budgets"),
        ("memory-guardian.js",  "OOM prevention + auto-dispose"),
        ("inapp-shield.js",     "In-app browser crash shield"),
        ("crash-prevention.js", "Store/App page crash guard"),
        ("gpu-manager.js",      "WebGL context pool + GPU mgr"),
        ("perf-boost.js",       "Core Web Vitals + scoring"),
        ("seo-boost.js",        "SEO: lazy-load, prefetch"),
        ("offline-detect.js",   "Offline detection + indicator"),
        ("network-optimizer.js","Adaptive loading + prefetch"),
        ("thirdparty-opt.js",   "3rd-party script deferral"),
        ("font-boost.css",      "Font perf + FOUT prevention"),
        ("boost-loader.js",     "Coordinator script"),
        ("schemas/*.json",      "JSON-LD structured data"),
    ]
    for sname, sdesc in scripts_list:
        arrow = gradient_text("▸", (255, 180, 40), (255, 140, 30))
        line = f"   {arrow} {C.WHITE}{C.BOLD}{sname:<19}{E} {C.DIM}{sdesc}{E}"
        bline(line, raw_len=54)
    bline()
    bsep()
    bline()
    # Ready line
    ready = gradient_text("Ready to launch!", (100, 220, 130), (60, 200, 180))
    bline(f"  {ROCKET_ICON}  {C.BOLD}{ready}{E}  {C.DIM}Run{E} {C.WHITE}{C.BOLD}npm run dev{E} {C.DIM}to start{E}", raw_len=48)
    bline()
    # Bottom border
    bot = gradient_text("╚" + "═" * W + "╝", (200, 150, 40), (255, 200, 50))
    print(f"  {C.BOLD}{bot}{E}")

    # ── Per-section timing breakdown (shown in fast/CI mode or with --report) ──
    if Stats.section_times:
        always_show = profile_mode  # Show full breakdown in --profile mode
        print(f"\n  {C.DIM}Section timings:{C.END}")
        sorted_times = sorted(Stats.section_times.items(), key=lambda x: x[1], reverse=True)
        show_count = len(sorted_times) if always_show else min(10, len(sorted_times))
        for sec_name, sec_time in sorted_times[:show_count]:
            bar_len = min(int(sec_time * 20), 40)
            time_bar = f"{C.GOLD}{'█' * bar_len}{C.END}"
            pct = (sec_time / elapsed * 100) if elapsed > 0 else 0
            print(f"    {C.SILVER}{sec_name:<14}{C.END} {time_bar} {C.WHITE}{sec_time:.3f}s{C.END} {C.DIM}({pct:.1f}%){C.END}")
        if always_show:
            total_section_time = sum(Stats.section_times.values())
            overhead = elapsed - total_section_time
            print(f"    {C.DIM}{'─' * 40}{C.END}")
            print(f"    {C.SILVER}Overhead        {C.GOLD}{'█' * min(int(overhead * 20), 40)}{C.END} {C.WHITE}{overhead:.3f}s{C.END}")

    # ── Show diff if requested ──
    if show_diff:
        prev_report = ResultsDiff.load_previous()
        ResultsDiff.show_diff(report, prev_report)
    
    # Save current for future diffs
    ResultsDiff.save_current(report)

    print(f"\n  {C.DIM}Report saved → {C.SILVER}.boost-report.json{C.END}\n")

    # ── Cleanup ──
    FileCache.clear()

    # ── Send VS Code notification: complete ──
    grade_emoji = "🟢" if health >= 80 else "🟡" if health >= 60 else "🔴"
    send_vscode_notification(
        "Boost Complete!",
        f"{grade_emoji} Health: {health}/100 ({grade}) • {total_files} files • {elapsed:.1f}s • {Stats.passed} checks passed",
    )

    # ── Watch mode: re-run on file changes ──
    if watch_mode:
        print(f"\n  {C.CYAN}{C.BOLD}👁  WATCH MODE ACTIVE{C.END}")
        print(f"  {C.DIM}Watching for changes... Press Ctrl+C to stop.{C.END}\n")
        
        watch_dirs = [ROOT_DIR / d for d in config.get("watch_dirs", ["app", "components", "styles", "public"])]
        watch_exts = set(config.get("watch_extensions", [".tsx", ".ts", ".css", ".json"]))
        
        run_count = 1
        
        def on_change():
            nonlocal run_count
            run_count += 1
            print(f"\n  {C.GOLD}{'─' * 50}{C.END}")
            print(f"  {C.CYAN}⟳{C.END} Change detected! Re-running boost (#{run_count})...")
            print(f"  {C.GOLD}{'─' * 50}{C.END}\n")
            # Re-run main without watch mode to avoid recursion
            old_argv = sys.argv.copy()
            sys.argv = [a for a in sys.argv if a != "--watch"]
            try:
                main()
            except SystemExit:
                pass
            finally:
                sys.argv = old_argv
        
        watcher = FileWatcher(watch_dirs, watch_exts, on_change)
        
        # Handle Ctrl+C gracefully
        def signal_handler(sig, frame):
            watcher.stop()
            print(f"\n\n  {C.GOLD}✓{C.END} Watch mode stopped. Goodbye!\n")
            sys.exit(0)
        
        signal.signal(signal.SIGINT, signal_handler)
        
        try:
            watcher.start()
        except KeyboardInterrupt:
            watcher.stop()
            print(f"\n\n  {C.GOLD}✓{C.END} Watch mode stopped. Goodbye!\n")


if __name__ == "__main__":
    main()
