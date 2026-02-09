#!/usr/bin/env python3
"""Quick fix: revert broken !identifier → identifier! conversions in .js files."""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# Pattern: identifier! in JS expression contexts
# Matches: word! followed by ), &&, ||, ?, whitespace, .current, etc.
# This is the inverse of what clean.py's important-modifier fix does
BROKEN_NEGATION = re.compile(
    r'(?<=[\s(&|,?:{}])(\w+)!(?=\s*[)&|?.,:;\s{}])'
)

# Only fix in JS expression contexts, not inside className strings
# We'll process line by line and skip lines that look like Tailwind classes

def is_likely_tailwind_context(line: str) -> bool:
    """Check if a line is a Tailwind className context."""
    stripped = line.strip()
    # Lines with className= or class= containing hyphens are likely Tailwind
    if 'className' in line and '-' in line:
        return True
    return False

def fix_file(fpath: Path) -> int:
    content = fpath.read_text(encoding='utf-8', errors='ignore')
    
    # Specific known broken patterns in JS contexts
    replacements = [
        # Logical negation before identifiers followed by JS operators
        (r'(\s)(\w+)!\s*\)', r'\1!\2)'),          # word!) → !word)
        (r'(\s)(\w+)!\s*&&', r'\1!\2 &&'),         # word! && → !word &&
        (r'(\s)(\w+)!\s*\|\|', r'\1!\2 ||'),       # word! || → !word ||
        (r'(\s)(\w+)!\s*\?', r'\1!\2 ?'),          # word! ? → !word ?
        (r'\{(\w+)!\s*&&', r'{!\1 &&'),             # {word! && → {!word &&
        (r'(\s)(\w+)!\.(\w+)', r'\1!\2.\3'),        # word!.prop → !word.prop
        (r'(\s)(\w+)!\s*,', r'\1!\2,'),             # word!, → !word,
        (r'(\s)(\w+)!\s*;', r'\1!\2;'),             # word!; → !word;
        (r'(\s)(\w+)!\s*\n', r'\1!\2\n'),           # word!\n → !word\n
        (r':(\s*)(\w+)!\s*,', r':\1!\2,'),          # : word!, → : !word,
    ]
    
    count = 0
    for pattern, repl in replacements:
        new_content, n = re.subn(pattern, repl, content)
        if n:
            content = new_content
            count += n
    
    if count:
        fpath.write_text(content, encoding='utf-8')
    return count


target = ROOT / 'lib' / 'spline-wrapper.js'
if target.exists():
    n = fix_file(target)
    print(f'Fixed {n} broken negations in lib/spline-wrapper.js')
else:
    print('File not found')

# Also scan for any other affected .js files
total = 0
for fpath in ROOT.rglob('*.js'):
    if any(d in fpath.parts for d in ('node_modules', '.next', '.git')):
        continue
    n = fix_file(fpath)
    if n:
        print(f'Fixed {n} in {fpath.relative_to(ROOT)}')
        total += n

print(f'\nTotal: {total} fixes across all .js files')
