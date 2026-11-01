import { loadFont } from "@remotion/google-fonts/ShipporiMincho";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Bubbles, Steam } from "./effects";

const { fontFamily } = loadFont("normal", {
  weights: ["500"],
  subsets: ["japanese"],
  ignoreTooManyRequestsWarning: true,
});

export const PAPER = "#f4efe4";
const INK = "#3a3530";

// 絵ができたら true にして public/images/tempura/ に置く
export const ART_READY = {
  koromo: false,
  ageru: false,
  gassho: false,
  mae: false,
  ato: false,
};

const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);

// 絵コンテ（台本/01_煩悩の天ぷら.md）の秒数
export const TIMING = {
  koromo: [0, 3.5],
  ageru: [3.5, 8],
  gassho: [8, 11],
  kuu: [11, 15],
  bite: 12.3,
  caption: 13,
} as const;
export const TEMPURA_DURATION = s(15);

const CROSS = 8; // 場面のつなぎ（フレーム）

type ShotProps = {
  file: keyof typeof ART_READY;
  label: string;
  zoom: [number, number];
  pan?: [number, number];
  origin?: string;
};

// 1枚の絵をゆっくり寄せる・流す。絵がまだなら仮の枠を出す
const Shot: React.FC<ShotProps> = ({ file, label, zoom, pan = [0, 0], origin = "50% 50%" }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = interpolate(frame, [0, durationInFrames], [0, 1], {
    easing: Easing.inOut(Easing.sin),
  });
  const scale = interpolate(t, [0, 1], zoom);
  const x = interpolate(t, [0, 1], pan);
  const opacity = interpolate(
    frame,
    [0, CROSS, durationInFrames - CROSS, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill
        style={{ transform: `translateX(${x}px) scale(${scale})`, transformOrigin: origin }}
      >
        {ART_READY[file] ? (
          <Img
            src={staticFile(`images/tempura/${file}.png`)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Placeholder label={label} />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Placeholder: React.FC<{ label: string }> = ({ label }) => (
  <AbsoluteFill
    style={{
      backgroundColor: PAPER,
      alignItems: "center",
      justifyContent: "center",
      fontFamily,
      color: "#9a9184",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 60,
        border: "4px dashed #c9bfae",
        borderRadius: 24,
      }}
    />
    <div style={{ fontSize: 56, textAlign: "center", lineHeight: 1.6, whiteSpace: "pre-line" }}>
      {label}
    </div>
  </AbsoluteFill>
);

const Caption: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 18], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  return (
    <div
      style={{
        position: "absolute",
        top: 300,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily,
        fontSize: 64,
        color: INK,
        opacity: o,
        transform: `translateY(${(1 - o) * 12}px)`,
        textShadow: `0 0 18px ${PAPER}, 0 0 8px ${PAPER}`,
      }}
    >
      {text}
    </div>
  );
};

const seq = (a: number, b: number) => ({
  from: s(a),
  durationInFrames: s(b - a) + CROSS,
});

export const BonnouTempura: React.FC = () => {
  const frame = useCurrentFrame();
  const biteAt = s(TIMING.bite - TIMING.kuu[0]);

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      {/* ① 衣にくぐらせる */}
      <Sequence {...seq(...TIMING.koromo)} name="① 衣">
        <Shot file="koromo" label={"① 手元の寄り\n衣にくぐらせる"} zoom={[1.0, 1.08]} origin="50% 60%" />
      </Sequence>

      {/* ② 油に入れる＋泡・湯気 */}
      <Sequence {...seq(...TIMING.ageru)} name="② 揚げる">
        <Shot file="ageru" label={"② 横向き\n油にそっと入れる"} zoom={[1.04, 1.1]} pan={[0, -30]} />
        <Sequence from={s(0.8)}>
          <Bubbles x={620} y={1240} width={360} />
          <Steam x={640} y={1150} count={4} />
        </Sequence>
      </Sequence>

      {/* ③ 皿の天ぷらと合掌（ほぼ静止の間） */}
      <Sequence {...seq(...TIMING.gassho)} name="③ 合掌">
        <Shot file="gassho" label={"③ 引き\n天ぷらひとつ・合掌"} zoom={[1.0, 1.02]} />
        <Steam x={520} y={1330} count={2} />
      </Sequence>

      {/* ④ 口元：かじる前 → かじった後 */}
      <Sequence {...seq(...TIMING.kuu)} name="④ 食べる">
        <Sequence durationInFrames={biteAt}>
          <Shot file="mae" label={"④a 口元の寄り\nかじる前"} zoom={[1.0, 1.04]} />
        </Sequence>
        <Sequence from={biteAt}>
          <BiteShake>
            <Shot file="ato" label={"④b 同じ構図\nひと口かじった後"} zoom={[1.04, 1.06]} />
          </BiteShake>
        </Sequence>
      </Sequence>

      <Sequence from={s(TIMING.caption)} name="字幕">
        <Caption text="…ちょっと、うまい。" />
      </Sequence>

      {/* 最後に和紙色へ溶ける */}
      <AbsoluteFill
        style={{
          backgroundColor: PAPER,
          opacity: interpolate(frame, [TEMPURA_DURATION - 12, TEMPURA_DURATION], [0, 1], {
            extrapolateLeft: "clamp",
          }),
        }}
      />
    </AbsoluteFill>
  );
};

// かじった瞬間だけ、ほんの少し揺らす
const BiteShake: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const y = interpolate(frame, [0, 3, 8], [0, 6, 0], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ transform: `translateY(${y}px)` }}>{children}</AbsoluteFill>;
};
