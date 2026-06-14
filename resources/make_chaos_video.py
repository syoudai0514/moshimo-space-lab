#!/usr/bin/env python3
# もしも宇宙ラボ — 掴み動画2「もしも太陽が2つになったら？」(縦9:16・BGM付き)。
# 完全なN体重力で、途中から2つ目の太陽が出現 → 惑星が2つの恒星に翻弄されてカオス軌道に。
# 文字は日本語が主役(大)・英語は控えめな字幕(小)。BGMはゲームトレーラー寄り。
import math, subprocess, wave, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import imageio.v2 as imageio
import imageio_ffmpeg

W, H = 720, 1280
FPS = 30
CALM_FRAMES = 40          # 約1.3秒: 1つの太陽でふつうに公転
TOTAL = 180               # 6.0秒
BANG = CALM_FRAMES
cx, cy = W / 2, H * 0.47
SCALE = 112.0
KY = 0.60
G = 4 * math.pi ** 2
EPS = 0.06                # ソフトニング(接近時の発散防止)
DT_CALM = 0.008
DT_BANG = 0.014
SEP = 1.6                 # 連星の間隔(AU)

random.seed(5); np.random.seed(5)

IPA = '/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf'
DEJA = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
JP = lambda s: ImageFont.truetype(IPA, s)
LAT = lambda s: ImageFont.truetype(DEJA, s)

class Body:
    def __init__(self, mass, pos, vel, color, size, star=False):
        self.mass = mass; self.pos = np.array(pos, float); self.vel = np.array(vel, float)
        self.color = tuple(color); self.size = size; self.star = star; self.trail = []

# 太陽(中心) + 内惑星3つ。最初は普通に公転。
SUN = Body(1.0, [0, 0], [0, 0], (255, 226, 150), 16, star=True)
BODY = [SUN]
for a, ph, col, sz in [(0.5, 0.4, (180, 155, 140), 5),
                       (0.85, 2.4, (120, 180, 230), 7),
                       (1.25, 4.3, (210, 150, 95), 7)]:
    v = math.sqrt(G / a)
    BODY.append(Body(3e-6, [math.cos(ph) * a, math.sin(ph) * a],
                     [-math.sin(ph) * v, math.cos(ph) * v], col, sz))

def acc_all():
    n = len(BODY); A = [np.zeros(2) for _ in range(n)]
    for i in range(n):
        for j in range(n):
            if i == j: continue
            d = BODY[j].pos - BODY[i].pos
            r2 = d[0] * d[0] + d[1] * d[1] + EPS * EPS
            A[i] += G * BODY[j].mass * d / r2 ** 1.5
    return A

def step(years, sub):
    dt = years / sub
    for _ in range(sub):
        A = acc_all()
        for i, b in enumerate(BODY): b.vel += A[i] * dt / 2
        for b in BODY: b.pos += b.vel * dt
        A = acc_all()
        for i, b in enumerate(BODY): b.vel += A[i] * dt / 2

def add_second_sun():
    bary = SUN.pos.copy()                      # 旧太陽位置を連星の重心に
    SUN.pos = bary + np.array([-SEP / 2, 0])
    B = Body(1.0, bary + np.array([SEP / 2, 0]), [0, 0], (150, 200, 255), 16, star=True)
    vrel = math.sqrt(G * (SUN.mass + B.mass) / SEP)
    SUN.vel = SUN.vel + np.array([0, vrel * 0.5])
    B.vel = np.array([0, -vrel * 0.5])
    BODY.append(B)
    P = sum(b.mass * b.vel for b in BODY); M = sum(b.mass for b in BODY)
    for b in BODY: b.vel -= P / M             # 全体の運動量をゼロに(フレーム外へ流れない)

def cam_center():
    c = np.zeros(2); sm = 0.0
    for b in BODY:
        if b.star: c += b.pos * b.mass; sm += b.mass
    return c / sm

def to_screen(p, cam):
    return (cx + (p[0] - cam[0]) * SCALE, cy + (p[1] - cam[1]) * SCALE * KY)

# 背景の星
star_img = Image.new('RGB', (W, H), 0)
sd = ImageDraw.Draw(star_img)
for _ in range(170):
    x, y = random.randint(0, W - 1), random.randint(0, H - 1)
    b = random.randint(40, 150)
    sd.ellipse([x, y, x + 1, y + 1], fill=(b, b, min(255, b + 30)))
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

f_hook_jp = JP(44); f_hook_en = LAT(26)
f_climax_jp = JP(54); f_climax_en = LAT(28)
f_brand = JP(28); f_url = LAT(20)
BLUE = (214, 228, 255); AMBER = (255, 210, 77); MUTE = (160, 180, 214)

ff = imageio_ffmpeg.get_ffmpeg_exe()
silent = '/tmp/intro2_silent.mp4'
writer = imageio.get_writer(silent, fps=FPS, codec='libx264', quality=8,
                            macro_block_size=16, ffmpeg_params=['-pix_fmt', 'yuv420p'])

for fi in range(TOTAL):
    if fi == BANG:
        add_second_sun()
    if fi < BANG:
        step(DT_CALM, 8)
    else:
        step(DT_BANG, 16)
    cam = cam_center()
    for b in BODY:
        b.trail.append(to_screen(b.pos, cam))
        if len(b.trail) > 280:
            b.trail.pop(0)

    glow = Image.new('RGB', (W, H), 0); dg = ImageDraw.Draw(glow)
    for b in BODY:
        if not b.star:
            draw_trail(dg, b.trail, b.color, 5)
    for b in BODY:
        sx, sy = b.trail[-1]
        r = (34 if b.star else b.size + 3)
        dg.ellipse([sx - r, sy - r, sx + r, sy + r], fill=b.color)
    glow = glow.filter(ImageFilter.GaussianBlur(8))

    core = Image.new('RGB', (W, H), 0); dc = ImageDraw.Draw(core)
    for b in BODY:
        if not b.star:
            draw_trail(dc, b.trail[-80:], tuple(min(255, c + 40) for c in b.color), 2, fade=0.05)
    for b in BODY:
        sx, sy = b.trail[-1]
        if b.star:
            dc.ellipse([sx - 18, sy - 18, sx + 18, sy + 18], fill=(255, 252, 240))
        else:
            r = max(2, b.size - 1)
            dc.ellipse([sx - r, sy - r, sx + r, sy + r], fill=(255, 255, 255))
            r2 = b.size + 1
            dc.ellipse([sx - r2, sy - r2, sx + r2, sy + r2], outline=b.color, width=2)

    frame = np.clip(stars + np.array(glow, np.float32) + np.array(core, np.float32), 0, 255)
    if BANG <= fi < BANG + 6:                  # 2つ目の太陽出現の閃光
        a = max(0.0, 1 - (fi - BANG) / 6)
        frame = np.clip(frame + 230 * a, 0, 255)
    frame = frame.astype(np.uint8)

    img = Image.fromarray(frame).convert('RGBA')
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
    if fi < BANG:
        center_text(d, [('もしも太陽が2つになったら？', (255, 255, 255))], f_hook_jp, H * 0.065)
        center_text(d, [('What if there were two Suns?', MUTE)], f_hook_en, H * 0.115)
    else:
        a = min(255, int(255 * (fi - BANG) / 9))
        center_text(d, [('なに？！', BLUE), ('この動き？！', AMBER)], f_climax_jp, H * 0.06, alpha=a)
        center_text(d, [('What IS this motion?!', MUTE)], f_climax_en, H * 0.128, alpha=a)
    center_text(d, [('もしも宇宙ラボ ／ What-If Space Lab', (180, 200, 240))], f_brand, H * 0.90)
    center_text(d, [('syoudai0514.github.io/moshimo-space-lab', (130, 150, 200))], f_url, H * 0.935)
    img = Image.alpha_composite(img, ov).convert('RGB')
    writer.append_data(np.array(img))
writer.close()
print('video frames done')

# ---------------- BGM(1本目と同じゲームトレーラー寄り) ----------------
SR = 44100
dur = TOTAL / FPS
N = int(SR * dur)
bang_t = BANG / FPS
audio = np.zeros((N, 2), np.float32)

def place(start, mono, pan=0.0):
    i0 = int(start * SR); i1 = min(N, i0 + len(mono))
    if i1 <= i0: return
    seg = mono[:i1 - i0]
    audio[i0:i1, 0] += seg * (1.0 if pan <= 0 else 1.0 - pan)
    audio[i0:i1, 1] += seg * (1.0 if pan >= 0 else 1.0 + pan)

def tone(freq, length, amp, kind='sine', attack=0.008, decay=None):
    n = int(length * SR); tt = np.arange(n) / SR
    if kind == 'saw': w = 2 * (tt * freq - np.floor(0.5 + tt * freq))
    elif kind == 'tri': w = 2 * np.abs(2 * (tt * freq - np.floor(0.5 + tt * freq))) - 1
    else: w = np.sin(2 * np.pi * freq * tt)
    e = np.ones(n); a = int(attack * SR)
    if a > 0: e[:a] = np.linspace(0, 1, a)
    if decay: e *= np.exp(-tt / decay)
    else:
        r = int(0.03 * SR)
        if r > 0 and n > r: e[-r:] *= np.linspace(1, 0, r)
    return (w * e * amp).astype(np.float32)

NOTE = {'A3':220,'C4':261.63,'E4':329.63,'G4':392,'A4':440,'C5':523.25,'E5':659.25,'A5':880,'G5':783.99}
for f, pan in [(110, -.2), (164.81, .2), (220, -.1), (261.63, .15), (329.63, 0)]:
    pad = tone(f, dur, 0.06, 'sine', attack=0.6) + tone(f * 1.005, dur, 0.03, 'sine', attack=0.6)
    place(0.1, pad, pan)
beat = 60 / 132
ti = 0.4
while ti < dur - 0.1:
    place(ti, tone(55, 0.22, 0.16 if ti >= bang_t else 0.09, 'sine', attack=0.004, decay=0.16), 0)
    ti += beat / 2
arp = ['A3', 'C4', 'E4', 'G4', 'A4', 'G4', 'E4', 'C4']
eighth = beat / 2; ti = 0.45; k = 0
while ti < dur - 0.15:
    f = NOTE[arp[k % len(arp)]] * (2 if ti >= bang_t else 1)
    amp = 0.10 if ti >= bang_t else 0.05
    place(ti, tone(f, 0.3, amp, 'tri', attack=0.005, decay=0.18)
          + tone(f, 0.3, amp * 0.5, 'sine', attack=0.005, decay=0.2), 0.5 * math.sin(k))
    ti += eighth; k += 1
rl = 0.8; rn = int(rl * SR); tt = np.arange(rn) / SR; ramp = (tt / rl) ** 2
place(bang_t - rl, (np.random.randn(rn) * 0.12 * ramp
      + np.sin(2 * np.pi * (200 + 1600 * (tt / rl)) * tt) * 0.10 * ramp).astype(np.float32), 0)
bn = int(0.9 * SR); tt = np.arange(bn) / SR
place(bang_t, (np.sin(2 * np.pi * (70 * np.exp(-tt * 3) + 28) * tt) * np.exp(-tt / 0.45) * 0.6
      + np.random.randn(bn) * np.exp(-tt / 0.10) * 0.35).astype(np.float32), 0)
for off, name, pan in [(0.35, 'E5', -.5), (1.1, 'A5', .5), (1.9, 'G5', -.4), (2.8, 'E5', .4), (3.6, 'A5', .3)]:
    n = int(1.4 * SR); tt = np.arange(n) / SR; trem = 0.7 + 0.3 * np.sin(2 * np.pi * 9 * tt)
    bell = (np.sin(2 * np.pi * NOTE[name] * tt) * np.exp(-tt / 0.9) * trem * 0.14
            + np.sin(2 * np.pi * NOTE[name] * 2 * tt) * np.exp(-tt / 0.6) * trem * 0.05)
    place(bang_t + off, bell.astype(np.float32), pan)
fade = int(0.4 * SR); audio[-fade:] *= np.linspace(1, 0, fade)[:, None]
audio = np.tanh(audio * 1.1); audio = audio / (np.max(np.abs(audio)) or 1.0) * 0.92
wav = '/tmp/intro2_bgm.wav'
with wave.open(wav, 'w') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(audio, -1, 1) * 32767).astype('<i2').tobytes())
print('bgm done')

out = '/home/user/moshimo-space-lab/store/intro2.mp4'
subprocess.run([ff, '-y', '-i', silent, '-i', wav, '-c:v', 'copy', '-c:a', 'aac',
                '-b:a', '192k', '-shortest', out], check=True, capture_output=True)
print('wrote', out)
