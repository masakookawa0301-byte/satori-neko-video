import {
  AbsoluteFill,
  Easing,
  getStaticFiles,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Bubbles, Steam } from "./effects";

/**
 * 生成画像の場面。public/images/tempura/<名前>.png を置くと、その場面はコードの絵から画像に切り替わる。
 * 名前：koromo（①）・ageru（②）・gassho（③）・mae / ato（④ かじる前・後）
 */
export type ArtName = "koromo" | "ageru" | "gassho" | "mae" | "ato";

export const hasArt = (name: ArtName) =>
  getStaticFiles().some((f) => f.name === `images/tempura/${name}.png`);

// 画像ごとの、湯気・泡を足す位置（絵を見てから合わせる）
export const OVERLAY = {
  ageru: { bubbles: { x: 600, y: 1250, width: 280 }, steam: { x: 600, y: 1150 } },
  gassho: { steam: { x: 540, y: 1250 } },
};

/** 1枚の絵をゆっくり寄せる */
const Still: React.FC<{ name: ArtName; zoom: [number, number]; origin?: string; pan?: [number, number] }> = ({
  name,
  zoom,
  origin = "50% 55%",
  pan = [0, 0],
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const t = interpolate(frame, [0, durationInFrames], [0, 1], { easing: Easing.inOut(Easing.sin) });
  return (
    <AbsoluteFill
      style={{
        transform: `translateX(${interpolate(t, [0, 1], pan)}px) scale(${interpolate(t, [0, 1], zoom)})`,
        transformOrigin: origin,
      }}
    >
      <Img src={staticFile(`images/tempura/${name}.png`)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </AbsoluteFill>
  );
};

export const ImageKoromo: React.FC = () => <Still name="koromo" zoom={[1.0, 1.08]} origin="50% 60%" />;

export const ImageAgeru: React.FC<{ dropAt: number }> = ({ dropAt }) => (
  <AbsoluteFill>
    <Still name="ageru" zoom={[1.03, 1.1]} pan={[0, -24]} />
    <Sequence from={dropAt}>
      <Bubbles {...OVERLAY.ageru.bubbles} />
      <Steam {...OVERLAY.ageru.steam} count={4} height={420} />
    </Sequence>
  </AbsoluteFill>
);

export const ImageGassho: React.FC = () => (
  <AbsoluteFill>
    <Still name="gassho" zoom={[1.0, 1.03]} />
    <Steam {...OVERLAY.gassho.steam} count={2} height={300} />
  </AbsoluteFill>
);

export const ImageKuu: React.FC<{ biteAt: number }> = ({ biteAt }) => {
  const frame = useCurrentFrame();
  const shake = interpolate(frame, [biteAt, biteAt + 3, biteAt + 8], [0, 6, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ transform: `translateY(${shake}px)` }}>
      <Sequence durationInFrames={biteAt}>
        <Still name="mae" zoom={[1.0, 1.04]} />
      </Sequence>
      <Sequence from={biteAt}>
        <Still name="ato" zoom={[1.04, 1.06]} />
      </Sequence>
    </AbsoluteFill>
  );
};
