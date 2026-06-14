#!/usr/bin/env python3
# もしも宇宙ラボ — 掴み動画シリーズを量産する(縦9:16・BGM付き)。
# シナリオ(cfg)を差し替えるだけで複数本を生成。全編フルN体重力。
# 文字は日本語が主役(大・2色)・英語は控えめ字幕(小)。
import math, subprocess, wave, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import imageio.v2 as imageio
import imageio_ffmpeg

W, H = 720, 1280
FPS = 30
G = 4 * math.pi ** 2
EPS = 0.05
ABSORB_R = 0.13
KY = 0.60
cx, cy = W / 2, H * 0.47

IPA = '/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf'
DEJA = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
JP = lambda s: ImageFont.truetype(IPA, s)
LAT = lambda s: ImageFont.truetype(DEJA, s)
BLUE = (214, 228, 255); AMBER = (255, 210, 77); MUTE = (160, 180, 214)
SUNCOL = (255, 226, 150)
MERC = (180, 155, 140); VEN = (236, 201, 130); EAR = (95, 165, 226)
MAR = (210, 120, 80); JUP = (222, 184, 138)
ff = imageio_ffmpeg.get_ffmpeg_exe()

class Body:
    def __init__(self, mass, pos, vel, color, size, star=False, tag=''):
        self.mass = mass; self.pos = np.array(pos, float); self.vel = np.array(vel, float)
        self.color = tuple(color); self.size = size; self.star = star; self.tag = tag
        self.alive = True; self.trail = []

def planet(a, ph, col, sz, tag=''):
    v = math.sqrt(G / a)
    return Body(3e-6, [math.cos(ph) * a, math.sin(ph) * a],
                [-math.sin(ph) * v, math.cos(ph) * v], col, sz, tag=tag)

def acc_all(bodies):
    alive = [b for b in bodies if b.alive]
    A = {id(b): np.zeros(2) for b in alive}
    for i in range(len(alive)):
        for j in range(i + 1, len(alive)):
            bi, bj = alive[i], alive[j]
            d = bj.pos - bi.pos
            r2 = d[0] * d[0] + d[1] * d[1] + EPS * EPS
            inv = G / r2 ** 1.5
            A[id(bi)] += inv * bj.mass * d
            A[id(bj)] -= inv * bi.mass * d
    return A

def step(bodies, years, sub):
    dt = years / sub
    for _ in range(sub):
        A = acc_all(bodies)
        for b in bodies:
            if b.alive: b.vel += A[id(b)] * dt / 2
        for b in bodies:
            if b.alive: b.pos += b.vel * dt
        A = acc_all(bodies)
        for b in bodies:
            if b.alive: b.vel += A[id(b)] * dt / 2

def cam_center(bodies, mode):
    if mode == 'sun':
        return bodies[0].pos.copy()
    if mode == 'heavy':
        return max((b for b in bodies if b.alive), key=lambda b: b.mass).pos.copy()
    c = np.zeros(2); sm = 0.0
    for b in bodies:
        if b.star and b.alive: c += b.pos * b.mass; sm += b.mass
    return c / sm

def make_stars():
    img = Image.new('RGB', (W, H), 0); d = ImageDraw.Draw(img)
    for _ in range(170):
        x, y = random.randint(0, W - 1), random.randint(0, H - 1)
        b = random.randint(40, 150)
        d.ellipse([x, y, x + 1, y + 1], fill=(b, b, min(255, b + 30)))
    return np.array(img, np.float32)

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

F_HJP, F_HEN = JP(44), LAT(26)
F_CJP, F_CEN = JP(54), LAT(28)
F_BR, F_URL = JP(28), LAT(20)

def to_screen(p, cam, scale):
    return (cx + (p[0] - cam[0]) * scale, cy + (p[1] - cam[1]) * scale * KY)

def bgm(total, bang_f, path):
    SR = 44100; dur = total / FPS; N = int(SR * dur); bang_t = bang_f / FPS
    A = np.zeros((N, 2), np.float32)
    def place(start, mono, pan=0.0):
        i0 = int(start * SR); i1 = min(N, i0 + len(mono))
        if i1 <= i0: return
        s = mono[:i1 - i0]
        A[i0:i1, 0] += s * (1.0 if pan <= 0 else 1 - pan)
        A[i0:i1, 1] += s * (1.0 if pan >= 0 else 1 + pan)
    def tone(f, ln, amp, kind='sine', attack=0.008, decay=None):
        n = int(ln * SR); tt = np.arange(n) / SR
        if kind == 'tri': w = 2 * np.abs(2 * (tt * f - np.floor(0.5 + tt * f))) - 1
        else: w = np.sin(2 * np.pi * f * tt)
        e = np.ones(n); a = int(attack * SR)
        if a > 0: e[:a] = np.linspace(0, 1, a)
        if decay: e *= np.exp(-tt / decay)
        else:
            r = int(0.03 * SR)
            if r > 0 and n > r: e[-r:] *= np.linspace(1, 0, r)
        return (w * e * amp).astype(np.float32)
    NT = {'A3':220,'C4':261.63,'E4':329.63,'G4':392,'A4':440,'E5':659.25,'A5':880,'G5':783.99}
    for f, pan in [(110,-.2),(164.81,.2),(220,-.1),(261.63,.15),(329.63,0)]:
        place(0.1, tone(f, dur, 0.06, 'sine', 0.6) + tone(f*1.005, dur, 0.03, 'sine', 0.6), pan)
    beat = 60/132; ti = 0.4
    while ti < dur-0.1:
        place(ti, tone(55, 0.22, 0.16 if ti>=bang_t else 0.09, 'sine', 0.004, 0.16), 0); ti += beat/2
    arp = ['A3','C4','E4','G4','A4','G4','E4','C4']; ti = 0.45; k = 0
    while ti < dur-0.15:
        f = NT[arp[k%8]] * (2 if ti>=bang_t else 1); amp = 0.10 if ti>=bang_t else 0.05
        place(ti, tone(f,0.3,amp,'tri',0.005,0.18)+tone(f,0.3,amp*0.5,'sine',0.005,0.2), 0.5*math.sin(k))
        ti += beat/2; k += 1
    rl = 0.8; rn = int(rl*SR); tt = np.arange(rn)/SR; ramp = (tt/rl)**2
    place(bang_t-rl, (np.random.randn(rn)*0.12*ramp + np.sin(2*np.pi*(200+1600*(tt/rl))*tt)*0.10*ramp).astype(np.float32))
    bn = int(0.9*SR); tt = np.arange(bn)/SR
    place(bang_t, (np.sin(2*np.pi*(70*np.exp(-tt*3)+28)*tt)*np.exp(-tt/0.45)*0.6 + np.random.randn(bn)*np.exp(-tt/0.10)*0.35).astype(np.float32))
    for off, nm, pan in [(0.35,'E5',-.5),(1.1,'A5',.5),(1.9,'G5',-.4),(2.8,'E5',.4),(3.6,'A5',.3)]:
        n = int(1.4*SR); tt = np.arange(n)/SR; tr = 0.7+0.3*np.sin(2*np.pi*9*tt)
        place(bang_t+off, (np.sin(2*np.pi*NT[nm]*tt)*np.exp(-tt/0.9)*tr*0.14 + np.sin(2*np.pi*NT[nm]*2*tt)*np.exp(-tt/0.6)*tr*0.05).astype(np.float32), pan)
    fade = int(0.4*SR); A[-fade:] *= np.linspace(1,0,fade)[:,None]
    A = np.tanh(A*1.1); A = A/(np.max(np.abs(A)) or 1.0)*0.92
    with wave.open(path,'w') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(A,-1,1)*32767).astype('<i2').tobytes())

def render(cfg):
    random.seed(cfg.get('seed', 5)); np.random.seed(cfg.get('seed', 5))
    stars = make_stars()
    bodies = cfg['build']()
    total, calm = cfg['total'], cfg['calm']
    scale = cfg['scale']; cam_mode = cfg['cam']
    dtc, dtb = cfg.get('dt_calm', 0.008), cfg['dt_bang']
    flashes = []
    silent = '/tmp/series_silent.mp4'
    writer = imageio.get_writer(silent, fps=FPS, codec='libx264', quality=8,
                                macro_block_size=16, ffmpeg_params=['-pix_fmt', 'yuv420p'])
    for fi in range(total):
        if fi == calm and cfg.get('on_bang'):
            cfg['on_bang'](bodies)
        step(bodies, dtc if fi < calm else dtb, 8 if fi < calm else 16)
        # 吸収判定
        if cfg.get('absorb'):
            for b in bodies:
                if b.alive and not b.star:
                    for s in bodies:
                        if s.star and s.alive and math.hypot(*(b.pos - s.pos)) < ABSORB_R:
                            b.alive = False; flashes.append((b.pos.copy(), fi)); break
        cam = cam_center(bodies, cam_mode)
        for b in bodies:
            if b.alive:
                b.trail.append(to_screen(b.pos, cam, scale))
                if len(b.trail) > 280: b.trail.pop(0)

        glow = Image.new('RGB', (W, H), 0); dg = ImageDraw.Draw(glow)
        for b in bodies:
            if b.alive and not b.star: draw_trail(dg, b.trail, b.color, 5)
        for b in bodies:
            if b.alive:
                sx, sy = b.trail[-1]; r = (max(22, b.size + 10) if b.star else b.size + 3)
                dg.ellipse([sx-r, sy-r, sx+r, sy+r], fill=b.color)
        glow = glow.filter(ImageFilter.GaussianBlur(8))

        core = Image.new('RGB', (W, H), 0); dc = ImageDraw.Draw(core)
        for b in bodies:
            if b.alive and not b.star:
                draw_trail(dc, b.trail[-80:], tuple(min(255, c+40) for c in b.color), 2, 0.05)
        for b in bodies:
            if b.alive:
                sx, sy = b.trail[-1]
                if b.star:
                    rr = max(13, b.size - 2)
                    dc.ellipse([sx-rr, sy-rr, sx+rr, sy+rr], fill=(255, 252, 240))
                else:
                    r = max(2, b.size-1)
                    dc.ellipse([sx-r, sy-r, sx+r, sy+r], fill=(255, 255, 255))
                    r2 = b.size+1
                    dc.ellipse([sx-r2, sy-r2, sx+r2, sy+r2], outline=b.color, width=2)
        # 吸収の閃光
        for wp, f0 in flashes:
            age = fi - f0
            if 0 <= age < 9:
                a = 1 - age/9; rr = 6 + age*5
                sx, sy = to_screen(wp, cam, scale)
                dc.ellipse([sx-rr, sy-rr, sx+rr, sy+rr], outline=(int(255*a), int(230*a), int(170*a)), width=3)

        frame = np.clip(stars + np.array(glow, np.float32) + np.array(core, np.float32), 0, 255)
        if cfg.get('flash') and calm <= fi < calm+6:
            a = max(0.0, 1-(fi-calm)/6); frame = np.clip(frame + 230*a, 0, 255)
        frame = frame.astype(np.uint8)

        img = Image.fromarray(frame).convert('RGBA')
        ov = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(ov)
        if fi < calm:
            center_text(d, [(cfg['hook_jp'], (255, 255, 255))], F_HJP, H*0.065)
            center_text(d, [(cfg['hook_en'], MUTE)], F_HEN, H*0.115)
        else:
            a = min(255, int(255*(fi-calm)/9))
            center_text(d, [(cfg['cjp1'], BLUE), (cfg['cjp2'], AMBER)], F_CJP, H*0.06, alpha=a)
            center_text(d, [(cfg['cen'], MUTE)], F_CEN, H*0.128, alpha=a)
        center_text(d, [('もしも宇宙ラボ ／ What-If Space Lab', (180, 200, 240))], F_BR, H*0.90)
        center_text(d, [('syoudai0514.github.io/moshimo-space-lab', (130, 150, 200))], F_URL, H*0.935)
        writer.append_data(np.array(Image.alpha_composite(img, ov).convert('RGB')))
    writer.close()
    wav = '/tmp/series_bgm.wav'; bgm(total, calm, wav)
    subprocess.run([ff, '-y', '-i', silent, '-i', wav, '-c:v', 'copy', '-c:a', 'aac',
                    '-b:a', '192k', '-shortest', cfg['out']], check=True, capture_output=True)
    print('wrote', cfg['out'])


# ---------------- シナリオ定義 ----------------
def base_planets():
    return [planet(0.45, 0.4, MERC, 5), planet(0.72, 2.4, VEN, 8),
            planet(1.0, 4.3, EAR, 7, tag='earth'), planet(1.45, 5.6, MAR, 6)]

def build_basic():
    return [Body(1.0, [0, 0], [0, 0], SUNCOL, 16, star=True)] + base_planets()

def stop_tag(tag):
    def f(bodies):
        for b in bodies:
            if not b.star and (tag == '*' or b.tag == tag):
                b.vel = bodies[0].vel.copy()
    return f

def build_allstop():
    ps = [planet(0.5, 0.4, MERC, 5), planet(0.9, 2.0, VEN, 7), planet(1.4, 4.0, EAR, 7),
          planet(2.0, 5.4, MAR, 6), planet(2.7, 1.0, JUP, 9)]
    return [Body(1.0, [0, 0], [0, 0], SUNCOL, 16, star=True)] + ps

def build_flyby():
    b = build_basic()
    rogue = Body(2.2, [-3.0, 1.7], [2.35, -1.2], (255, 150, 120), 17, star=True)
    return b + [rogue]

def heavier(mult):
    def f(bodies): bodies[0].mass *= mult
    return f

def build_jupiter():
    b = build_basic()
    b.append(planet(3.4, 1.2, JUP, 12, tag='jup'))
    return b

def monster(bodies):
    for b in bodies:
        if b.tag == 'jup':
            b.mass = 8000 * 9.55e-4; b.star = True; b.color = (255, 180, 110); b.size = 20

SCEN = [
    dict(out='store/intro3.mp4', build=build_basic, on_bang=stop_tag('earth'),
         absorb=True, flash=False, cam='sun', scale=150, total=168, calm=42, dt_bang=0.011,
         hook_jp='もしも地球が公転をやめたら？', hook_en='What if Earth stopped orbiting?',
         cjp1='太陽に', cjp2='落ちてく…！', cen='Earth falls into the Sun!'),
    dict(out='store/intro4.mp4', build=build_allstop, on_bang=stop_tag('*'),
         absorb=True, flash=False, cam='sun', scale=112, total=146, calm=42, dt_bang=0.013,
         hook_jp='もしも惑星がぜんぶ止まったら？', hook_en='What if every planet stopped?',
         cjp1='つぎつぎ', cjp2='のみこまれる！？', cen='One by one, into the Sun!'),
    dict(out='store/intro5.mp4', build=build_flyby, on_bang=None,
         absorb=True, flash=True, cam='sun', scale=95, total=170, calm=44, dt_bang=0.016, seed=3,
         hook_jp='もしも近くを巨大な星が通ったら？', hook_en='What if a giant star passed by?',
         cjp1='惑星が', cjp2='もってかれた！？', cen='A passing star steals the planets!'),
    dict(out='store/intro6.mp4', build=build_basic, on_bang=heavier(3),
         absorb=True, flash=True, cam='sun', scale=150, total=168, calm=42, dt_bang=0.009,
         hook_jp='もしも太陽が3倍重くなったら？', hook_en='What if the Sun got 3× heavier?',
         cjp1='ぐいっと', cjp2='吸い寄せられた！', cen='Yanked into tight, fast orbits!'),
    dict(out='store/intro7.mp4', build=build_jupiter, on_bang=monster,
         absorb=True, flash=True, cam='heavy', scale=70, total=176, calm=44, dt_bang=0.012, seed=8,
         hook_jp='もしも木星が怪物みたいに重くなったら？', hook_en='What if Jupiter became a monster?',
         cjp1='主役、', cjp2='交代！？', cen='Jupiter takes over the system!'),
]

if __name__ == '__main__':
    import sys
    only = sys.argv[1:] if len(sys.argv) > 1 else None
    for cfg in SCEN:
        if only and not any(o in cfg['out'] for o in only): continue
        cfg['out'] = '/home/user/moshimo-space-lab/' + cfg['out']
        render(cfg)
