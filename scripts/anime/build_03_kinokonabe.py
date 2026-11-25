"""第3話「煩悩クッキング きのこ鍋の巻」試作版を組み立てる。

使い方:
  python3 scripts/anime/build_03_kinokonabe.py KEYS NAKAWARI STILLS CUT09 OUT.mp4
    KEYS     : anime_work/03_kinokonabe（原画 cutXX/1.png…）
    NAKAWARI : nakawari_all.zip を展開したフォルダ（cutXX_frames/）
    STILLS   : 止め絵（cut02,03,05,08,12,13,15,16.png）
    CUT09    : ⑨の完成動画（cut09_完成.mp4）

方針（docs/アニメ制作ナレッジ.md）:
  - 24fps。残像の重ね合わせは使わず、描かれたコマだけを並べる
  - 止める部分は高解像度の原画（K1/K2/K3）、動く途中だけ中割りのコマ
  - 止め絵はゆっくりしたカメラワークだけ
"""

import glob
import os
import subprocess
import sys
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

KEYS, NAKA, STILLS, CUT09, OUT = sys.argv[1:6]
W, H, FPS = 1280, 720, 24
AUDIO = os.path.join(os.path.dirname(__file__), "..", "..", "public", "audio")
FONT = "/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc"
INK = (58, 42, 32)
PAPER = (238, 222, 196)


def to_frame(im):
    """どの素材も 16:10 に合わせてから 1280x800 → 中央 1280x720 に切り出す"""
    im = ImageOps.fit(im.convert("RGB"), (1280, 800), Image.LANCZOS)
    return im.crop((0, 40, 1280, 760))


_cache = {}


def key(cut, n):
    k = ("K", cut, n)
    if k not in _cache:
        _cache[k] = to_frame(Image.open(f"{KEYS}/{cut}/{n}.png"))
    return _cache[k]


def mid(cut, i):
    k = ("M", cut, i)
    if k not in _cache:
        f = sorted(glob.glob(f"{NAKA}/{cut}_frames/*.png"))[i - 1]
        im = to_frame(Image.open(f))
        im = im.filter(ImageFilter.UnsharpMask(radius=2, percent=80, threshold=2))
        _cache[k] = im
    return _cache[k]


def seq(cut, plan):
    """plan: [(コマ, 枚数), …]  コマは 'K1' などの原画名か中割り番号(1始まり)"""
    out = []
    for f, n in plan:
        im = key(cut, int(f[1])) if isinstance(f, str) else mid(cut, f)
        out += [im] * n
    return out


def still(name, sec, z0=1.0, z1=1.06, cx=0.5, cy=0.5, dx=0.0, dy=0.0):
    """止め絵にゆっくりしたズーム・パン"""
    src = Image.open(f"{STILLS}/{name}.png").convert("RGB")
    base = ImageOps.fit(src, (W * 2, H * 2), Image.LANCZOS)
    n = int(sec * FPS)
    out = []
    for i in range(n):
        t = i / max(n - 1, 1)
        t = t * t * (3 - 2 * t)  # なめらかに
        z = z0 + (z1 - z0) * t
        cw, ch = base.width / z, base.height / z
        x = (base.width - cw) * (cx + dx * (t - 0.5))
        y = (base.height - ch) * (cy + dy * (t - 0.5))
        out.append(base.crop((int(x), int(y), int(x + cw), int(y + ch))).resize((W, H), Image.LANCZOS))
    return out


def video_frames(path):
    p = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                       capture_output=True, check=True)
    w, h = 1280, 800
    arr = np.frombuffer(p.stdout, np.uint8).reshape(-1, h, w, 3)
    # ⑨だけ色味が違うので、隣の⑩の原画の色に合わせる
    ref = np.asarray(key("cut10", 1), float).reshape(-1, 3)
    src = arr[0].reshape(-1, 3).astype(float)
    gain = (ref.mean(0) / src.mean(0)).reshape(1, 1, 3)
    return [Image.fromarray(np.clip(a * gain, 0, 255).astype(np.uint8)).crop((0, 40, 1280, 760)) for a in arr]


# ---- 字幕 ----
fnt = ImageFont.truetype(FONT, 46, index=0)
fnt_title = ImageFont.truetype(FONT, 72, index=0)
fnt_sub = ImageFont.truetype(FONT, 40, index=0)


def caption(im, text, font=fnt, y=None, alpha=1.0):
    im = im.copy()
    layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    bw = d.textbbox((0, 0), text, font=font, stroke_width=0)
    tw = bw[2] - bw[0]
    x = (W - tw) // 2
    y = y if y is not None else H - 104
    a = int(255 * alpha)
    d.text((x, y), text, font=font, fill=INK + (a,), stroke_width=8, stroke_fill=PAPER + (int(a * 0.95),))
    im.paste(layer, (0, 0), layer)
    return im


# ---- カット構成 ----
# (名前, フレーム列, 字幕, [(秒, 効果音, 音量)])
cuts = []


def add(make, text=None, sfx=()):
    """make: フレーム列を作る関数（メモリ節約のため、書き出す直前に作る）"""
    cuts.append((make, text, list(sfx)))


# タイトル
paper = Image.new("RGB", (W, H), PAPER)
paper = Image.blend(paper, still("cut16", 0.05)[0].filter(ImageFilter.GaussianBlur(40)), 0.35)
title = lambda: [caption(caption(paper, "煩悩クッキング", fnt_title, y=270), "きのこ鍋の巻", fnt_sub, y=380)] * int(2.2 * FPS)
add(title, None, [(0.1, "rin.wav", 0.5)])

# ① どうしても食べたい（よだれ）
add(lambda: seq("cut01", [("K1", 22), (5, 3), (9, 3), (13, 3), ("K2", 44)]),
    "どうしても…食べたい…！", [(1.3, "torori.wav", 0.6)])
# ② 山へ
add(lambda: still("cut02", 2.6, 1.08, 1.0), "秋の山へ、きのこ探し…")
# ③ どっさり
add(lambda: still("cut03", 2.4, 1.0, 1.08, cy=0.4), "煩悩、どっさり。", [(0.3, "pochi.wav", 0.5)])
# ④ はちまき
add(lambda: seq("cut04", [("K1", 22), (3, 2), (4, 2), (6, 2), ("K2", 30)]),
    "さあ、煩悩を仕込むぞ！", [(0.95, "kachi.wav", 0.8)])
# ⑤ 包丁を構える
add(lambda: still("cut05", 2.0, 1.0, 1.05, cy=0.45), "心を、研ぎすまし…")
# ⑥ 石づきを落とす
add(lambda: seq("cut06", [("K1", 14), (3, 2), (5, 2), (8, 2), (11, 2), ("K2", 28)]),
    "石づきを落とし…", [(0.62, "saku.wav", 0.8), (0.95, "poto.wav", 0.7)])
# ⑦ まいたけをほぐす
add(lambda: seq("cut07", [("K1", 16), (4, 2), (8, 2), (12, 2), ("K2", 32)]),
    "ほぐしていく…！", [(0.7, "saku.wav", 0.45)])
# ⑧ エリンギ
add(lambda: still("cut08", 2.0, 1.04, 1.0, cx=0.55, dx=-0.2), "ひとつひとつ、ていねいに。")
# ⑨ 切る（完成済み。音も込み）
add(lambda: video_frames(CUT09), "とん、とん、とん。")
# ⑩ つまみ食い
add(lambda: seq("cut10", [("K1", 14), (6, 2), (11, 2), ("K2", 18), (20, 3), (24, 3), ("K3", 4),
                  (22, 4), ("K3", 4), (22, 4), ("K3", 20)]),
    "つい、つまみ食い…！", [(0.75, "pon.wav", 0.7)])
# ⑪ 煩悩が暴走（ぐるぐる。往復してよい動き）
add(lambda: seq("cut11", [("K1", 6), (6, 3), (11, 3), ("K2", 6), (11, 3), (6, 3), ("K1", 6), (6, 3), (11, 3), ("K2", 24)]),
    "煩悩が、暴走…！", [(0.0, "fuwa.wav", 0.6), (1.1, "fuwa.wav", 0.5)])
# ⑫ 鍋へ
add(lambda: still("cut12", 2.2, 1.0, 1.05, cx=0.6), "ぜんぶ、鍋へ。", [(1.2, "kachi.wav", 0.5)])
# ⑬ ぐつぐつ
add(lambda: still("cut13", 3.0, 1.0, 1.07, cx=0.35, cy=0.55), "ぐつぐつ…", [(0.0, "juwa.wav", 0.35)])
# ⑭ いただきます（後半の中割りは崩れているので、原画どうしで切り替える）
add(lambda: seq("cut14", [("K1", 16), (6, 2), (11, 2), ("K2", 22), ("K3", 40)]),
    "いただきます…！", [(1.42, "pon.wav", 0.5)])
# ⑮ 満腹
add(lambda: still("cut15", 3.0, 1.0, 1.05, cx=0.4), "煩悩、満たされました。", [(0.2, "suu.wav", 0.4)])
# ⑯ 夕暮れ
add(lambda: still("cut16", 4.5, 1.06, 1.0, cy=0.4), "本日の煩悩、完食。", [(0.4, "rin.wav", 0.55)])

# ---- 映像を組み立て（1カットずつ書き出す）----
tmpv = OUT + ".video.mp4"
proc = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                         "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-crf", "18", "-preset", "veryfast",
                         "-pix_fmt", "yuv420p", tmpv], stdin=subprocess.PIPE)
lengths, events = [], []
total = 0
plain = Image.new("RGB", (W, H), PAPER)
for ci, (make, text, sfx) in enumerate(cuts):
    fr = make()
    n = len(fr)
    start = total / FPS
    for t, name, vol in sfx:
        events.append((start + t, name, vol))
    if ci == 9:
        cut09_start = start
    for i, im in enumerate(fr):
        if text:
            a = min(1.0, i / 5, (n - 1 - i) / 4 + 0.25)
            im = caption(im, text, alpha=max(a, 0))
        if total + i < 12:
            im = Image.blend(plain, im, (total + i) / 12)
        if ci == len(cuts) - 1 and i >= n - 30:
            im = Image.blend(im, plain, (i - (n - 30)) / 30)
        proc.stdin.write(np.asarray(im).tobytes())
    total += n
    lengths.append(n)
    _cache.clear()
    del fr
proc.stdin.close()
proc.wait()
dur = total / FPS
print(f"長さ {dur:.2f}秒 / {total}コマ")

# ---- 音 ----
SR = 44100


def load(path):
    with wave.open(path) as w:
        x = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(float) / 32768
        return x.reshape(-1, w.getnchannels()).mean(1) if w.getnchannels() > 1 else x


mix = np.zeros(int((dur + 0.5) * SR))
bgm = load(f"{AUDIO}/bgm.wav")
pos = 0
while pos < len(mix):
    seg = bgm[: len(mix) - pos].copy()
    mix[pos:pos + len(seg)] += seg * 0.32
    pos += len(bgm) - int(0.5 * SR)
fo = int(1.5 * SR)
end = int(dur * SR)
mix[end - fo:end] *= np.linspace(1, 0, fo)
mix[end:] = 0
for t, name, vol in events:
    s = load(f"{AUDIO}/{name}") * vol
    i = int(t * SR)
    mix[i:i + len(s)] += s[: len(mix) - i]
# ⑨は完成版の音をそのまま使う
p = subprocess.run(["ffmpeg", "-v", "error", "-i", CUT09, "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
                   capture_output=True, check=True)
c9 = np.frombuffer(p.stdout, np.int16).astype(float) / 32768
i = int(cut09_start * SR)
mix[i:i + len(c9)] += c9 * 0.9
mix = mix / max(1.0, np.abs(mix).max() / 0.9)
pcm = (np.clip(mix, -1, 1) * 32767).astype("<i2")
wav = OUT + ".wav"
with wave.open(wav, "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())

subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", tmpv, "-i", wav, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                "-shortest", "-movflags", "+faststart", OUT], check=True)
os.remove(wav)
os.remove(tmpv)
print("書き出し:", OUT)
