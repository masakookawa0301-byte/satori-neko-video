import { loadFont } from "@remotion/google-fonts/ShipporiMincho";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const { fontFamily } = loadFont("normal", {
  weights: ["500", "700"],
  subsets: ["japanese"],
});

// 和紙の地色と墨色（character_rules.md の「生成り・墨」）
const PAPER = "#f4efe4";
const INK = "#3a3530";
const SHU = "#b5483b"; // 落款の朱

const fade = (frame: number, start: number, length = 24) =>
  interpolate(frame, [start, start + length], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

export const GyounRyusui: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();

  // 絵はゆっくり寄りながら、少し右（さとりねこ側）へ流れる
  const zoom = interpolate(frame, [0, durationInFrames], [1.0, 1.12]);
  const panX = interpolate(frame, [0, durationInFrames], [0, -40]);

  const titleIn = fade(frame, 0.5 * fps, 36);
  // 前半の2行 → いったん消えて、同じ場所に締めの2行
  const firstOut = 1 - fade(frame, 7.5 * fps, 20);
  const line1In = fade(frame, 2.5 * fps) * firstOut;
  const line2In = fade(frame, 4 * fps) * firstOut;
  const line3In = fade(frame, 8.5 * fps, 30);
  const endOut = interpolate(
    frame,
    [durationInFrames - 20, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp" },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: PAPER, fontFamily, color: INK }}>
      <AbsoluteFill style={{ opacity: endOut }}>
        {/* 題字（縦書き） */}
        <div
          style={{
            position: "absolute",
            top: 150,
            right: 150,
            writingMode: "vertical-rl",
            fontSize: 100,
            fontWeight: 700,
            letterSpacing: 24,
            opacity: titleIn,
            transform: `translateY(${(1 - titleIn) * 20}px)`,
          }}
        >
          行雲流水
        </div>
        <div
          style={{
            position: "absolute",
            top: 670,
            right: 172,
            width: 56,
            height: 56,
            border: `3px solid ${SHU}`,
            color: SHU,
            fontSize: 38,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 4,
            opacity: titleIn,
          }}
        >
          悟
        </div>

        {/* 絵 */}
        <div
          style={{
            position: "absolute",
            top: 760,
            left: 0,
            width: 1080,
            height: 1080,
            overflow: "hidden",
          }}
        >
          <Img
            src={staticFile("images/gyoun-ryusui.png")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `translateX(${panX}px) scale(${zoom})`,
              transformOrigin: "75% 75%",
            }}
          />
          {/* 上下の端を和紙になじませる */}
          <AbsoluteFill
            style={{
              background: `linear-gradient(${PAPER} 0%, rgba(244,239,228,0) 18%, rgba(244,239,228,0) 85%, ${PAPER} 100%)`,
            }}
          />
        </div>

        {/* 本文 */}
        <div
          style={{
            position: "absolute",
            top: 360,
            left: 110,
            right: 360,
            fontSize: 50,
            lineHeight: 1.7,
            fontWeight: 500,
          }}
        >
          <div style={{ opacity: line1In }}>流れる雲と、</div>
          <div style={{ opacity: line2In }}>流れる水のように。</div>
        </div>
        <div
          style={{
            position: "absolute",
            top: 360,
            left: 110,
            right: 330,
            fontSize: 54,
            lineHeight: 1.6,
            fontWeight: 500,
            opacity: line3In,
            transform: `translateY(${(1 - line3In) * 16}px)`,
          }}
        >
          予定どおりに
          <br />
          いかない日も、
          <br />
          流れてるだけ。
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
