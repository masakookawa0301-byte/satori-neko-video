import { Composition } from "remotion";
import { GyounRyusui } from "./GyounRyusui";
import { BonnouTempura, TEMPURA_DURATION } from "./tempura/BonnouTempura";

// 縦型ショート（TikTok・YouTubeショート・リール）共通：1080×1920、30fps
const SHORT = { width: 1080, height: 1920, fps: 30 } as const;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="GyounRyusui"
        component={GyounRyusui}
        durationInFrames={14 * SHORT.fps}
        {...SHORT}
      />
      <Composition
        id="BonnouTempura"
        component={BonnouTempura}
        durationInFrames={TEMPURA_DURATION}
        {...SHORT}
      />
    </>
  );
};
