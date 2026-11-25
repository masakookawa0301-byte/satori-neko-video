#@title ② GitHubの原画をまとめて中割り
中割りの枚数 = 16  #@param {type:"slider", min:8, max:32, step:8}
ステップ数 = 20  #@param {type:"slider", min:10, max:50, step:5}
シード = 123  #@param {type:"integer"}
import json, uuid, glob, urllib.request, time, os, subprocess, zipfile, shutil, re
from google.colab import files
from PIL import Image, ImageOps
PROMPTS={'cut01':'a cute white cat drooling and dreaming of mushroom hot pot','cut04':'a cute white cat tying a headband tightly','cut06':'a cute white cat cutting the stem off a big shiitake mushroom with a knife',
 'cut07':'a cute white cat tearing a maitake mushroom apart with its paws','cut09':'a cute white cat slicing a mushroom with a kitchen knife','cut10':'a cute white cat sneaking a mushroom into its mouth and chewing',
 'cut11':'a dizzy white cat with swirl eyes, floating rabbit fish and dango spirits','cut14':'a cute white cat eating mushrooms with chopsticks, steam rising'}
W='/content/batch'; shutil.rmtree(W,ignore_errors=True)
subprocess.run(f'git clone -q --depth 1 -b anime-work https://github.com/masakookawa0301-byte/satori-neko-video {W}',shell=True,check=True)
DONE=set(os.listdir('/content/out')) if os.path.exists('/content/out') else set()
cuts={}
for d,_,fs in os.walk(f'{W}/anime_work/03_kinokonabe'):  # 原画フォルダだけを見る（完成済みの⑨などは対象外）
    name=os.path.basename(d)
    if not re.fullmatch(r'cut\d\d',name): continue
    imgs=sorted([f for f in fs if f.lower().endswith(('.png','.jpg','.jpeg')) and not f.startswith('._')])
    if len(imgs)>=2: cuts[name]=[os.path.join(d,f) for f in imgs]
print('処理するカット:',sorted(cuts))
OUT='/content/out'; os.makedirs(OUT,exist_ok=True)
IN='/content/ComfyUI/input'; os.makedirs(IN,exist_ok=True)
def run(cut,paths):
    keys=[]
    for i,p in enumerate(paths):
        im=ImageOps.fit(Image.open(p).convert('RGB'),(512,320),Image.LANCZOS); k=f'{cut}_{i}.png'; im.save(f'{IN}/{k}'); keys.append(k)
    wf={"1":{"class_type":"CLIPLoader","inputs":{"clip_name":"sd21_clip_fp16.safetensors","type":"stable_diffusion"}},
        "2":{"class_type":"CLIPTextEncode","inputs":{"text":PROMPTS.get(cut,'a cute white cat, hand-drawn anime')+', hand-drawn anime',"clip":["1",0]}},
        "3":{"class_type":"CLIPTextEncode","inputs":{"text":"blurry, distorted, deformed, text, watermark","clip":["1",0]}},
        "4":{"class_type":"CLIPVisionLoader","inputs":{"clip_name":"CLIP-ViT-H-fp16.safetensors"}},
        "5":{"class_type":"DynamiCrafterModelLoader","inputs":{"ckpt_name":"dynamicrafter/tooncrafter_512_interp-pruned-fp16.safetensors","dtype":"fp16","fp8_unet":False}}}
    for i,k in enumerate(keys): wf[f"L{i}"]={"class_type":"LoadImage","inputs":{"image":k}}
    prev=["L0",0]
    for i in range(1,len(keys)): wf[f"B{i}"]={"class_type":"ImageBatch","inputs":{"image1":prev,"image2":[f"L{i}",0]}}; prev=[f"B{i}",0]
    wf["9"]={"class_type":"ToonCrafterInterpolation","inputs":{"model":["5",0],"clip_vision":["4",0],"positive":["2",0],"negative":["3",0],"images":prev,"steps":ステップ数,"cfg":7.0,"eta":1.0,"frames":中割りの枚数,"seed":シード,"fs":10,"vae_dtype":"fp16"}}
    wf["10"]={"class_type":"ToonCrafterDecode","inputs":{"model":["5",0],"latent":["9",0],"vae_dtype":"fp16"}}
    wf["11"]={"class_type":"SaveImage","inputs":{"images":["10",0],"filename_prefix":cut}}
    for f in glob.glob(f'/content/ComfyUI/output/{cut}_*.png'): os.remove(f)
    pid=json.loads(urllib.request.urlopen(urllib.request.Request('http://127.0.0.1:8188/prompt',data=json.dumps({"prompt":wf}).encode(),headers={'Content-Type':'application/json'})).read())['prompt_id']
    while True:
        time.sleep(5); h=json.loads(urllib.request.urlopen(f'http://127.0.0.1:8188/history/{pid}').read())
        if pid in h:
            st=h[pid].get('status',{})
            if st.get('status_str')=='error': print('  エラー:',json.dumps(st.get('messages',[]))[-600:]); return
            break
    fd=f'{OUT}/{cut}_frames'; os.makedirs(fd)
    for f in sorted(glob.glob(f'/content/ComfyUI/output/{cut}_*.png')): shutil.copy(f,fd)
    subprocess.run(['ffmpeg','-y','-loglevel','error','-framerate','12','-pattern_type','glob','-i',f'{fd}/*.png','-c:v','libx264','-pix_fmt','yuv420p',f'{OUT}/{cut}.mp4'])
for cut in sorted(cuts):
    if f'{cut}.mp4' in DONE: print('済',cut); continue
    t0=time.time(); print(f'▶ {cut}（{len(cuts[cut])}枚）生成中...')
    run(cut,cuts[cut]); print(f'  完了 {int(time.time()-t0)}秒')
subprocess.run('cd /content/out && zip -q -r /content/nakawari_all.zip .',shell=True)
print('✅ 全部完了！ nakawari_all.zip をダウンロードします'); files.download('/content/nakawari_all.zip')