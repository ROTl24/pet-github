export type Point = { x: number; y: number };
export type Size = { width: number; height: number };
export type WorkArea = { x: number; y: number; width: number; height: number };

export function getBottomY(workArea: WorkArea, petSize: Size, bottomMargin: number): number {
  return workArea.y + workArea.height - petSize.height - bottomMargin;
}

export function clampToWorkArea(point: Point, workArea: WorkArea, petSize: Size): Point {
  const minX = workArea.x;
  const minY = workArea.y;
  const maxX = workArea.x + workArea.width - petSize.width;
  const maxY = workArea.y + workArea.height - petSize.height;

  return {
    x: Math.max(minX, Math.min(maxX, Math.round(point.x))),
    y: Math.max(minY, Math.min(maxY, Math.round(point.y))),
  };
}

export function snapToBottomLine(
  point: Point,
  workArea: WorkArea,
  petSize: Size,
  bottomMargin: number,
): Point {
  const clamped = clampToWorkArea(point, workArea, petSize);
  return {
    x: clamped.x,
    y: getBottomY(workArea, petSize, bottomMargin),
  };
}

export function moveToward(current: number, target: number, step: number): number {
  if (Math.abs(target - current) <= step) return target;
  return current < target ? current + step : current - step;
}
