type BubbleProps = {
  text: string | null;
};

export function Bubble({ text }: BubbleProps) {
  if (!text) return null;

  return <div className="bubble">{text}</div>;
}
