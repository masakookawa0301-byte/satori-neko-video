"""切り絵アニメ（パーツアニメ）の道具。

Codexが白背景に描いた部品（1536×1024、全部品で位置をそろえたもの）を
透明PNGに切り抜き、位置・回転を時間で動かして 1280×720 のコマを作る。

猫は白いので「白を全部消す」と手まで透ける。画像の端から続いている白だけを背景とみなす。
"""

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

W, H, FPS = 1280, 720, 24


def cut_out(path, thresh=236):
    """端とつながった白だけを透明にする"""
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(np.int16)
    white = (a.min(axis=2) >= thresh)
    lab, _ = ndimage.label(white)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    # 線のふちの白っぽい部分を少し削ってなじませる
    bg = ndimage.binary_dilation(bg, iterations=1)
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    alpha_img = Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(0.8))
    rgba = im.convert("RGBA")
    rgba.putalpha(alpha_img)
    return rgba


def bbox_alpha(img):
    return img.getchannel("A").getbbox()


def ease_out(t):
    return 1 - (1 - t) ** 3


def ease_in(t):
    return t ** 3


def ease_io(t):
    return t * t * (3 - 2 * t)


def lerp(a, b, t):
    return a + (b - a) * t


def place(canvas, part, dx=0.0, dy=0.0, angle=0.0, pivot=None):
    """part（シーンと同じ大きさの透明PNG）を dx,dy ずらし、pivot を中心に angle 度回して重ねる"""
    if angle:
        part = part.rotate(angle, resample=Image.BICUBIC, center=pivot)
    canvas.alpha_composite(part, (int(round(dx)), int(round(dy))))


def to_frame(scene):
    """1536×1024 のシーン → 1280×720（16:10に合わせてから中央を切り出し）"""
    from PIL import ImageOps
    im = ImageOps.fit(scene.convert("RGB"), (1280, 800), Image.LANCZOS)
    return im.crop((0, 40, 1280, 760))
