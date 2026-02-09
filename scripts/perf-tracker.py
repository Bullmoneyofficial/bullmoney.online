#!/usr/bin/env python3
"""
██████╗ ██╗   ██╗██╗     ██╗     ███╗   ███╗ ██████╗ ███╗   ██╗███████╗██╗   ██╗
██╔══██╗██║   ██║██║     ██║     ████╗ ████║██╔═══██╗████╗  ██║██╔════╝╚██╗ ██╔╝
██████╔╝██║   ██║██║     ██║     ██╔████╔██║██║   ██║██╔██╗ ██║█████╗   ╚████╔╝
██╔══██╗██║   ██║██║     ██║     ██║╚██╔╝██║██║   ██║██║╚██╗██║██╔══╝    ╚██╔╝
██████╔╝╚██████╔╝███████╗███████╗██║ ╚═╝ ██║╚██████╔╝██║ ╚████║███████╗   ██║
╚═════╝  ╚═════╝ ╚══════╝╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝   ╚═╝

  📈  PERF TRACKER  –  Lighthouse scores over time, per route.

    python3 scripts/perf-tracker.py                    ← run all routes
    python3 scripts/perf-tracker.py --route /           ← single route
    python3 scripts/perf-tracker.py --route /store      ← specific route
    python3 scripts/perf-tracker.py --history           ← show score history
    python3 scripts/perf-tracker.py --desktop           ← desktop preset
    python3 scripts/perf-tracker.py --port 3001         ← custom port
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from datetime import datetime
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
HISTORY_FILE = ROOT / "perf-history.json"

# ═══════════════════════════════════════════════════════════════════════════
# ROUTES TO TEST
# ═══════════════════════════════════════════════════════════════════════════

# Key routes that matter most for user experience
DEFAULT_ROUTES = [
    "/",
    "/store",
    "/login",
    "/register",
    "/about",
    "/community",
    "/course",
    "/Blogs",
    "/trading-showcase",
]


# ═══════════════════════════════════════════════════════════════════════════
# LIGHTHOUSE RUNNER
# ═══════════════════════════════════════════════════════════════════════════

def has_lighthouse() -> bool:
    try:
        result = subprocess.run(
            ["npx", "lighthouse", "--version"],
            capture_output=True, text=True, timeout=15, cwd=str(ROOT),
        )
        return result.returncode == 0
    except Exception:
        return False


def run_lighthouse(
    url: str,
    preset: str = "mobile",
    output_path: str | None = None,
) -> dict | None:
    """Run Lighthouse on a URL and return the JSON result."""
    cmd = [
        "npx", "lighthouse", url,
        "--only-categories=performance,accessibility,best-practices,seo",
        "--output=json",
        '--chrome-flags=--headless --no-sandbox --disable-gpu',
        "--quiet",
    ]

    if preset == "desktop":
        cmd.append("--preset=desktop")

    if output_path:
        cmd.extend(["--output-path", output_path])

    try:
        result = subprocess.run(
            cmd, cwd=str(ROOT), capture_output=True, text=True, timeout=120,
        )

        if result.returncode != 0:
            # Try to extract meaningful error
            err = result.stderr.strip().split('\n')[-1] if result.stderr else "Unknown error"
            return {"error": err}

        # Parse JSON output
        if output_path:
            with open(output_path, 'r') as f:
                return json.load(f)
        else:
            return json.loads(result.stdout)

    except subprocess.TimeoutExpired:
        return {"error": "Lighthouse timed out (2 minutes)"}
    except json.JSONDecodeError:
        return {"error": "Failed to parse Lighthouse output"}
    except Exception as e:
        return {"error": str(e)}


def extract_scores(lh_result: dict) -> dict:
    """Extract key scores from Lighthouse JSON output."""
    if "error" in lh_result:
        return {"error": lh_result["error"]}

    categories = lh_result.get("categories", {})
    audits = lh_result.get("audits", {})

    scores = {
        "performance": round((categories.get("performance", {}).get("score", 0) or 0) * 100),
        "accessibility": round((categories.get("accessibility", {}).get("score", 0) or 0) * 100),
        "best-practices": round((categories.get("best-practices", {}).get("score", 0) or 0) * 100),
        "seo": round((categories.get("seo", {}).get("score", 0) or 0) * 100),
    }

    # Core Web Vitals
    metrics = {}
    metric_keys = {
        "first-contentful-paint": "FCP",
        "largest-contentful-paint": "LCP",
        "total-blocking-time": "TBT",
        "cumulative-layout-shift": "CLS",
        "speed-index": "SI",
        "interactive": "TTI",
    }

    for audit_key, short_name in metric_keys.items():
        audit = audits.get(audit_key, {})
        val = audit.get("numericValue")
        if val is not None:
            if short_name == "CLS":
                metrics[short_name] = round(val, 3)
            else:
                metrics[short_name] = round(val)  # milliseconds

    scores["metrics"] = metrics
    return scores


# ═══════════════════════════════════════════════════════════════════════════
# HISTORY
# ═══════════════════════════════════════════════════════════════════════════

def load_history() -> list[dict]:
    if HISTORY_FILE.exists():
        try:
            return json.loads(HISTORY_FILE.read_text())
        except Exception:
            return []
    return []


def save_history(history: list[dict]):
    HISTORY_FILE.write_text(json.dumps(history, indent=2))


def add_to_history(route: str, scores: dict, preset: str):
    history = load_history()
    entry = {
        "timestamp": datetime.now().isoformat(),
        "route": route,
        "preset": preset,
        **scores,
    }
    history.append(entry)

    # Keep last 500 entries
    if len(history) > 500:
        history = history[-500:]

    save_history(history)


def get_previous_score(route: str, preset: str) -> dict | None:
    """Get the most recent previous score for comparison."""
    history = load_history()
    for entry in reversed(history):
        if entry.get("route") == route and entry.get("preset") == preset:
            return entry
    return None


# ═══════════════════════════════════════════════════════════════════════════
# DISPLAY
# ═══════════════════════════════════════════════════════════════════════════

def score_color(score: int) -> str:
    if score >= 90:
        return C.GREEN
    elif score >= 50:
        return C.YELLOW
    return C.RED


def score_icon(score: int) -> str:
    if score >= 90:
        return "🟢"
    elif score >= 50:
        return "🟡"
    return "🔴"


def delta_str(current: int, previous: int | None) -> str:
    if previous is None:
        return ""
    diff = current - previous
    if diff > 0:
        return f"  {C.GREEN}↑{diff}{C.RESET}"
    elif diff < 0:
        return f"  {C.RED}↓{abs(diff)}{C.RESET}"
    return f"  {C.DIM}={C.RESET}"


def metric_status(name: str, value: float) -> str:
    """Color-code a Core Web Vital metric."""
    thresholds = {
        "FCP": (1800, 3000),    # ms
        "LCP": (2500, 4000),    # ms
        "TBT": (200, 600),      # ms
        "CLS": (0.1, 0.25),     # score
        "SI":  (3400, 5800),    # ms
        "TTI": (3800, 7300),    # ms
    }

    good, poor = thresholds.get(name, (999999, 999999))
    if value <= good:
        color = C.GREEN
    elif value <= poor:
        color = C.YELLOW
    else:
        color = C.RED

    if name == "CLS":
        return f"{color}{value:.3f}{C.RESET}"
    return f"{color}{value:,.0f}ms{C.RESET}"


def print_route_result(route: str, scores: dict, preset: str, previous: dict | None):
    if "error" in scores:
        print(f"\n  {C.RED}✖{C.RESET}  {route}  —  {C.RED}{scores['error']}{C.RESET}")
        return

    print(f"\n  {C.GOLD_B}{route}{C.RESET}  {C.DIM}({preset}){C.RESET}")
    print(f"  {C.DARK}{'─' * 50}{C.RESET}")

    # Category scores
    for cat in ["performance", "accessibility", "best-practices", "seo"]:
        score = scores.get(cat, 0)
        prev = previous.get(cat) if previous else None
        icon = score_icon(score)
        color = score_color(score)
        delta = delta_str(score, prev)

        label = cat.replace("-", " ").title()
        bar_len = score // 4
        bar = f"{color}{'█' * bar_len}{C.DARK}{'░' * (25 - bar_len)}{C.RESET}"
        print(f"    {icon} {color}{C.BOLD}{score:3d}{C.RESET}  {bar}  {label}{delta}")

    # Core Web Vitals
    metrics = scores.get("metrics", {})
    if metrics:
        print(f"\n    {C.AMBER}Core Web Vitals:{C.RESET}")
        for name in ["LCP", "FCP", "TBT", "CLS", "SI", "TTI"]:
            if name in metrics:
                val = metrics[name]
                status = metric_status(name, val)
                print(f"      {C.DIM}{name:3s}{C.RESET}  {status}")


def print_history_report():
    history = load_history()
    if not history:
        print(f"\n  {C.YELLOW}ℹ{C.RESET}  No history yet. Run a scan first.\n")
        return

    print()
    print(DIVIDER)
    print(f"  {C.GOLD_B}📈  PERFORMANCE HISTORY{C.RESET}")
    print(DIVIDER)

    # Group by route
    by_route: dict[str, list] = {}
    for entry in history:
        route = entry.get("route", "/")
        by_route.setdefault(route, []).append(entry)

    for route, entries in sorted(by_route.items()):
        print(f"\n  {C.GOLD_B}{route}{C.RESET}  ({len(entries)} runs)")
        print(f"  {C.DARK}{'─' * 50}{C.RESET}")

        # Show last 5 entries as a sparkline
        recent = entries[-8:]
        perf_scores = [e.get("performance", 0) for e in recent]

        # Mini chart
        chart = ""
        for score in perf_scores:
            color = score_color(score)
            # Map 0-100 to block heights
            blocks = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"]
            idx = min(int(score / 12.5), 7)
            chart += f"{color}{blocks[idx]}{C.RESET}"

        timestamps = [e.get("timestamp", "")[:10] for e in recent]
        latest = recent[-1]
        perf = latest.get("performance", 0)

        print(f"    Performance: {chart}  {score_color(perf)}{perf}{C.RESET}")
        print(f"    {C.DIM}Last: {timestamps[-1] if timestamps else 'n/a'}"
              f"  │  Best: {max(perf_scores)}  │  Worst: {min(perf_scores)}{C.RESET}")

        # Trend
        if len(perf_scores) >= 2:
            trend = perf_scores[-1] - perf_scores[0]
            if trend > 5:
                print(f"    {C.GREEN}↑ Improving (+{trend} since first run){C.RESET}")
            elif trend < -5:
                print(f"    {C.RED}↓ Regressing ({trend} since first run){C.RESET}")
            else:
                print(f"    {C.DIM}→ Stable{C.RESET}")

    print()

    # Overall summary
    all_perf = [e.get("performance", 0) for e in history if e.get("performance")]
    if all_perf:
        avg = sum(all_perf) / len(all_perf)
        print(f"  {C.AMBER}Overall:{C.RESET}  "
              f"avg {score_color(int(avg))}{avg:.0f}{C.RESET}  │  "
              f"best {C.GREEN}{max(all_perf)}{C.RESET}  │  "
              f"worst {C.RED}{min(all_perf)}{C.RESET}  │  "
              f"{len(history)} total runs")
    print()


# ═══════════════════════════════════════════════════════════════════════════
# SERVER CHECK
# ═══════════════════════════════════════════════════════════════════════════

def check_server(port: int) -> bool:
    """Check if the dev server is running on the given port."""
    import urllib.request
    try:
        urllib.request.urlopen(f"http://localhost:{port}", timeout=5)
        return True
    except Exception:
        return False


# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="🐂 Bullmoney Performance Tracker")
    parser.add_argument("--route", type=str, default=None,
                        help="Test a specific route (e.g., / or /store)")
    parser.add_argument("--desktop", action="store_true",
                        help="Use desktop preset (default: mobile)")
    parser.add_argument("--history", action="store_true",
                        help="Show performance history")
    parser.add_argument("--port", type=int, default=3000,
                        help="Dev server port (default: 3000)")
    parser.add_argument("--save", action="store_true", default=True,
                        help="Save results to history (default: true)")
    parser.add_argument("--no-save", action="store_true",
                        help="Don't save results to history")
    args = parser.parse_args()

    os.system('cls' if os.name == 'nt' else 'clear')
    print(f"\n{C.GOLD}  📈  BULLMONEY PERFORMANCE TRACKER{C.RESET}")

    if args.history:
        print_history_report()
        return

    # Check prerequisites
    if not has_lighthouse():
        print(f"\n  {C.RED}✖{C.RESET}  Lighthouse not found. Install: {C.CYAN}npm install -g lighthouse{C.RESET}")
        print(f"     Or it will use npx (slower first run).\n")

    preset = "desktop" if args.desktop else "mobile"
    base_url = f"http://localhost:{args.port}"

    # Check server
    print(f"\n  {C.DIM}Checking {base_url}…{C.RESET}", end="", flush=True)
    if not check_server(args.port):
        print(f"\r  {C.RED}✖{C.RESET}  Server not running on port {args.port}")
        print(f"     Start it with: {C.CYAN}npm run dev{C.RESET}")
        print(f"     Or specify port: {C.CYAN}--port 3001{C.RESET}\n")
        return
    print(f"\r  {C.GREEN}✔{C.RESET}  Server running on port {args.port}")

    # Determine routes
    routes = [args.route] if args.route else DEFAULT_ROUTES

    print()
    print(DIVIDER)
    print(f"  {C.GOLD_B}🔍  SCANNING {len(routes)} ROUTE{'S' if len(routes) > 1 else ''}  "
          f"({preset}){C.RESET}")
    print(DIVIDER)

    all_scores = []
    t0 = time.time()

    for i, route in enumerate(routes):
        url = f"{base_url}{route}"
        progress = f"[{i + 1}/{len(routes)}]"
        print(f"\n  {C.CYAN}{progress}{C.RESET}  Auditing {C.GOLD}{route}{C.RESET}…", end="", flush=True)

        # Get previous score for comparison
        previous = get_previous_score(route, preset)

        # Run Lighthouse
        result = run_lighthouse(url, preset=preset)
        scores = extract_scores(result) if result else {"error": "No result"}

        print(f"\r  {C.GREEN}✔{C.RESET}  ", end="")

        # Print result
        print_route_result(route, scores, preset, previous)

        # Save to history
        if not args.no_save and "error" not in scores:
            add_to_history(route, scores, preset)

        all_scores.append({"route": route, **scores})

    elapsed = time.time() - t0

    # Summary
    print()
    print(DIVIDER)
    print(f"  {C.GOLD_B}📊  SUMMARY{C.RESET}")
    print(DIVIDER)

    successful = [s for s in all_scores if "error" not in s]
    if successful:
        perf_scores = [s["performance"] for s in successful]
        avg_perf = sum(perf_scores) / len(perf_scores)

        print(f"\n  Average Performance: {score_color(int(avg_perf))}{C.BOLD}{avg_perf:.0f}{C.RESET}")

        best = max(successful, key=lambda x: x["performance"])
        worst = min(successful, key=lambda x: x["performance"])

        print(f"  Best:  {C.GREEN}{best['performance']}{C.RESET}  {best['route']}")
        print(f"  Worst: {C.RED}{worst['performance']}{C.RESET}  {worst['route']}")

        # Flag routes needing attention
        poor = [s for s in successful if s["performance"] < 50]
        if poor:
            print(f"\n  {C.RED}🚨  {len(poor)} route(s) below 50 — needs immediate attention:{C.RESET}")
            for s in poor:
                print(f"    {C.RED}●{C.RESET}  {s['route']}  ({s['performance']})")

    failed = [s for s in all_scores if "error" in s]
    if failed:
        print(f"\n  {C.YELLOW}⚠{C.RESET}  {len(failed)} route(s) failed to audit")

    print(f"\n  {C.DIM}Completed in {elapsed:.1f}s  │  Results saved to perf-history.json{C.RESET}")
    print(f"  {C.DIM}View trends: python3 scripts/perf-tracker.py --history{C.RESET}")
    print()


if __name__ == "__main__":
    main()
