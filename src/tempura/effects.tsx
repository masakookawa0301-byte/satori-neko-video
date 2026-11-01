import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";

// 薄墨の湯気：ぼかした筋がゆらぎながら上がって消える
export const Steam: React.FC<{ x: number; y: number; count?: number; color?: string; height?: number }> = ({
  x,
  y,
  count = 3,
  color = "rgba(120,110,100,0.9)",
  height = 260,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {new Array(count).fill(0).map((_, i) => {
        const period = 70 + random(`steam-p-${i}`) * 30;
        const offset = random(`steam-o-${i}`) * period;
        const t = ((frame + offset) % period) / period;
        const rise = t * height;
        const sway = Math.sin((frame + offset) / 14) * 18;
        const opacity = interpolate(t, [0, 0.25, 1], [0, 0.28, 0]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + (i - (count - 1) / 2) * 46 + sway,
              top: y - rise,
              width: 34,
              height: 150,
              borderRadius: 40,
              background: color,
              filter: "blur(16px)",
              opacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// 油の泡：小さな丸が湧いては消える
export const Bubbles: React.FC<{ x: number; y: number; width: number }> = ({
  x,
  y,
  width,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {new Array(22).fill(0).map((_, i) => {
        const period = 14 + Math.floor(random(`b-p-${i}`) * 16);
        const offset = Math.floor(random(`b-o-${i}`) * period);
        const t = ((frame + offset) % period) / period;
        const cycle = Math.floor((frame + offset) / period);
        const bx = x + (random(`b-x-${i}-${cycle}`) - 0.5) * width;
        const by = y + (random(`b-y-${i}-${cycle}`) - 0.5) * 40 - t * 10;
        const r = 6 + random(`b-r-${i}`) * 10;
        const opacity = interpolate(t, [0, 0.3, 1], [0, 0.85, 0]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: bx,
              top: by,
              width: r * 2,
              height: r * 2,
              borderRadius: "50%",
              border: "2px solid rgba(70,60,50,0.55)",
              background: "rgba(255,250,235,0.5)",
              opacity,
              transform: `scale(${0.6 + t * 0.6})`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
