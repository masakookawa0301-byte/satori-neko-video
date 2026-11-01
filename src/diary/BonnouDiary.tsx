import { loadFont } from "@remotion/google-fonts/ShipporiMincho";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Steam } from "../tempura/effects";

/**
 * さとりねこの煩悩日記「食欲の秋」（15秒）
 * 絵は satori-neko の公開・予約済み（承認済み）の投稿画像を使用：
 *  1 新米（10/17）・2 干し柿（10/30朝）・3 こたつ（11/7朝）・4 ねる（11/1夜）
 */
const { fontFamily } = loadFont("normal", {
  weights: ["500", "700"],
  subsets: ["japanese"],
  ignoreTooManyRequestsWarning: true,
});

const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);
const PAPER = "#f4efe4";
const INK = "#3a3530";
const CROSS = 12;
export const DIARY_DURATION = s(15);

type Shot = {
  file: string;
  at: number; // 開始秒
  len: number; // 長さ（秒）
  // 画像（正方形）を高さ1920に合わせたときの、横位置（左端からのずれ px）と拡大率の始点→終点
  x: [number, number];
  zoom: [number, number];
  origin: string;
  caption: string;
  capAt: number; // 場面内で字幕が出る秒
  night?: boolean; // 夜の絵：白い字＋暗い帯
};

// 正方形1254px → 1920px角。横は 1920-1080=840px 分パンできる
const SHOTS: Shot[] = [
  { file: "1-shinmai", at: 0, len: 3.8, x: [-60, -760], zoom: [1.0, 1.06], origin: "70% 55%", caption: "新米。\nひと口だけ。", capAt: 0.6 },
  { file: "2-hoshigaki", at: 3.8, len: 3.4, x: [-260, -560], zoom: [1.04, 1.12], origin: "55% 50%", caption: "干し柿も、\nひとつだけ。", capAt: 0.5 },
  { file: "3-kotatsu", at: 7.2, len: 3.4, x: [-120, -520], zoom: [1.02, 1.08], origin: "55% 50%", caption: "みかんは、\n別腹。", capAt: 0.5 },
  { file: "4-neru", at: 10.6, len: 4.4, x: [-420, -470], zoom: [1.0, 1.14], origin: "55% 62%", caption: "…まあ、\nええか。", capAt: 1.0, night: true },
];

const ShotView: React.FC<{ shot: Shot; first: boolean; last: boolean }> = ({ shot, first, last }) => {
  const f = useCurrentFrame();
  const dur = s(shot.len) + CROSS;
  const t = interpolate(f, [0, dur], [0, 1], { easing: Easing.inOut(Easing.sin) });
  const x = interpolate(t, [0, 1], shot.x);
  const zoom = interpolate(t, [0, 1], shot.zoom);
  const fadeIn = first ? 1 : interpolate(f, [0, CROSS], [0, 1], { extrapolateRight: "clamp" });
  const cap = interpolate(f, [s(shot.capAt), s(shot.capAt) + 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const capOut = last ? 1 : interpolate(f, [dur - CROSS - 6, dur - CROSS + 4], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: shot.origin }}>
        <Img
          src={staticFile(`images/diary/${shot.file}.png`)}
          style={{ position: "absolute", top: 0, left: x, width: 1920, height: 1920 }}
        />
        {/* 新米の湯気を足す（絵の湯気に重ねて動かす） */}
        {shot.file === "1-shinmai" && (
          <div style={{ position: "absolute", left: x, top: 0, width: 1920, height: 1920 }}>
            <Steam x={590} y={760} count={4} height={380} color="rgba(255,252,244,0.95)" />
          </div>
        )}
      </AbsoluteFill>

      {/* 字幕の下に和紙色を薄く敷いて読みやすく */}
      <AbsoluteFill
        style={{
          background: shot.night
            ? `linear-gradient(rgba(16,12,9,${0.7 * cap}) 0%, rgba(16,12,9,${0.45 * cap}) 22%, rgba(16,12,9,0) 38%)`
            : `linear-gradient(rgba(244,239,228,${0.86 * cap * capOut}) 0%, rgba(244,239,228,${0.6 * cap * capOut}) 22%, rgba(244,239,228,0) 36%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 250,
          left: 0,
          right: 0,
          textAlign: "center",
          whiteSpace: "pre-line",
          fontFamily,
          fontWeight: 500,
          fontSize: 76,
          lineHeight: 1.5,
          color: shot.night ? "#f4efe4" : INK,
          opacity: cap * capOut,
          transform: `translateY(${(1 - cap) * 14}px)`,
        }}
      >
        {shot.caption}
      </div>
    </AbsoluteFill>
  );
};

const Sfx: React.FC<{ at: number; file: string; volume?: number }> = ({ at, file, volume = 1 }) => (
  <Sequence from={s(at)} name={`音 ${file}`}>
    <Audio src={staticFile(`audio/${file}`)} volume={volume} />
  </Sequence>
);

export const BonnouDiary: React.FC = () => {
  const f = useCurrentFrame();
  const end = SHOTS[SHOTS.length - 1];
  const title = interpolate(f, [s(13.0), s(13.6)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      {SHOTS.map((shot, i) => (
        <Sequence key={shot.file} from={s(shot.at)} durationInFrames={s(shot.len) + CROSS} name={shot.file}>
          <ShotView shot={shot} first={i === 0} last={i === SHOTS.length - 1} />
        </Sequence>
      ))}

      {/* 最後：夜を少し落として、シリーズ名 */}
      <AbsoluteFill style={{ backgroundColor: `rgba(20,16,12,${0.35 * title})` }} />
      <div
        style={{
          position: "absolute",
          bottom: 470,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily,
          fontWeight: 500,
          fontSize: 44,
          letterSpacing: 6,
          color: "#f4efe4",
          opacity: title,
        }}
      >
        さとりねこの煩悩日記
      </div>
      <AbsoluteFill
        style={{
          backgroundColor: "#100c09",
          opacity: interpolate(f, [DIARY_DURATION - 10, DIARY_DURATION], [0, 1], { extrapolateLeft: "clamp" }),
        }}
      />

      {/* ───── 音 */}
      <Audio
        src={staticFile("audio/bgm.wav")}
        volume={(fr) =>
          interpolate(fr, [0, 12, DIARY_DURATION - 36, DIARY_DURATION], [0, 0.4, 0.4, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
      <Sfx at={1.2} file="kachi.wav" volume={0.55} />
      {SHOTS.slice(1).map((sh) => (
        <Sfx key={sh.file} at={sh.at - 0.35} file="fuwa.wav" volume={0.35} />
      ))}
      <Sfx at={SHOTS[1].at + 1.6} file="pochi.wav" volume={0.7} />
      <Sfx at={SHOTS[2].at + 1.5} file="pon.wav" volume={0.6} />
      <Sfx at={end.at + 0.4} file="suu.wav" volume={0.5} />
      <Sfx at={13.0} file="rin.wav" volume={0.6} />
    </AbsoluteFill>
  );
};
