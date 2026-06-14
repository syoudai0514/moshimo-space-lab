#!/usr/bin/env python3
# もしも宇宙ラボ — 掴み動画(縦9:16)を生成する。
# アプリと同じN体重力(2体近似)で「太陽系が公転 → 太陽が消える → 惑星が接線方向へ
# 一斉に飛び去る」を描き、テキストを載せて mp4 にエンコードする。
import math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import imageio.v2 as imageio

W, H = 720, 1280
FPS = 30
CALM_FRAMES = 36          # 約1.2秒ふつうに公転(溜め)
TOTAL = 192               # 約6.4秒
BANG = CALM_FRAMES
cx, cy = W / 2, H * 0.45
SCALE = 64.0              # 1AU = 64px
KY = 0.60                 # 俯瞰の縦つぶし
G = 4 * math.pi ** 2

random.seed(7)
np.random.seed(7)

JP = lambda s: ImageFont.truetype('/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf', s)
LAT = lambda s: ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', s)

# 惑星: key, 軌道半径AU, 初期位相, 色, 表示半径px
PLANETS = [
    ('mercury', 0.387, 4.40, (170, 150, 138), 4),
    ('venus',   0.723, 1.85, (235, 200, 128), 7),
    ('earth',   1.000, 0.00, (90, 160, 222), 7),
    ('mars',    1.524, 5.60, (205, 95, 65), 5),
    ('jupiter', 5.203, 2.95, (222, 188, 146), 14),
]

class Body:
    def __init__(self, a, ph, color, size):
        self.color = np.array(color, float)
        self.size = size
        v = math.sqrt(G * 1.0 / a)
        self.pos = np.array([math.cos(ph) * a, math.sin(ph) * a])
        self.vel = np.array([-math.sin(ph) * v, math.cos(ph) * v])
        self.trail = []

bodies = [Body(a, ph, c, s) for (_, a, ph, c, s) in PLANETS]

def step(msun, years, sub=8):
    dt = years / sub
    for _ in range(sub):
        for b in bodies:
            if msun:
                r = b.pos; d = math.hypot(r[0], r[1]) + 1e-6
                acc = -G * msun * r / d ** 3
            else:
                acc = np.zeros(2)
            b.vel = b.vel + acc * (dt / 2)
            b.pos = b.pos + b.vel * dt
            if msun:
                r = b.pos; d = math.hypot(r[0], r[1]) + 1e-6
                acc = -G * msun * r / d ** 3
            else:
                acc = np.zeros(2)
            b.vel = b.vel + acc * (dt / 2)

def to_screen(p):
    return (cx + p[0] * SCALE, cy + p[1] * SCALE * KY)

# 背景の星(固定)
stars = np.zeros((H, W, 3), np.uint8)
sd = ImageDraw.Draw(Image.fromarray(stars))
star_img = Image.fromarray(stars)
sdraw = ImageDraw.Draw(star_img)
for _ in range(170):
    x, y = random.randint(0, W - 1), random.randint(0, H - 1)
    b = random.randint(40, 150)
    sdraw.ellipse([x, y, x + 1, y + 1], fill=(b, b, min(255, b + 30)))
stars = np.array(star_img, np.float32)

def draw_trail(draw, pts, color, width, fade=0.18):
    n = len(pts)
    for i in range(1, n):
        f = fade + (1 - fade) * (i / n)        # 古いほど暗く
        col = tuple(int(c * f) for c in color)
        draw.line([pts[i - 1], pts[i]], fill=col, width=width)

def add(a, b):
    return np.clip(a + b, 0, 255)

def center_text(draw, parts, font, y, alpha=255):
    # parts: [(text, (r,g,b)), ...] を横に並べて中央寄せ
    widths = [draw.textlength(t, font=font) for t, _ in parts]
    x = (W - sum(widths)) / 2
    for (t, c), w in zip(parts, widths):
        draw.text((x + 2, y + 3), t, font=font, fill=(0, 0, 0, int(alpha * 0.55)))
        draw.text((x, y), t, font=font, fill=c + (alpha,))
        x += w

f_hook = JP(48)
f_wow = LAT(96)
f_brand = JP(30)
f_url = LAT(22)

frames = []
for fi in range(TOTAL):
    # --- 物理を進める ---
    if fi < BANG:
        step(1.0, 0.010)            # 溜め: ふつうに公転
        msun_alive = True
    else:
        if fi == BANG:
            msun_alive = False      # 太陽消滅
        step(0.0, 0.016)            # 崩壊: 直進して飛び去る
    for b in bodies:
        b.trail.append(to_screen(b.pos))
        if len(b.trail) > 220:
            b.trail.pop(0)

    # --- グロー層(ぼかして光らせる) ---
    glow = Image.new('RGB', (W, H), 0)
    dg = ImageDraw.Draw(glow)
    for b in bodies:
        draw_trail(dg, b.trail, tuple(int(c) for c in b.color), 5)
    if fi < BANG:
        sx, sy = to_screen(np.zeros(2))
        dg.ellipse([sx - 30, sy - 30, sx + 30, sy + 30], fill=(255, 238, 190))
    for b in bodies:
        sx, sy = b.trail[-1]
        r = b.size + 3
        dg.ellipse([sx - r, sy - r, sx + r, sy + r], fill=tuple(int(c) for c in b.color))
    glow = glow.filter(ImageFilter.GaussianBlur(8))

    # --- コア層(くっきり) ---
    core = Image.new('RGB', (W, H), 0)
    dc = ImageDraw.Draw(core)
    for b in bodies:
        draw_trail(dc, b.trail[-60:], tuple(min(255, int(c) + 40) for c in b.color), 2, fade=0.05)
    if fi < BANG:
        sx, sy = to_screen(np.zeros(2))
        dc.ellipse([sx - 17, sy - 17, sx + 17, sy + 17], fill=(255, 250, 230))
    for b in bodies:
        sx, sy = b.trail[-1]
        r = max(2, b.size - 1)
        dc.ellipse([sx - r, sy - r, sx + r, sy + r], fill=(255, 255, 255))
        r2 = b.size + 1
        dc.ellipse([sx - r2, sy - r2, sx + r2, sy + r2],
                   outline=tuple(int(c) for c in b.color), width=2)

    frame = add(add(stars, np.array(glow, np.float32)), np.array(core, np.float32)).astype(np.uint8)

    # --- 太陽消滅の閃光 ---
    if BANG <= fi < BANG + 7:
        a = max(0.0, 1 - (fi - BANG) / 7)
        frame = np.clip(frame.astype(np.float32) + 255 * a, 0, 255).astype(np.uint8)

    # --- テキスト ---
    img = Image.fromarray(frame).convert('RGBA')
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    if fi < BANG:
        center_text(d, [('もしも太陽が消えたら？', (255, 255, 255))], f_hook, H * 0.09)
    else:
        a = min(255, int(255 * (fi - BANG) / 10))
        center_text(d, [('Wow… ', (214, 228, 255)), ('BYE!?', (255, 210, 77))],
                    f_wow, H * 0.10, alpha=a)
    center_text(d, [('もしも宇宙ラボ ／ What-If Space Lab', (180, 200, 240))], f_brand, H * 0.90)
    center_text(d, [('syoudai0514.github.io/moshimo-space-lab', (130, 150, 200))], f_url, H * 0.935)
    img = Image.alpha_composite(img, ov).convert('RGB')
    frames.append(np.array(img))

out = '/home/user/moshimo-space-lab/store/intro.mp4'
imageio.mimwrite(out, frames, fps=FPS, codec='libx264', quality=8,
                 macro_block_size=16, ffmpeg_params=['-pix_fmt', 'yuv420p'])
print('wrote', out, len(frames), 'frames', W, 'x', H)
