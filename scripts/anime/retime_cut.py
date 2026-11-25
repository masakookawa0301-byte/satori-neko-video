import numpy as np, subprocess, wave
from PIL import Image
L=lambda i: Image.open(f'f/{i:02d}.png').convert('RGB')
ref=np.asarray(L(1).convert('L')).astype(float)
def align(i):
    im=L(i); a=np.asarray(im.convert('L')).astype(float); best=(1e9,0,0)
    for dy in range(-12,13,2):
        for dx in range(-12,13,2):
            e=np.abs(np.roll(np.roll(a,dy,0),dx,1)[80:420,20:260]-ref[80:420,20:260]).mean()
            if e<best[0]: best=(e,dx,dy)
    _,dx,dy=best
    if dx or dy:
        out=im.copy(); out.paste(im,(dx,dy)); im=out
    return im
FPS=24
plan=[(1,14),(4,1),(9,1),(13,1),(16,3),(20,1),(24,1),(28,1),(32,18)]
cache={}
seq=[]; t=0; events={}
for i,n in plan:
    if i not in cache: cache[i]=align(i)
    if i==16: events['sak']=t/FPS
    if i==32: events['ton']=t/FPS
    seq+= [cache[i]]*n; t+=n
SR=44100; N=int((len(seq)/FPS+0.3)*SR); out=np.zeros(N); rs=np.random.RandomState(1)
tt=np.arange(int(.18*SR))/SR; ton=np.exp(-tt*28)*(np.sin(2*np.pi*165*tt)+0.6*rs.randn(len(tt))*np.exp(-tt*90))
t2=np.arange(int(.1*SR))/SR; sak=np.exp(-t2*40)*rs.randn(len(t2))*0.5
i=int(events['sak']*SR); out[i:i+len(sak)]+=0.35*sak
i=int(events['ton']*SR); out[i:i+len(ton)]+=0.7*ton
out/=np.abs(out).max()*1.2; pcm=(out*32767).astype(np.int16)
with wave.open('sfx.wav','wb') as w: w.setnchannels(1);w.setsampwidth(2);w.setframerate(SR);w.writeframes(pcm.tobytes())
p=subprocess.Popen(['ffmpeg','-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s','1280x800','-r',str(FPS),'-i','-','-i','sfx.wav','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-c:a','aac','-shortest','cut09_v3.mp4'],stdin=subprocess.PIPE)
for im in seq: p.stdin.write(np.asarray(im.resize((1280,800),Image.LANCZOS)).tobytes())
p.stdin.close(); p.wait(); print(len(seq)/FPS, events)
