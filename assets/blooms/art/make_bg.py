# Draws the soft floral backgrounds in the Blooms by Bincy palette (no installs needed, plain Python 3):
#   python3 assets/blooms/art/make_bg.py assets/blooms/art/bouquets-bg.svg                 full picture (computers and tablets)
#   python3 assets/blooms/art/make_bg.py assets/blooms/art/bouquets-bg-corner.svg corner   top-right flowers only (phones)
import math, sys
out = sys.argv[1]
CORNER = len(sys.argv) > 2 and sys.argv[2] == 'corner'  # phones: only the top-right cluster, see-through, no edges
BLUE, BLUSH, MIST, LEAF, SKY, WHITE = '#5B7895', '#E9B9C4', '#F2F5F8', '#9BB08C', '#DCE6EF', '#FFFFFF'
W, H = 1600, 900
parts = []
f = lambda v: f'{v:.1f}'.rstrip('0').rstrip('.')

def flower(cx, cy, r, petal, centre, rot=0, op=1):
    s = f'<g transform="rotate({f(rot)} {f(cx)} {f(cy)})" opacity="{op}">'
    for k in range(6):
        a = k * math.pi / 3
        s += f'<circle cx="{f(cx + math.cos(a) * r * .56)}" cy="{f(cy + math.sin(a) * r * .56)}" r="{f(r * .44)}" fill="{petal}"/>'
    s += f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r * .3)}" fill="{centre}"/></g>'
    parts.append(s)

def leaf(x, y, length, angle, op=.85, col=LEAF):
    w = length * .36
    parts.append(f'<path d="M0 0Q{f(w)} {f(-length/2)} 0 {f(-length)}Q{f(-w)} {f(-length/2)} 0 0Z" fill="{col}" opacity="{op}" transform="translate({f(x)} {f(y)}) rotate({f(angle)})"/>')

def stem(d, op=.55):
    parts.append(f'<path d="{d}" fill="none" stroke="{LEAF}" stroke-width="3" stroke-linecap="round" opacity="{op}"/>')

# background wash and soft shapes
if not CORNER: parts.append(f'<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{MIST}"/><stop offset="1" stop-color="#E8EFF6"/></linearGradient></defs>')
if not CORNER: parts.append(f'<rect width="{W}" height="{H}" fill="url(#g)"/>')
if not CORNER: parts.append(f'<ellipse cx="1390" cy="170" rx="420" ry="330" fill="{SKY}" opacity=".75"/>')
if not CORNER: parts.append(f'<ellipse cx="1520" cy="860" rx="330" ry="230" fill="{BLUSH}" opacity=".22"/>')
if not CORNER: parts.append(f'<ellipse cx="90" cy="860" rx="320" ry="240" fill="{SKY}" opacity=".6"/>')
if not CORNER: parts.append(f'<ellipse cx="40" cy="60" rx="220" ry="160" fill="{BLUSH}" opacity=".16"/>')

# top-right cluster
stem('M1600 420C1500 360 1440 300 1400 190')
stem('M1600 300C1540 250 1520 180 1530 90')
for x, y, l, a in [(1470, 330, 70, -58), (1430, 260, 60, -20), (1525, 215, 58, 25), (1545, 150, 50, -30), (1410, 215, 48, -70)]: leaf(x, y, l, a)
flower(1500, 110, 135, BLUSH, WHITE, 8)
flower(1330, 70, 66, WHITE, BLUSH, 20)
flower(1395, 210, 44, BLUSH, BLUE, -12)
flower(1590, 280, 58, WHITE, BLUSH, 5)
flower(1250, 175, 22, BLUSH, WHITE, 0, .9)

# bottom-left cluster
stem('M0 640C70 690 120 760 140 900')
stem('M0 760C90 770 170 820 230 900')
for x, y, l, a in [(60, 700, 66, 60), (115, 770, 58, 20), (175, 835, 54, 70), (30, 640, 50, 95)]: leaf(x, y, l, a)
flower(70, 860, 120, BLUSH, WHITE, -10)
flower(240, 880, 62, WHITE, BLUSH, 15)
flower(10, 700, 46, WHITE, BLUSH)

# bottom-right sprig
stem('M1600 760C1520 780 1460 830 1430 900', .45)
for x, y, l, a in [(1530, 790, 52, -60), (1475, 835, 46, -25)]: leaf(x, y, l, a, .7)
flower(1560, 880, 70, BLUSH, WHITE, 12, .9)

# scattered small flowers and dots, kept away from the text on the left
for x, y, r, p, c, op in [(1180, 300, 16, BLUSH, WHITE, .8), (1120, 760, 20, WHITE, BLUSH, .9), (860, 850, 14, BLUSH, WHITE, .7),
                          (720, 60, 16, WHITE, BLUSH, .9), (980, 40, 12, BLUSH, WHITE, .7), (380, 40, 14, BLUSH, WHITE, .6)]:
    if not CORNER: flower(x, y, r, p, c, 0, op)  # the phone version leaves these out: one would sit on the logo
for x, y, r, col, op in [(1060, 120, 5, BLUSH, .8), (900, 120, 4, LEAF, .7), (1240, 560, 5, BLUSH, .7), (560, 880, 4, LEAF, .7), (300, 150, 4, BLUSH, .6), (1000, 880, 5, LEAF, .6)]:
    parts.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{col}" opacity="{op}"/>')

box = '1110 0 490 400' if CORNER else f'0 0 {W} {H}'
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{box}" preserveAspectRatio="xMidYMid slice"><title>Blooms by Bincy flowers</title>{"".join(parts)}</svg>\n'
open(out, 'w').write(svg)
print(len(svg), 'bytes')
