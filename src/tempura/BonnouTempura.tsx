import { loadFont } from "@remotion/google-fonts/ShipporiMincho";
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { INK, PAPER } from "../neko/ink";
import { hasArt, ImageAgeru, ImageGassho, ImageKoromo, ImageKuu } from "./imageShots";
import { BITE_FRAME, SceneAgeru, SceneGassho, SceneKoromo, SceneKuu } from "./scenes";

// ② で煩悩が油に落ちるフレーム（場面の頭から）
const DROP_FRAME = 50;

const { fontFamily } = loadFont("normal", {
  weights: ["500"],
  subsets: ["japanese"],
  ignoreTooManyRequestsWarning: true,
});

const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);

// 絵コンテ（台本/01_煩悩の天ぷら.md）の秒数
const SCENES = {
  koromo: [0, 3.5],
  ageru: [3.5, 8],
  gassho: [8, 11],
  kuu: [11, 15],
} as const;
const CAPTION_AT = 13;
export const TEMPURA_DURATION = s(15);

const CROSS = 8; // 場面のつなぎ（フレーム）

/** 場面を少し重ねて、和紙ごとふわっと切り替える */
const Scene: React.FC<{ range: readonly [number, number]; first?: boolean; children: React.ReactNode; name: string }> = ({
  range,
  first,
  children,
  name,
}) => (
  <Sequence from={s(range[0])} durationInFrames={s(range[1] - range[0]) + CROSS} name={name}>
    <FadeIn skip={first}>{children}</FadeIn>
  </Sequence>
);

const FadeIn: React.FC<{ skip?: boolean; children: React.ReactNode }> = ({ skip, children }) => {
  const frame = useCurrentFrame();
  const o = skip ? 1 : interpolate(frame, [0, CROSS], [0, 1], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

/** 効果音を秒数で置く */
const Sfx: React.FC<{ at: number; file: string; volume?: number | ((f: number) => number); dur?: number }> = ({
  at,
  file,
  volume = 1,
  dur,
}) => (
  <Sequence from={s(at)} durationInFrames={dur ? s(dur) : undefined} name={`音 ${file}`}>
    <Audio src={staticFile(`audio/${file}`)} volume={volume} />
  </Sequence>
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
        top: 250,
        left: 0,
        right: 0,
        textAlign: "center",
        fontFamily,
        fontSize: 66,
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

export const BonnouTempura: React.FC = () => {
  const frame = useCurrentFrame();
  const juwaStart = SCENES.ageru[0] + DROP_FRAME / FPS; // ② で油に落ちる瞬間

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <Scene range={SCENES.koromo} first name="① 衣">
        {hasArt("koromo") ? <ImageKoromo /> : <SceneKoromo />}
      </Scene>
      <Scene range={SCENES.ageru} name="② 揚げる">
        {hasArt("ageru") ? <ImageAgeru dropAt={DROP_FRAME} /> : <SceneAgeru />}
      </Scene>
      <Scene range={SCENES.gassho} name="③ 合掌">
        {hasArt("gassho") ? <ImageGassho /> : <SceneGassho />}
      </Scene>
      <Scene range={SCENES.kuu} name="④ 食べる">
        {hasArt("mae") && hasArt("ato") ? <ImageKuu biteAt={BITE_FRAME} /> : <SceneKuu />}
      </Scene>

      <Sequence from={s(CAPTION_AT)} name="字幕">
        <Caption text="…ちょっと、うまい。" />
      </Sequence>

      {/* ───── 音（scripts/make_sounds.py で合成） */}
      <Audio
        src={staticFile("audio/bgm.wav")}
        volume={(f) =>
          interpolate(f, [0, 15, TEMPURA_DURATION - 30, TEMPURA_DURATION], [0, 0.42, 0.42, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
      <Sfx at={1.6} file="poto.wav" volume={0.7} />
      <Sfx at={2.2} file="torori.wav" volume={0.8} />
      <Sfx
        at={juwaStart}
        file="juwa.wav"
        dur={SCENES.gassho[0] + 0.4 - juwaStart}
        volume={(f) => interpolate(f, [0, 70, 94], [0.75, 0.55, 0], { extrapolateRight: "clamp" })}
      />
      <Sfx at={SCENES.gassho[0] + 16 / FPS} file="rin.wav" volume={0.75} />
      <Sfx at={SCENES.kuu[0] + BITE_FRAME / FPS} file="saku.wav" volume={1} />

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
