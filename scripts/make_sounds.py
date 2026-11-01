"""さとりねこ動画用の音（BGM・効果音）をプログラムで合成する。

外部の音源を使わないので、権利・クレジットの心配がない。
使い方: python3 scripts/make_sounds.py  →  public/audio/*.wav を作る
"""

import os
import wave

import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "audio")
rng = np.random.default_rng(108)


def t_axis(sec):
    return np.arange(int(SR * sec)) / SR


def band_noise(sec, lo, hi, tilt=0.0):
    """lo〜hi Hz に絞ったノイズ（FFTで帯域を切る）。tilt>0 で高域を弱める"""
    n = int(SR * sec)
    spec = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    mask = 1 / (1 + np.exp(-(f - lo) / (lo * 0.15 + 1)))
    mask *= 1 / (1 + np.exp((f - hi) / (hi * 0.15 + 1)))
    if tilt:
        mask *= (1 + f / 1000) ** -tilt
    out = np.fft.irfft(spec * mask, n)
    return out / (np.max(np.abs(out)) + 1e-9)


def env_ad(n, attack, decay_tau):
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-np.maximum(t - attack, 0) / decay_tau)


def fade(x, fin=0.005, fout=0.05):
    x = x.copy()
    a, b = int(SR * fin), int(SR * fout)
    if a:
        x[:a] *= np.linspace(0, 1, a)
    if b:
        x[-b:] *= np.linspace(1, 0, b)
    return x


def save(name, x, peak=0.8, stereo_width=0.0):
    x = x / (np.max(np.abs(x)) + 1e-9) * peak
    if stereo_width:
        d = int(SR * 0.012)
        left = x
        right = np.concatenate([np.zeros(d), x[:-d]]) * (1 - stereo_width) + x * stereo_width
        data = np.stack([left, right], axis=1)
    else:
        data = np.stack([x, x], axis=1)
    pcm = (np.clip(data, -1, 1) * 32767).astype("<i2")
    os.makedirs(OUT, exist_ok=True)
    with wave.open(os.path.join(OUT, name), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print("wrote", name, f"{len(x) / SR:.2f}s")


def karplus(freq, sec, damp=0.996, bright=0.5):
    """琴のような撥弦音（Karplus-Strong）"""
    n = int(SR * sec)
    period = int(SR / freq)
    buf = rng.uniform(-1, 1, period) * bright + rng.uniform(-1, 1, period) * (1 - bright) * 0.3
    out = np.zeros(n)
    for i in range(n):
        j = i % period
        out[i] = buf[j]
        buf[j] = damp * 0.5 * (buf[j] + buf[(j + 1) % period])
    # 爪で弾いたアタックを少し足す
    out[: int(SR * 0.01)] += band_noise(0.01, 2000, 6000) * 0.15
    return out


# ---------------------------------------------------------------- BGM
def bgm(sec=15.5):
    t = t_axis(sec)
    n = len(t)
    # 低く静かな持続音（D と A、ゆっくり呼吸する）
    breath = 0.6 + 0.4 * np.sin(2 * np.pi * t / 7.0 - np.pi / 2)
    drone = (np.sin(2 * np.pi * 73.4 * t) * 0.5 + np.sin(2 * np.pi * 110 * t + 0.3) * 0.3
             + np.sin(2 * np.pi * 146.8 * t) * 0.12) * breath
    drone *= np.clip(t / 2.0, 0, 1) * np.clip((sec - t) / 2.0, 0, 1)
    # 風のような柔らかい空気
    air = band_noise(sec, 300, 1200, tilt=1.0) * 0.05 * breath

    # 都節音階（D Eb G A Bb）でまばらな旋律。最後は高いDで止める
    D4, Eb4, G4, A4, Bb4, D5 = 293.7, 311.1, 392.0, 440.0, 466.2, 587.3
    notes = [
        (0.4, A4, 0.9), (1.6, G4, 0.7), (2.6, D4, 0.8),
        (4.2, Bb4, 0.6), (5.0, A4, 0.6), (6.4, G4, 0.7),
        (8.1, D5, 0.55), (11.0, Eb4, 0.5), (11.4, D4, 0.75),
    ]
    koto = np.zeros(n)
    for start, f, vol in notes:
        k = karplus(f, min(3.5, sec - start), damp=0.9965) * vol
        i = int(start * SR)
        koto[i:i + len(k)] += k[: n - i]
    mix = drone * 0.35 + air + koto * 0.55
    return fade(mix, 0.01, 1.2)


# ---------------------------------------------------------------- 効果音
def torori():
    """衣の「とろっ」：粘りのある低い水音を2つ"""
    out = np.zeros(int(SR * 0.9))
    for start, f0, vol in [(0.0, 260, 1.0), (0.38, 200, 0.6)]:
        n = int(SR * 0.28)
        t = np.arange(n) / SR
        f = f0 * np.exp(-t * 5.5) + 70
        ph = 2 * np.pi * np.cumsum(f) / SR
        g = np.sin(ph) * env_ad(n, 0.015, 0.07)
        g += band_noise(0.28, 150, 900, tilt=1.5) * env_ad(n, 0.005, 0.03) * 0.25
        i = int(start * SR)
        out[i:i + n] += g * vol
    return fade(out)


def juwa(sec=4.8):
    """油の「ジュワーッ」：最初に大きく、だんだん落ち着くパチパチ"""
    n = int(SR * sec)
    t = np.arange(n) / SR
    hiss = band_noise(sec, 2500, 9000) * (0.25 + 0.75 * np.exp(-t / 0.6))
    hiss *= np.clip(t / 0.03, 0, 1)
    body = band_noise(sec, 400, 2500, tilt=0.5) * 0.35 * np.exp(-t / 1.2)
    # はねる油（短いクリック）
    pops = np.zeros(n)
    rate = lambda tt: 40 * np.exp(-tt / 1.0) + 9  # noqa: E731
    tt = 0.02
    while tt < sec - 0.05:
        i = int(tt * SR)
        m = int(SR * 0.006)
        click = band_noise(0.006, 1500, 7000) * env_ad(m, 0.0005, 0.0015)
        pops[i:i + m] += click * rng.uniform(0.3, 1.0)
        tt += rng.exponential(1 / rate(tt))
    mix = hiss * 0.55 + body + pops * 0.9
    return fade(mix, 0.002, 0.8)


def rin(sec=4.5):
    """おりん「ちーん」：金属の倍音がうなりながら長く残る"""
    t = t_axis(sec)
    f0 = 523.0
    partials = [(1.0, 1.0, 3.2), (2.71, 0.55, 2.0), (5.15, 0.3, 1.1), (8.3, 0.15, 0.6), (11.9, 0.07, 0.35)]
    out = np.zeros(len(t))
    for ratio, amp, tau in partials:
        f = f0 * ratio
        beat = 1 + 0.35 * np.sin(2 * np.pi * (1.3 + ratio * 0.2) * t)  # わずかなうなり
        out += amp * beat * np.sin(2 * np.pi * f * t) * np.exp(-t / tau)
    strike = band_noise(0.02, 1500, 8000) * env_ad(int(SR * 0.02), 0.0005, 0.004) * 0.3
    out[: len(strike)] += strike
    return fade(out, 0.001, 0.4)


def saku():
    """天ぷらをかじる「サクッ」：細かい破砕音が3〜4つ重なる"""
    out = np.zeros(int(SR * 0.45))
    for start, vol in [(0.0, 1.0), (0.025, 0.7), (0.06, 0.8), (0.11, 0.4), (0.17, 0.25)]:
        m = int(SR * 0.04)
        burst = band_noise(0.04, 1200, 7500) * env_ad(m, 0.001, 0.008)
        i = int(start * SR)
        out[i:i + m] += burst * vol
    # 口の中の小さな低音
    m = int(SR * 0.12)
    tt = np.arange(m) / SR
    out[:m] += np.sin(2 * np.pi * 140 * tt) * env_ad(m, 0.003, 0.03) * 0.25
    return fade(out, 0.001, 0.1)


def poto():
    """煩悩を衣に落とす小さな「ぽと」"""
    m = int(SR * 0.18)
    tt = np.arange(m) / SR
    f = 520 * np.exp(-tt * 18) + 160
    return fade(np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(m, 0.002, 0.04))


def kachi():
    """箸が器に当たる「かちっ」：木の短い響き"""
    m = int(SR * 0.25)
    tt = np.arange(m) / SR
    tone = (np.sin(2 * np.pi * 1850 * tt) * 0.6 + np.sin(2 * np.pi * 3120 * tt) * 0.3) * np.exp(-tt / 0.03)
    click = band_noise(0.25, 1500, 6000) * np.exp(-tt / 0.004) * 0.5
    return fade(tone + click, 0.0005, 0.05)


def pochi():
    """干し柿をそっとつまむ「ぷち」"""
    m = int(SR * 0.2)
    tt = np.arange(m) / SR
    f = 380 * np.exp(-tt * 25) + 140
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(m, 0.002, 0.03)
    return fade(body + band_noise(0.2, 800, 3000) * env_ad(m, 0.001, 0.006) * 0.4)


def pon():
    """みかんの「ぽん」：中が空洞っぽい軽い音"""
    m = int(SR * 0.35)
    tt = np.arange(m) / SR
    f = 520 * np.exp(-tt * 9) + 220
    return fade(np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(m, 0.003, 0.08))


def fuwa(sec=0.9):
    """場面転換の「ふわっ」：やわらかい風"""
    n = int(SR * sec)
    t = np.arange(n) / SR
    env = np.sin(np.pi * np.clip(t / sec, 0, 1)) ** 2
    return fade(band_noise(sec, 300, 2500, tilt=1.2) * env, 0.01, 0.1)


def suu(sec=3.6):
    """寝息「すぅ…」を2回"""
    n = int(SR * sec)
    t = np.arange(n) / SR
    env = np.clip(np.sin(2 * np.pi * t / 1.8), 0, 1) ** 2
    return fade(band_noise(sec, 250, 1400, tilt=1.6) * env, 0.05, 0.4)


if __name__ == "__main__":
    save("kachi.wav", kachi(), peak=0.7)
    save("pochi.wav", pochi(), peak=0.6)
    save("pon.wav", pon(), peak=0.65)
    save("fuwa.wav", fuwa(), peak=0.5, stereo_width=0.6)
    save("suu.wav", suu(), peak=0.45, stereo_width=0.4)
    save("bgm.wav", bgm(), peak=0.55, stereo_width=0.6)
    save("torori.wav", torori(), peak=0.7)
    save("poto.wav", poto(), peak=0.6)
    save("juwa.wav", juwa(), peak=0.75, stereo_width=0.5)
    save("rin.wav", rin(), peak=0.7, stereo_width=0.7)
    save("saku.wav", saku(), peak=0.85)
