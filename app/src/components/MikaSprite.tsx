import type { CSSProperties } from "react";

import type { PetAnimationKey, PetRuntimeConfig } from "../pet/types";

type MikaSpriteProps = {
  config: PetRuntimeConfig;
  animationKey: PetAnimationKey;
  paused: boolean;
};

function toCssPixels(value: number): string {
  return `${Number(value.toFixed(3))}px`;
}

export function MikaSprite({ config, animationKey, paused }: MikaSpriteProps) {
  const animation = config.animations[animationKey];
  const frameWidth = config.frameWidth * config.displayScale;
  const frameHeight = config.frameHeight * config.displayScale;

  return (
    <div
      className="mika-sprite"
      data-animation={animationKey}
      style={
        {
          width: toCssPixels(frameWidth),
          height: toCssPixels(frameHeight),
          backgroundImage: `url(${config.spritesheetPath})`,
          backgroundSize: `${toCssPixels(frameWidth * config.columns)} ${toCssPixels(
            frameHeight * config.rows,
          )}`,
          "--sprite-frame-width": toCssPixels(frameWidth),
          "--sprite-row-y": `-${toCssPixels(animation.row * frameHeight)}`,
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
