#!/usr/bin/env python3
# もしも宇宙ラボ — 掴み動画(縦9:16・BGM付き)を生成する。
# アプリと同じN体重力(太陽との2体)で「内惑星が公転 → 太陽が消える → 一斉に飛び去る」を描画。
# 文字は日英併記。BGMは宇宙アンビエント土台 + アルペジオ/パルス/消滅インパクト(ゲームトレーラー寄り)。
import math, subprocess, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import imageio.v2 as imageio
import imageio_ffmpeg

W, H = 720, 1280
FPS = 30
CALM_FRAMES = 36          # 約1.2秒ふつうに公転(溜め)
TOTAL = 168               # 5.6秒
BANG = CALM_FRAMES
cx, cy = W / 2, H * 0.46
SCALE = 158.0             # 内惑星に寄る
KY = 0.60
G = 4 * math.pi ** 2
DT_CALM = 0.010
DT_BANG = 0.012

import random
random.seed(7); np.random.seed(7)

IPA = '/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf'
DEJA = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
JP = lambda s: ImageFont.truetype(IPA, s)
LAT = lambda s: ImageFont.truetype(DEJA, s)

# 太陽は中央。木星以遠は外す(「太陽が消えたのに光が残る」誤解を避ける)。内惑星4つ。
PLANETS = [
    ('mercury', 0.387, 4.40, (175, 152, 138), 5),
    ('venus',   0.723, 1.85, (236, 201, 130), 9),
    ('earth',   1.000, 0.00, (95, 165, 226), 9),
    ('mars',    1.524, 5.60, (208, 96, 66), 7),
]

class Body:
    def __init__(self, a, ph, color, size):
        self.color = tuple(color); self.size = size
        v = math.sqrt(G / a)
        self.pos = np.array([math.cos(ph) * a, math.sin(ph) * a])
        self.vel = np.array([-math.sin(ph) * v, math.cos(ph) * v])
        self.trail = []

bodies = [Body(a, ph, c, s) for (_, a, ph, c, s) in PLANETS]

def step(msun, years, sub=8):
    dt = years / sub
    for _ in range(sub):
        for b in bodies:
            acc = (-G * msun * b.pos / (math.hypot(*b.pos) + 1e-6) ** 3) if msun else 0.0
            b.vel = b.vel + acc * (dt / 2)
            b.pos = b.pos + b.vel * dt
            acc = (-G * msun * b.pos / (math.hypot(*b.pos) + 1e-6) ** 3) if msun else 0.0
            b.vel = b.vel + acc * (dt / 2)

def to_screen(p):
    return (cx + p[0] * SCALE, cy + p[1] * SCALE * KY)

# 背景の星
star_img = Image.new('RGB', (W, H), 0)
sdraw = ImageDraw.Draw(star_img)
for _ in range(170):
    x, y = random.randint(0, W - 1), random.randint(0, H - 1)
    b = random.randint(40, 150)
    sdraw.ellipse([x, y, x + 1, y + 1], fill=(b, b, min(255, b + 30)))
stars = np.array(star_img, np.float32)

def draw_trail(draw, pts, color, width, fade=0.18):
    n = len(pts)
    for i in range(1, n):
        f = fade + (1 - fade) * (i / n)
        draw.line([pts[i - 1], pts[i]], fill=tuple(int(c * f) for c in color), width=width)

def center_text(draw, parts, font, y, alpha=255):
    widths = [draw.textlength(t, font=font) for t, _ in parts]
    x = (W - sum(widths)) / 2
    for (t, c), w in zip(parts, widths):
        draw.text((x + 2, y + 3), t, font=font, fill=(0, 0, 0, int(alpha * 0.55)))
        draw.text((x, y), t, font=font, fill=c + (alpha,))
        x += w

# 日本語を主役(大)・英語は控えめな字幕(小)。どちらも日本語→英語の順。
f_hook_jp = JP(46); f_hook_en = LAT(26)
f_climax_jp = JP(52); f_climax_en = LAT(28)
f_brand = JP(28); f_url = LAT(20)
BLUE = (214, 228, 255); AMBER = (255, 210, 77); MUTE = (160, 180, 214)

ff = imageio_ffmpeg.get_ffmpeg_exe()
silent = '/tmp/intro_silent.mp4'
writer = imageio.get_writer(silent, fps=FPS, codec='libx264', quality=8,
                            macro_block_size=16, ffmpeg_params=['-pix_fmt', 'yuv420p'])

for fi in range(TOTAL):
    if fi < BANG:
        step(1.0, DT_CALM)
    else:
        step(0.0, DT_BANG)
    for b in bodies:
        b.trail.append(to_screen(b.pos))
        if len(b.trail) > 240:
            b.trail.pop(0)

    glow = Image.new('RGB', (W, H), 0)
    dg = ImageDraw.Draw(glow)
    for b in bodies:
        draw_trail(dg, b.trail, b.color, 5)
    if fi < BANG:
        sx, sy = to_screen(np.zeros(2))
        dg.ellipse([sx - 34, sy - 34, sx + 34, sy + 34], fill=(255, 238, 190))
    for b in bodies:
        sx, sy = b.trail[-1]; r = b.size + 3
        dg.ellipse([sx - r, sy - r, sx + r, sy + r], fill=b.color)
    glow = glow.filter(ImageFilter.GaussianBlur(8))

    core = Image.new('RGB', (W, H), 0)
    dc = ImageDraw.Draw(core)
    for b in bodies:
        draw_trail(dc, b.trail[-70:], tuple(min(255, c + 40) for c in b.color), 2, fade=0.05)
    if fi < BANG:
        sx, sy = to_screen(np.zeros(2))
        dc.ellipse([sx - 19, sy - 19, sx + 19, sy + 19], fill=(255, 250, 232))
    for b in bodies:
        sx, sy = b.trail[-1]; r = max(2, b.size - 1)
        dc.ellipse([sx - r, sy - r, sx + r, sy + r], fill=(255, 255, 255))
        r2 = b.size + 1
        dc.ellipse([sx - r2, sy - r2, sx + r2, sy + r2], outline=b.color, width=2)

    frame = np.clip(stars + np.array(glow, np.float32) + np.array(core, np.float32), 0, 255)

    if BANG <= fi < BANG + 7:
        a = max(0.0, 1 - (fi - BANG) / 7)
        frame = np.clip(frame + 255 * a, 0, 255)
    frame = frame.astype(np.uint8)

    img = Image.fromarray(frame).convert('RGBA')
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    if fi < BANG:
        center_text(d, [('もしも太陽が消えたら？', (255, 255, 255))], f_hook_jp, H * 0.065)
        center_text(d, [('What if the Sun vanished?', MUTE)], f_hook_en, H * 0.118)
    else:
        a = min(255, int(255 * (fi - BANG) / 9))
        center_text(d, [('うわぁ！！', BLUE), ('どっか行った！？', AMBER)], f_climax_jp, H * 0.06, alpha=a)
        center_text(d, [('Whoa!! Where did they go!?', MUTE)], f_climax_en, H * 0.125, alpha=a)
    center_text(d, [('もしも宇宙ラボ ／ What-If Space Lab', (180, 200, 240))], f_brand, H * 0.90)
    center_text(d, [('syoudai0514.github.io/moshimo-space-lab', (130, 150, 200))], f_url, H * 0.935)
    img = Image.alpha_composite(img, ov).convert('RGB')
    writer.append_data(np.array(img))
writer.close()
print('video frames done')

# ---------------- BGM(宇宙アンビエント + アルペジオ/パルス/消滅インパクト) ----------------
SR = 44100
dur = TOTAL / FPS
N = int(SR * dur)
bang_t = BANG / FPS
audio = np.zeros((N, 2), np.float32)

def place(start, mono, pan=0.0):
    i0 = int(start * SR); i1 = min(N, i0 + len(mono))
    if i1 <= i0: return
    seg = mono[:i1 - i0]
    lg = 1.0 if pan <= 0 else 1.0 - pan
    rg = 1.0 if pan >= 0 else 1.0 + pan
    audio[i0:i1, 0] += seg * lg
    audio[i0:i1, 1] += seg * rg

def tone(freq, length, amp, kind='sine', attack=0.008, decay=None):
    n = int(length * SR); tt = np.arange(n) / SR
    if kind == 'saw':
        w = 2 * (tt * freq - np.floor(0.5 + tt * freq))
    elif kind == 'tri':
        w = 2 * np.abs(2 * (tt * freq - np.floor(0.5 + tt * freq))) - 1
    else:
        w = np.sin(2 * np.pi * freq * tt)
    e = np.ones(n)
    a = int(attack * SR)
    if a > 0: e[:a] = np.linspace(0, 1, a)
    if decay:
        e *= np.exp(-tt / decay)
    else:
        r = int(0.03 * SR)
        if r > 0 and n > r: e[-r:] *= np.linspace(1, 0, r)
    return (w * e * amp).astype(np.float32)

NOTE = {'A1':55,'A2':110,'C3':130.81,'E3':164.81,'A3':220,'C4':261.63,'D4':293.66,
        'E4':329.63,'G4':392,'A4':440,'C5':523.25,'E5':659.25,'A5':880,'G5':783.99}

# パッド(Am add9 を持続。宇宙アンビエントの土台)
for f, pan in [(110,-.2),(164.81,.2),(220,-.1),(261.63,.15),(329.63,0)]:
    pad = tone(f, dur, 0.06, 'sine', attack=0.6)
    pad += tone(f * 1.005, dur, 0.03, 'sine', attack=0.6)  # デチューンで広がり
    place(0.1, pad, pan)

# ベース・パルス(四分でドライブ。bang後に強く)
beat = 60 / 132
ti = 0.4
while ti < dur - 0.1:
    amp = 0.16 if ti >= bang_t else 0.09
    place(ti, tone(55, 0.22, amp, 'sine', attack=0.004, decay=0.16), 0)
    ti += beat / 2

# アルペジオ(ペンタトニック。bang後にオクターブ上げて煌めく)
arp = ['A3','C4','E4','G4','A4','G4','E4','C4']
eighth = beat / 2
ti = 0.45; k = 0
while ti < dur - 0.15:
    name = arp[k % len(arp)]
    f = NOTE[name]
    if ti >= bang_t: f *= 2
    amp = 0.10 if ti >= bang_t else 0.05
    s = tone(f, 0.3, amp, 'tri', attack=0.005, decay=0.18)
    s += tone(f, 0.3, amp * 0.5, 'sine', attack=0.005, decay=0.2)
    place(ti, s, 0.5 * math.sin(k))
    ti += eighth; k += 1

# 消滅へのライザー(bang直前0.8秒: ノイズ上昇 + ピッチスイープ)
rl = 0.8; rn = int(rl * SR); tt = np.arange(rn) / SR
ramp = (tt / rl) ** 2
noise = np.random.randn(rn) * 0.12 * ramp
sweep = np.sin(2 * np.pi * (200 + 1600 * (tt / rl)) * tt) * 0.10 * ramp
place(bang_t - rl, (noise + sweep).astype(np.float32), 0)

# 消滅インパクト(低いブーム + ノイズヒット)
bn = int(0.9 * SR); tt = np.arange(bn) / SR
boom = np.sin(2 * np.pi * (70 * np.exp(-tt * 3) + 28) * tt) * np.exp(-tt / 0.45) * 0.6
hit = np.random.randn(bn) * np.exp(-tt / 0.10) * 0.35
place(bang_t, (boom + hit).astype(np.float32), 0)

# 脱出のきらめき(高音ベル + トレモロ。まばらに)
for off, name, pan in [(0.35,'E5',-.5),(1.1,'A5',.5),(1.9,'G5',-.4),(2.8,'E5',.4)]:
    n = int(1.4 * SR); tt = np.arange(n) / SR
    trem = 0.7 + 0.3 * np.sin(2 * np.pi * 9 * tt)
    bell = np.sin(2 * np.pi * NOTE[name] * tt) * np.exp(-tt / 0.9) * trem * 0.14
    bell += np.sin(2 * np.pi * NOTE[name] * 2 * tt) * np.exp(-tt / 0.6) * trem * 0.05
    place(bang_t + off, bell.astype(np.float32), pan)

# 末尾フェード + ソフトクリップ + 正規化
fade = int(0.4 * SR)
audio[-fade:] *= np.linspace(1, 0, fade)[:, None]
audio = np.tanh(audio * 1.1)
peak = np.max(np.abs(audio)) or 1.0
audio = (audio / peak * 0.92)

wav = '/tmp/intro_bgm.wav'
with wave.open(wav, 'w') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(audio, -1, 1) * 32767).astype('<i2').tobytes())
print('bgm done')

out = '/home/user/moshimo-space-lab/store/intro.mp4'
subprocess.run([ff, '-y', '-i', silent, '-i', wav, '-c:v', 'copy', '-c:a', 'aac',
                '-b:a', '192k', '-shortest', out], check=True, capture_output=True)
print('wrote', out)
