import { AbsoluteFill, Easing, interpolate, random, useCurrentFrame } from "remotion";
import { Bonnou, BATTER, FRIED, INK, InkFilter, Paper, USUZUMI } from "../neko/ink";
import { Paw, SatoriNeko } from "../neko/SatoriNeko";
import { Bubbles, Steam } from "./effects";

const ease = Easing.inOut(Easing.cubic);
/** フレームのキー列で値を補間する（前後は固定） */
const kf = (frame: number, input: number[], output: number[]) =>
  interpolate(frame, input, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

const At: React.FC<{ x: number; y: number; children: React.ReactNode; z?: number }> = ({ x, y, children, z }) => (
  <div style={{ position: "absolute", left: x, top: y, zIndex: z }}>{children}</div>
);

/** 中心座標で置く */
const Center: React.FC<{ x: number; y: number; size: number; children: React.ReactNode }> = ({ x, y, size, children }) => (
  <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2 }}>{children}</div>
);

/** 薄墨の背景の線（柱・床・掛け軸など）。描き込みすぎない */
const Lines: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <InkFilter id={id} scale={6} every={8} />
    </defs>
    <g filter={`url(#${id})`} stroke={USUZUMI} strokeWidth={6} strokeLinecap="round" fill="none">
      {children}
    </g>
  </svg>
);

// ─────────────────────────── ① 衣にくぐらせる（手元の寄り。上から見下ろすさとりねこ）
export const SceneKoromo: React.FC = () => {
  const f = useCurrentFrame();
  const tipY = kf(f, [0, 24, 46, 60, 92], [1020, 1120, 1360, 1360, 1130]);
  const tipX = kf(f, [0, 46, 92], [600, 560, 590]);
  const coated = f >= 60;
  const hidden = f > 44 && f < 62;
  const ripple = kf(f, [46, 80], [0, 1]);
  const look = kf(f, [0, 46, 92], [0, 8, 3]); // 手元をのぞきこむ

  return (
    <AbsoluteFill>
      <Paper />
      {/* さとりねこ（画面の上から、手元を見下ろす） */}
      <At x={540 - 450} y={-90}>
        <SatoriNeko id="k-neko" width={900} hands="none" headDip={look} headTilt={-look * 0.4} />
      </At>
      {/* 小鉢 */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <InkFilter id="k-bowl" scale={5} />
        </defs>
        <g filter="url(#k-bowl)">
          <path d="M150 1400 C 170 1640, 330 1760, 540 1765 C 750 1760, 910 1640, 930 1400 Z" fill="#ece6da" stroke={INK} strokeWidth={8} />
          <path d="M210 1560 C 300 1660, 420 1700, 540 1702" stroke={USUZUMI} strokeWidth={14} fill="none" />
          <ellipse cx={540} cy={1400} rx={392} ry={112} fill="#ece6da" stroke={INK} strokeWidth={8} />
          <ellipse cx={540} cy={1404} rx={350} ry={88} fill={BATTER} stroke={INK} strokeWidth={4} />
          <path d="M330 1395 Q 450 1370 540 1400 T 740 1410" stroke="rgba(43,37,33,0.18)" strokeWidth={5} fill="none" />
          {ripple > 0 && ripple < 1 && (
            <>
              <ellipse cx={560} cy={1400} rx={50 + ripple * 220} ry={14 + ripple * 56} fill="none" stroke={INK} strokeWidth={3} opacity={(1 - ripple) * 0.6} />
              <ellipse cx={560} cy={1400} rx={25 + ripple * 130} ry={7 + ripple * 33} fill="none" stroke={INK} strokeWidth={2.5} opacity={(1 - ripple) * 0.5} />
            </>
          )}
        </g>
      </svg>
      {/* 衣のしずく */}
      {coated &&
        [0, 1, 2].map((i) => {
          const start = 68 + i * 11;
          const t = kf(f, [start, start + 12], [0, 1]);
          if (f < start || t >= 1) return null;
          const y0 = tipY + 120;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: tipX - 10 + (i - 1) * 14,
                top: y0 + t * (1395 - y0),
                width: 22,
                height: 30,
                borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                background: BATTER,
                border: `3px solid ${INK}`,
              }}
            />
          );
        })}
      {/* 煩悩（手の先にぶら下がる） */}
      {!hidden && (
        <Center x={tipX} y={tipY + 70} size={200}>
          <Bonnou id="k-bonnou" size={200} coat={coated ? 1 : 0} />
        </Center>
      )}
      <Paw id="k-paw" from={[700, 790]} to={[tipX + 10, tipY]} thickness={130} />
    </AbsoluteFill>
  );
};

// ─────────────────────────── ② 油にそっと入れる（中景）
export const SceneAgeru: React.FC = () => {
  const f = useCurrentFrame();
  const tip = [kf(f, [0, 30, 56, 80], [700, 640, 640, 690]), kf(f, [0, 30, 56, 80], [1010, 1100, 1100, 1010])];
  const release = 38;
  const land = 50;
  // 落下（重力っぽく）
  const fallT = Math.max(0, Math.min(1, (f - release) / (land - release)));
  const bonY = f < release ? tip[1] + 70 : f < land ? 1170 + (1238 - 1170) * fallT * fallT : 1238;
  const bonX = f < release ? tip[0] : 640;
  const flinch = kf(f, [land, land + 5, land + 26], [0, 1, 0]);
  const fried = kf(f, [land, 140], [0, 0.55]);
  const glow = 0.25 + Math.sin(f / 4) * 0.06 + random(`g${Math.floor(f / 3)}`) * 0.05;

  return (
    <AbsoluteFill>
      <Paper />
      <Lines id="a-lines">
        <path d="M100 0 L 104 1500" />
        <path d="M150 0 L 152 1500" />
        <path d="M150 430 L 380 434" />
        <rect x={720} y={240} width={290} height={360} />
        <path d="M865 240 L 865 600 M 720 360 L 1010 360 M 720 480 L 1010 480" strokeWidth={4} />
      </Lines>

      {/* さとりねこ（鍋の向こう） */}
      <At x={540 - 280} y={560}>
        <SatoriNeko id="a-neko" width={560} hands="none" headDip={flinch * -8} headTilt={flinch * -4} />
      </At>
      <Paw id="a-paw" from={[640, 940]} to={[tip[0], tip[1]]} thickness={96} />

      {/* 落ちる前の煩悩（鍋より手前に描かない） */}
      {f < land && (
        <Center x={bonX} y={bonY} size={150}>
          <Bonnou id="a-bon" size={150} coat={1} />
        </Center>
      )}

      {/* かまどと鍋 */}
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <InkFilter id="a-pot" scale={5} />
          <radialGradient id="a-fire" cx="50%" cy="60%" r="60%">
            <stop offset="0%" stopColor="#e09060" stopOpacity={glow * 2.2} />
            <stop offset="100%" stopColor="#e09060" stopOpacity={0} />
          </radialGradient>
        </defs>
        <g filter="url(#a-pot)">
          <path d="M60 1530 L 1020 1530 L 1040 1940 L 40 1940 Z" fill="#d6cab4" stroke={INK} strokeWidth={7} />
          <path d="M380 1940 L 380 1760 Q 540 1660 700 1760 L 700 1940" fill="#5a4a40" stroke={INK} strokeWidth={6} />
          <path d="M140 1250 C 150 1450, 260 1560, 540 1570 C 820 1560, 930 1450, 940 1250 Z" fill="#3b3531" stroke={INK} strokeWidth={8} />
          <path d="M210 1330 C 240 1440, 330 1500, 420 1515" stroke="rgba(255,255,255,0.18)" strokeWidth={14} fill="none" />
          <ellipse cx={540} cy={1250} rx={402} ry={92} fill="#3b3531" stroke={INK} strokeWidth={8} />
          <ellipse cx={540} cy={1252} rx={368} ry={74} fill="#e6d29e" stroke={INK} strokeWidth={4} />
        </g>
        <ellipse cx={540} cy={1820} rx={200} ry={120} fill="url(#a-fire)" />
      </svg>

      {/* 油に入った煩悩 */}
      {f >= land && (
        <Center x={640} y={1238} size={150}>
          <div style={{ transform: "scaleY(0.82)" }}>
            <Bonnou id="a-bon2" size={150} coat={1} fried={fried} />
          </div>
        </Center>
      )}
      {f >= land && <Splash x={640} y={1236} start={land} />}
      {f >= land && (
        <>
          <Bubbles x={640} y={1236} width={240} />
          <Steam x={600} y={1180} count={4} height={420} />
        </>
      )}
    </AbsoluteFill>
  );
};

const Splash: React.FC<{ x: number; y: number; start: number }> = ({ x, y, start }) => {
  const f = useCurrentFrame() - start;
  if (f > 16) return null;
  return (
    <>
      {new Array(9).fill(0).map((_, i) => {
        const a = -Math.PI * (0.15 + 0.7 * (i / 8));
        const v = 14 + random(`sp${i}`) * 10;
        const px = x + Math.cos(a) * v * f * 1.4;
        const py = y + Math.sin(a) * v * f + 1.6 * f * f;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px,
              top: py,
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: "#e6d29e",
              border: `2px solid ${INK}`,
              opacity: 1 - f / 16,
            }}
          />
        );
      })}
    </>
  );
};

// ─────────────────────────── ③ 皿の天ぷらと合掌（引き・静かな間）
export const SceneGassho: React.FC = () => {
  const f = useCurrentFrame();
  const bow = kf(f, [16, 34, 64], [0, 1, 0]);
  return (
    <AbsoluteFill>
      <Paper />
      <Lines id="g-lines">
        <path d="M-20 1250 L 1100 1246" />
        <path d="M-20 1520 L 1100 1516" strokeWidth={4} />
        <path d="M-20 1760 L 1100 1756" strokeWidth={4} />
        {/* 掛け軸と円相 */}
        <path d="M780 180 L 940 180" strokeWidth={8} />
        <rect x={790} y={190} width={140} height={520} strokeWidth={4} />
        <circle cx={860} cy={380} r={46} strokeWidth={9} />
        <path d="M780 720 L 940 720" strokeWidth={8} />
      </Lines>
      <At x={540 - 230} y={780}>
        <SatoriNeko id="g-neko" width={460} headDip={bow * 10} />
      </At>
      <svg width={1080} height={1920} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <InkFilter id="g-plate" scale={4} />
        </defs>
        <g filter="url(#g-plate)">
          <ellipse cx={540} cy={1360} rx={170} ry={48} fill="#f7f3ec" stroke={INK} strokeWidth={6} />
          <ellipse cx={540} cy={1356} rx={116} ry={28} fill="none" stroke={USUZUMI} strokeWidth={4} />
        </g>
      </svg>
      <Center x={540} y={1322} size={170}>
        <div style={{ transform: "scaleY(0.85)" }}>
          <Bonnou id="g-ten" size={170} coat={1} fried={1} />
        </div>
      </Center>
      <Steam x={540} y={1250} count={2} height={300} />
    </AbsoluteFill>
  );
};

// ─────────────────────────── ④ 食べる（口元の寄り）
export const BITE_FRAME = 39;
export const SceneKuu: React.FC = () => {
  const f = useCurrentFrame();
  const b = BITE_FRAME;
  const tip = [kf(f, [0, 32, b + 4, b + 24], [980, 690, 690, 820]), kf(f, [0, 32, b + 4, b + 24], [1900, 1160, 1160, 1330])];
  const mouthOpen = kf(f, [22, b - 2], [0, 1]);
  const biting = f < b + 1;
  const bite = kf(f, [b, b + 3], [0, 1]);
  const cheek = kf(f, [b + 2, b + 16], [0, 1]);
  const chewing = f > b + 2 && f < b + 70;
  const push = kf(f, [0, 120], [1.0, 1.04]);

  return (
    <AbsoluteFill>
      <Paper />
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: "50% 55%" }}>
        <At x={540 - 650} y={380}>
          <SatoriNeko
            id="q-neko"
            width={1300}
            hands="none"
            mouth={biting ? "open" : chewing ? "chew" : "closed"}
            mouthOpen={mouthOpen}
            cheek={cheek}
            headTilt={kf(f, [b + 4, b + 30, b + 70], [0, 3, 1.5])}
          />
        </At>
        <Center x={tip[0] - 70} y={tip[1] - 40} size={300}>
          <Bonnou id="q-ten" size={300} coat={1} fried={1} bite={bite} />
        </Center>
        <Paw id="q-paw" from={[1180, 2000]} to={[tip[0] + 40, tip[1] + 50]} thickness={150} />
        <Crumbs start={b + 1} x={600} y={1040} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Crumbs: React.FC<{ start: number; x: number; y: number }> = ({ start, x, y }) => {
  const f = useCurrentFrame() - start;
  if (f < 0 || f > 40) return null;
  return (
    <>
      {new Array(6).fill(0).map((_, i) => {
        const vx = (random(`c-x${i}`) - 0.5) * 9;
        const vy = -4 - random(`c-y${i}`) * 5;
        const s = 10 + random(`c-s${i}`) * 10;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + vx * f,
              top: y + vy * f + 0.9 * f * f,
              width: s,
              height: s * 0.8,
              borderRadius: "40% 60% 50% 45%",
              background: FRIED,
              border: `2px solid ${INK}`,
              transform: `rotate(${i * 40 + f * 12}deg)`,
              opacity: interpolate(f, [28, 40], [1, 0], { extrapolateLeft: "clamp" }),
            }}
          />
        );
      })}
    </>
  );
};
