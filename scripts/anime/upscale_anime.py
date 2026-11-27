"""アニメ用の高画質化（Real-ESRGAN realesr-animevideov3, ×4）をCPUで行う。

使い方: python3 upscale_anime.py WEIGHTS.pth 入力フォルダ 出力フォルダ [出力の横幅]
  入力フォルダのPNGを4倍にしてから、指定の横幅（既定1280）に縮めて保存する。
  小さいコマを引き伸ばしたときのぼやけを減らし、線をくっきりさせる。
"""

import glob
import os
import sys

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image


class SRVGGNetCompact(nn.Module):
    def __init__(self, num_in_ch=3, num_out_ch=3, num_feat=64, num_conv=16, upscale=4):
        super().__init__()
        self.upscale = upscale
        body = [nn.Conv2d(num_in_ch, num_feat, 3, 1, 1), nn.PReLU(num_parameters=num_feat)]
        for _ in range(num_conv):
            body += [nn.Conv2d(num_feat, num_feat, 3, 1, 1), nn.PReLU(num_parameters=num_feat)]
        body += [nn.Conv2d(num_feat, num_out_ch * upscale * upscale, 3, 1, 1)]
        self.body = nn.ModuleList(body)
        self.upsampler = nn.PixelShuffle(upscale)

    def forward(self, x):
        out = x
        for m in self.body:
            out = m(out)
        out = self.upsampler(out)
        return out + F.interpolate(x, scale_factor=self.upscale, mode="nearest")


def load(weights):
    net = SRVGGNetCompact()
    sd = torch.load(weights, map_location="cpu")
    sd = sd.get("params", sd)
    net.load_state_dict(sd, strict=True)
    return net.eval()


@torch.no_grad()
def upscale(net, im):
    x = torch.from_numpy(np.asarray(im.convert("RGB"), np.float32) / 255).permute(2, 0, 1)[None]
    y = net(x).clamp(0, 1)[0].permute(1, 2, 0).numpy()
    return Image.fromarray((y * 255 + 0.5).astype(np.uint8))


if __name__ == "__main__":
    weights, src, dst = sys.argv[1:4]
    width = int(sys.argv[4]) if len(sys.argv) > 4 else 1280
    torch.set_num_threads(os.cpu_count() or 2)
    net = load(weights)
    os.makedirs(dst, exist_ok=True)
    fs = sorted(glob.glob(f"{src}/*.png"))
    for i, f in enumerate(fs):
        out = os.path.join(dst, os.path.basename(f))
        if os.path.exists(out):
            continue
        big = upscale(net, Image.open(f))
        h = round(big.height * width / big.width)
        big.resize((width, h), Image.LANCZOS).save(out)
        if i % 20 == 0:
            print(f"{i + 1}/{len(fs)}", flush=True)
