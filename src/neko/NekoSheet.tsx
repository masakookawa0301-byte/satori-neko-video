import { AbsoluteFill } from "remotion";
import { Bonnou, Paper } from "./ink";
import { SatoriNeko } from "./SatoriNeko";

// 造形確認用：さとりねこと煩悩の見本
export const NekoSheet: React.FC = () => (
  <AbsoluteFill>
    <Paper />
    <div style={{ position: "absolute", left: 140, top: 200 }}>
      <SatoriNeko id="sheet-a" width={800} />
    </div>
    <div style={{ position: "absolute", left: 120, top: 1300, display: "flex", gap: 60, alignItems: "center" }}>
      <SatoriNeko id="sheet-b" width={300} mouth="open" mouthOpen={0.8} hands="none" />
      <Bonnou id="b1" size={150} />
      <Bonnou id="b2" size={150} coat={1} />
      <Bonnou id="b3" size={150} coat={1} fried={1} bite={1} />
    </div>
  </AbsoluteFill>
);
