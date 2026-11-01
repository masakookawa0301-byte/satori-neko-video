import { useCurrentFrame } from "remotion";
import { BIB, EAR, FUR, FUR_LIGHT, INK, InkFilter } from "./ink";

/**
 * さとりねこ（正面）。satori-neko/assets/references/original-06.jpg の三面図をもとに描く。
 * 丸く大きい頭・ふっくらした頬・短い体・額の白い丸・閉じ目・小さな鼻と口・ひげ・くすんだ赤のよだれかけ・
 * 地蔵のような丸い二山の裾。尻尾・服・数珠はなし。目は開けない。
 * viewBox: 0 0 400 470（足元が y=440 付近）
 */
export type NekoProps = {
  id: string;
  width: number;
  hands?: "gassho" | "none"; // none = 腕は別に描く（物を持つ場面）
  mouth?: "closed" | "open" | "chew";
  mouthOpen?: number; // 0..1
  cheek?: number; // 0..1 頬のふくらみ・赤み
  headTilt?: number; // 度
  headDip?: number; // px（おじぎ）
  bodyOnly?: boolean;
};

export const SatoriNeko: React.FC<NekoProps> = ({
  id,
  width,
  hands = "gassho",
  mouth = "closed",
  mouthOpen = 0,
  cheek = 0,
  headTilt = 0,
  headDip = 0,
}) => {
  const frame = useCurrentFrame();
  // 呼吸：ごくわずかに体がふくらむ
  const breath = 1 + Math.sin(frame / 22) * 0.006;
  const chew = mouth === "chew" ? Math.abs(Math.sin(frame / 3.2)) : 0;
  const f = `url(#${id}-ink)`;
  const stroke = { stroke: INK, strokeWidth: 6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const thin = { ...stroke, strokeWidth: 3.6, fill: "none" };

  return (
    <svg width={width} height={(width * 470) / 400} viewBox="0 0 400 470" style={{ overflow: "visible" }}>
      <defs>
        <InkFilter id={`${id}-ink`} />
        <InkFilter id={`${id}-brush`} scale={9} every={6} />
        <radialGradient id={`${id}-fur`} cx="38%" cy="30%" r="80%">
          <stop offset="0%" stopColor={FUR_LIGHT} />
          <stop offset="70%" stopColor={FUR} />
          <stop offset="100%" stopColor="#cbc5bb" />
        </radialGradient>
      </defs>

      {/* 体（地蔵のような二山の裾） */}
      <g filter={f} style={{ transform: `scale(${breath})`, transformOrigin: "200px 440px" }}>
        <path
          d="M118 232 C 86 288, 74 360, 84 418 Q 140 462 200 428 Q 260 462 316 418 C 326 360, 314 288, 282 232 Z"
          fill={`url(#${id}-fur)`}
          {...stroke}
        />
        {hands === "gassho" && (
          <g {...thin} strokeWidth={4.5}>
            <path d="M178 384 Q 186 344 200 314" />
            <path d="M222 384 Q 214 344 200 314" />
          </g>
        )}
        {/* 筆の太細：外側に揺れの大きい薄い線を重ねる */}
        <path
          d="M118 232 C 86 288, 74 360, 84 418 Q 140 462 200 428 Q 260 462 316 418 C 326 360, 314 288, 282 232"
          fill="none" stroke={INK} strokeWidth={4} opacity={0.45} filter={`url(#${id}-brush)`}
        />
        {/* 裾の二山の境目 */}
        <path d="M200 428 Q 198 405 196 392" {...thin} opacity={0.7} />
      </g>

      {/* 頭 */}
      <g
        style={{
          transform: `translateY(${headDip}px) rotate(${headTilt}deg)`,
          transformOrigin: "200px 250px",
        }}
      >
        <g filter={f}>
          <path
            d="M70 168 C 62 122, 74 92, 94 74 L 98 30 Q 100 20 110 26 L 150 56 C 180 48, 220 48, 250 56 L 290 26 Q 300 20 302 30 L 306 74 C 326 92, 338 122, 330 168 C 322 228, 272 254, 200 254 C 128 254, 78 228, 70 168 Z"
            fill={`url(#${id}-fur)`}
            {...stroke}
          />
          <path
            d="M70 168 C 62 122, 74 92, 94 74 L 98 30 Q 100 20 110 26 L 150 56 C 180 48, 220 48, 250 56 L 290 26 Q 300 20 302 30 L 306 74 C 326 92, 338 122, 330 168 C 322 228, 272 254, 200 254 C 128 254, 78 228, 70 168 Z"
            fill="none" stroke={INK} strokeWidth={4} opacity={0.45} filter={`url(#${id}-brush)`}
          />
          <path d="M106 40 L 112 72 L 138 60 Z" fill={EAR} />
          <path d="M294 40 L 288 72 L 262 60 Z" fill={EAR} />
        </g>

        {/* 頬の赤み・ふくらみ */}
        <ellipse cx={128} cy={196} rx={26 + cheek * 6} ry={14 + cheek * 4} fill={EAR} opacity={0.25 + cheek * 0.35} />
        <ellipse cx={272} cy={196} rx={26 + cheek * 6} ry={14 + cheek * 4} fill={EAR} opacity={0.25 + cheek * 0.35} />

        <g filter={f}>
          {/* 額の白い丸（白毫） */}
          <circle cx={200} cy={104} r={9} fill="#fbf8f2" stroke={INK} strokeWidth={2.2} />
          {/* 眉 */}
          <path d="M138 132 Q 151 124 165 130" {...thin} strokeWidth={3.4} />
          <path d="M235 130 Q 249 124 262 132" {...thin} strokeWidth={3.4} />
          {/* 閉じ目（にっこり） */}
          <path d="M136 162 Q 152 146 168 160" {...thin} strokeWidth={5} />
          <path d="M232 160 Q 248 146 264 162" {...thin} strokeWidth={5} />
          {/* 鼻 */}
          <path d="M192 178 L 208 178 L 200 188 Z" fill="#6e5b52" stroke={INK} strokeWidth={2} />
          {/* 口 */}
          {mouth === "open" ? (
            <ellipse cx={200} cy={200} rx={9 + mouthOpen * 6} ry={4 + mouthOpen * 12} fill="#7a4a44" stroke={INK} strokeWidth={3} />
          ) : (
            <g {...thin} strokeWidth={3.4}>
              <path d={`M200 188 Q 195 ${198 + chew * 3} 186 ${195 + chew * 2}`} />
              <path d={`M200 188 Q 205 ${198 + chew * 3} 214 ${195 + chew * 2}`} />
            </g>
          )}
          {/* ひげ */}
          <g {...thin} strokeWidth={2.6}>
            <path d="M112 178 L 66 170" />
            <path d="M112 190 L 64 192" />
            <path d="M116 201 L 74 213" />
            <path d="M288 178 L 334 170" />
            <path d="M288 190 L 336 192" />
            <path d="M284 201 L 326 213" />
          </g>
        </g>

        {/* よだれかけ */}
        <g filter={f}>
          <path d="M128 240 Q 200 268 272 240 L 268 256 Q 200 282 132 256 Z" fill={BIB} stroke={INK} strokeWidth={3.2} />
          <path d="M200 262 C 186 278, 172 300, 176 318 C 190 314, 200 290, 200 266 Z" fill={BIB} stroke={INK} strokeWidth={3.2} />
          <path d="M200 262 C 214 278, 228 300, 224 318 C 210 314, 200 290, 200 266 Z" fill={BIB} stroke={INK} strokeWidth={3.2} />
          <circle cx={200} cy={263} r={7} fill={BIB} stroke={INK} strokeWidth={3} />
        </g>
      </g>
    </svg>
  );
};

/** 丸い手（腕つき）。物を持つ場面用。from→to に向かって伸びる */
export const Paw: React.FC<{
  id: string;
  from: [number, number];
  to: [number, number];
  thickness?: number;
  children?: React.ReactNode; // 手の先に持つもの
}> = ({ id, from, to, thickness = 110 }) => {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ang = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  const r = thickness / 2;
  return (
    <svg
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
      width={1080}
      height={1920}
    >
      <defs>
        <InkFilter id={`${id}-ink`} />
        <InkFilter id={`${id}-brush`} scale={9} every={6} />
      </defs>
      <g transform={`translate(${x1} ${y1}) rotate(${ang})`} filter={`url(#${id}-ink)`}>
        <path
          d={`M0 ${-r * 0.85} L ${len - r} ${-r} A ${r} ${r} 0 0 1 ${len - r} ${r} L 0 ${r * 0.85}`}
          fill={FUR}
          stroke={INK}
          strokeWidth={7}
          strokeLinejoin="round"
        />
        {/* 指先の筋 */}
        <path d={`M${len - r * 0.35} ${-r * 0.45} q ${r * 0.35} ${r * 0.1} ${r * 0.55} 0`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
        <path d={`M${len - r * 0.25} ${r * 0.05} q ${r * 0.35} ${r * 0.1} ${r * 0.6} 0`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
};
