# The figures of docs/03-specs/ui-kit.md §4, without node_modules (README.md). Run from the repository root:
#   python3 docs/04-process/prompts/2026-10-04-T-15d/ui-kit-figures/figures.py
# Mirrors figures.ts line for line. It reads prisma/data.json, the CATEGORIES and THEMES arrays of
# src/shared/enums.ts and the theme hex values of docs/02-architecture/design-tokens.md (the seed's
# hex -> theme map, src/server/seed.ts THEME_BY_HEX, is held to that table by tests/unit/seed.test.ts).
import json
import re

data = json.load(open("prisma/data.json"))
enums = open("src/shared/enums.ts").read()


def array(name):
    body = re.search(r"export const " + name + r" = \[(.*?)\] as const", enums, re.S).group(1)
    return re.findall(r'"([^"]+)"', body)


CATEGORIES, THEMES = array("CATEGORIES"), array("THEMES")
tokens = open("docs/02-architecture/design-tokens.md").read()
THEME_BY_HEX = {}
for name, hx in re.findall(r"\| `--color-[a-z-]+` \| ([A-Za-z ]+) \| `(#[0-9A-F]{6})` \|[^|]*\|[^|]*theme", tokens):
    THEME_BY_HEX[hx] = name.strip()
cents = lambda d: round(d * 100)
budgets = [dict(category=b["category"], theme=THEME_BY_HEX[b["theme"].upper()], maximum=cents(b["maximum"])) for b in data["budgets"]]
pots = [dict(name=p["name"], theme=THEME_BY_HEX[p["theme"].upper()], target=cents(p["target"]), total=cents(p["total"])) for p in data["pots"]]


def H(s):
    print("\n=== " + s + " ===")


H("SEED RECORDS")
print("budgets:", len(budgets), "|", ", ".join(b["category"] + " " + b["theme"] + " " + str(b["maximum"]) for b in budgets))
print("pots:", len(pots), "|", ", ".join(p["name"] + " " + p["theme"] + " target " + str(p["target"]) + " total " + str(p["total"]) for p in pots))

H("ALREADY USED (add forms)")
used_cats = [b["category"] for b in budgets]
budget_themes = [b["theme"] for b in budgets]
pot_themes = [p["theme"] for p in pots]
free = lambda all_, used: [x for x in all_ if x not in used]
print("categories used:", len(used_cats), ", ".join(used_cats))
print("categories free:", len(free(CATEGORIES, used_cats)), ", ".join(free(CATEGORIES, used_cats)))
print("budget themes used:", len(budget_themes), ", ".join(budget_themes))
print("budget themes free:", len(free(THEMES, budget_themes)), "first free:", free(THEMES, budget_themes)[0])
print("pot themes used:", len(pot_themes), ", ".join(pot_themes))
print("pot themes free:", len(free(THEMES, pot_themes)), "first free:", free(THEMES, pot_themes)[0])
print("first free category:", free(CATEGORIES, used_cats)[0])

H("ALREADY USED (edit forms: the record's own value stays selectable)")
for b in budgets:
    others = [x for x in budgets if x is not b]
    print("edit budget " + b["category"] + ": disabled categories " + str(len(others)) + " (" + ", ".join(x["category"] for x in others) + "), disabled themes " + str(len(others)) + " (" + ", ".join(x["theme"] for x in others) + ")")
for p in pots:
    others = [x for x in pots if x is not p]
    print("edit pot " + p["name"] + ": disabled themes " + str(len(others)) + " (" + ", ".join(x["theme"] for x in others) + ")")

H("DELETE DIALOG TITLES (the design's pattern, curly quotes U+2018 U+2019)")
print(" | ".join("Delete ‘" + b["category"] + "’?" for b in budgets))
print(" | ".join("Delete ‘" + p["name"] + "’?" for p in pots))
print("longest seed pot name:", max(len(p["name"]) for p in pots), "characters; pot name limit 30")

H("AMOUNT GRAMMAR (the spec's reading of US-15 AC2, written here by hand; no repository code yet)")
MAX = 99_999_999_999
# A grouped number starts with 1-9, so "0,500" is refused rather than read as 500 dollars (ui-kit.md 2.5, v0.4).
SHAPE = re.compile(r"^([0-9]+|[1-9][0-9]{0,2}(?:,[0-9]{3})+)?(\.[0-9]{1,2})?$")


def parse_amount(text):
    # figures.ts trims with String.prototype.trim, which removes every Unicode space; this explicit
    # list is narrower, and no input below depends on the difference (ui-kit review 1, notes).
    t = text.strip(" \t\n\r\f\v   ﻿")
    if t == "":
        return "required"
    negative = t.startswith("-")
    if negative:
        t = t[1:]
    if t.startswith("$"):
        t = t[1:]
    m = SHAPE.match(t)
    if not m or not re.search(r"[0-9]", t):
        return "invalid_format"
    whole = (m.group(1) or "0").replace(",", "")
    frac = (m.group(2) or ".00")[1:].ljust(2, "0")
    c = int(whole) * 100 + int(frac)
    if negative or c == 0:
        return "too_small"
    if c > MAX:
        return "too_large"
    return str(c) + " cents"


inputs = [
    "", "   ", "0.01", "1", "42", " 42 ", "007", "75.5", "75.50", ".5", "5.", "$1,234.50", "1,234.5", "1234.50",
    "12,345,678", "$999,999,999.99", "999999999.99", "1,000,000,000", "1000000000", "99999999999999999999",
    "0", "0.00", "$0", "-5", "-$5", "-0", "$-5", "1.234", "1,23", "1,2345", "12,34.5", "0,500", "0,123", "01,234", "$ 5", "$$5", "$", "-",
    "1e3", "0x10", "Infinity", "NaN", "5 000", "５", "−5", "USD 5",
]
for s in inputs:
    print(json.dumps(s, ensure_ascii=False) + " -> " + parse_amount(s))

H("PRE-FILL (edit forms: whole dollars as digits, otherwise two decimals; no $ and no separators)")


def prefill(c):
    return str(c // 100) if c % 100 == 0 else str(c // 100) + "." + str(c % 100).rjust(2, "0")


def format_money(c):
    return ("-" if c < 0 else "") + "$" + "{:,}".format(abs(c) // 100) + "." + str(abs(c) % 100).rjust(2, "0")


print("budget maximums:", ", ".join(prefill(b["maximum"]) for b in budgets))
print("pot targets:", ", ".join(prefill(p["target"]) for p in pots))
for c in [1, 7550, 123450, 99_999_999_999]:
    print(str(c) + " cents -> " + json.dumps(prefill(c)) + " -> parses back to " + parse_amount(prefill(c)) + " | formatMoney " + format_money(c))

H("CONTRAST (WCAG 2.1 relative luminance; opacity composited over white)")
hexrgb = lambda h: [int(h[i:i + 2], 16) for i in (1, 3, 5)]


def lin(c):
    s = c / 255
    return s / 12.92 if s <= 0.04045 else ((s + 0.055) / 1.055) ** 2.4


lum = lambda rgb: 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2])


def ratio(a, b):
    x, y = lum(a), lum(b)
    return (max(x, y) + 0.05) / (min(x, y) + 0.05)


def over(fg, a, bg):
    # JS Math.round: half up (no value here lands on .5 exactly)
    return [int(a * f + (1 - a) * b + 0.5) for f, b in zip(fg, bg)]


W, G900, G500, G300, B500, RED = (hexrgb(h) for h in ["#FFFFFF", "#201F24", "#696868", "#B3B3B3", "#98908B", "#C94736"])
pairs = [
    ("grey-300 on white (the … icon at rest, as exported)", G300, W),
    ("grey-500 on white", G500, W),
    ("grey-900 on white", G900, W),
    ("beige-500 on white (the $ prefix, as exported)", B500, W),
    ("red on white (Delete menu item)", RED, W),
    ("red at 70 % on white (Delete menu item, hover, as exported)", over(RED, 0.7, W), W),
    ("white on red (Yes, Confirm Deletion)", W, RED),
    ("white on red at 80 % (Yes, Confirm Deletion, hover)", W, over(RED, 0.8, W)),
    ("white on grey-900 (primary button)", W, G900),
    ("white on grey-500 (primary button, hover)", W, G500),
]
for name, a, b in pairs:
    print(name + ": " + format(ratio(a, b), ".2f") + ":1")
