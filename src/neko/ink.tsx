import { AbsoluteFill, useCurrentFrame } from "remotion";

// 墨・和紙の色（satori-neko の character_rules.md / image-production-direction.md より）
export const PAPER = "#f3ede1";
export const PAPER_EDGE = "#e7dcc8";
export const INK = "#2b2521";
export const USUZUMI = "rgba(43,37,33,0.32)"; // 薄墨
export const FUR = "#d8d3ca";
export const FUR_LIGHT = "#ebe7e0";
export const BIB = "#c4766c"; // くすんだ赤
export const EAR = "#e7b9ad";
export const BATTER = "#f2e8cf";
export const FRIED = "#e3c486";

/**
 * 手描きの墨線らしい揺れ。seed を数フレームごとに変えて、線がかすかに「生きて」見えるようにする。
 * 粒・斑点は足さない（質感は線の揺れだけで出す）。
 */
export const InkFilter: React.FC<{ id: string; scale?: number; every?: number }> = ({
  id,
  scale = 3.5,
  every = 6,
}) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / every) % 3;
  return (
    <filter id={id} x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={seed + 1} />
      <feDisplacementMap in="SourceGraphic" scale={scale} />
    </filter>
  );
};

/** 生成りの和紙。粒は入れず、端だけわずかに色を沈める */
export const Paper: React.FC = () => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at 50% 42%, ${PAPER} 55%, ${PAPER_EDGE} 100%)`,
    }}
  />
);

/** 煩悩：墨を一滴落としたような塊。顔・手足はない */
export const Bonnou: React.FC<{
  size?: number;
  coat?: number; // 0=墨のまま, 1=衣をまとう
  fried?: number; // 0..1 揚げ色
  bite?: number; // 0..1 かじった欠け
  id: string;
}> = ({ size = 120, coat = 0, fried = 0, bite = 0, id }) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 5) % 4;
  const coatColor = mix(BATTER, FRIED, fried);
  return (
    <svg width={size} height={size} viewBox="-60 -60 120 120" style={{ overflow: "visible" }}>
      <defs>
        <filter id={`${id}-blob`} x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves={2} seed={seed + 3} />
          <feDisplacementMap in="SourceGraphic" scale={14} />
          <feGaussianBlur stdDeviation={1.2} />
        </filter>
        <filter id={`${id}-coat`} x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves={1} seed={7} />
          <feDisplacementMap in="SourceGraphic" scale={10} />
        </filter>
        <mask id={`${id}-bite`}>
          <rect x={-80} y={-80} width={160} height={160} fill="white" />
          <g filter={`url(#${id}-coat)`}>
            <circle cx={-40} cy={-30} r={34 * bite} fill="black" />
            <circle cx={-52} cy={-4} r={22 * bite} fill="black" />
          </g>
        </mask>
      </defs>
      <g mask={`url(#${id}-bite)`}>
        {/* 薄墨のにじみ */}
        <circle r={44} fill="rgba(43,37,33,0.18)" filter={`url(#${id}-blob)`} opacity={1 - coat} />
        {/* 衣 */}
        {coat > 0 && (
          <g filter={`url(#${id}-coat)`} opacity={Math.min(1, coat * 1.5)}>
            <ellipse rx={48} ry={40} fill={coatColor} stroke={INK} strokeWidth={3.5} />
          </g>
        )}
        {/* 墨の芯（衣の下ではうっすら透ける） */}
        <g filter={`url(#${id}-blob)`} opacity={1 - coat * 0.72}>
          <circle cx={-6} cy={2} r={26} fill={INK} />
          <circle cx={12} cy={-8} r={18} fill={INK} />
          <circle cx={6} cy={14} r={14} fill={INK} />
        </g>
      </g>
    </svg>
  );
};

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
export const mix = (a: string, b: string, t: number) => {
  const A = hex(a);
  const B = hex(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`;
};
