# さとりねこ 動画

さとりねこの縦型ショート動画（TikTok・YouTubeショート・リール）を、Remotion（コードで動画を作る仕組み）で作るプロジェクトです。

キャラクター設定・絵柄のルール・元の画像は [satori-neko](https://github.com/masakookawa0301-byte/satori-neko) リポジトリにあります。動画でもそちらの `character_rules.md` と `docs/` の方針に従います。

## フォルダ

| フォルダ | 中身 |
|---|---|
| `src/` | 動画のコード。1本ごとに1ファイル（例：`GyounRyusui.tsx`）。`Root.tsx` に登録する |
| `public/images/` | 動画で使う画像（satori-neko から承認済みの画像をコピー） |
| `素材/` | 元素材の置き場（使う前の画像など） |
| `台本/` | 動画ごとの台本・絵コンテ |
| `音声/` | BGM・効果音・ナレーション |
| `完成動画/` | 書き出したMP4 |

## 動画の基本仕様

- 1080×1920（9:16）、30fps
- 文字は画面の上半分を中心に置く。下の約300pxと右端は、各アプリのボタンや説明文で隠れやすいため避ける
- 書体：しっぽり明朝（Google Fonts）

## 作業コマンド

```bash
npm i                 # 最初の1回
npm run dev           # プレビュー画面（Remotion Studio）を開く
npx remotion render GyounRyusui 完成動画/xxx.mp4   # MP4を書き出す
npm run lint          # コードの確認
```

## これまでの動画

| ID | 内容 | 使った画像 | 状態 |
|---|---|---|---|
| `GyounRyusui` | 行雲流水（14秒・音なし）。動作確認用のサンプル | satori-neko `posts/2026-10-27_11-07/2026-10-27-morning.png`（X予約済みの承認画像） | 試作・未承認 |
| `BonnouTempura` | 第1話「煩悩の天ぷら」（15秒・BGM/効果音あり予定・声なし）。台本は `台本/01_煩悩の天ぷら.md` | `public/images/tempura/`（未制作。今は仮の枠） | Vコンテ・台本レビュー中 |
