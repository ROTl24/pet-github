import type { CSSProperties } from "react";

import type { PetAnimationKey, PetRuntimeConfig } from "../pet/types";

type MikaSpriteProps = {
  config: PetRuntimeConfig;
  animationKey: PetAnimationKey;
  paused: boolean;
};

export function MikaSprite({ config, animationKey, paused }: MikaSpriteProps) {
  const animation = config.animations[animationKey];

  return (
    <div
      className="mika-sprite"
      data-animation={animationKey}
      style={
        {
          width: config.frameWidth,
          height: config.frameHeight,
          backgroundImage: `url(${config.spritesheetPath})`,
          backgroundSize: `${config.frameWidth * config.columns}px ${
            config.frameHeight * config.rows
          }px`,
          "--sprite-frame-width": `${config.frameWidth}px`,
          "--sprite-row-y": `-${animation.row * config.frameHeight}px`,
          "--sprite-frames": animation.frames,
          "--sprite-duration": `${animation.durationMs}ms`,
          "--sprite-iterations": animation.loop ? "infinite" : "1",
          "--sprite-play-state": paused ? "paused" : "running",
        } as CSSProperties
      }
      aria-label={`Mika ${animationKey}`}
    />
  );
}
