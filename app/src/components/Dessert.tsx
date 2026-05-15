type DessertProps = {
  onFeed: () => void;
};

export function Dessert({ onFeed }: DessertProps) {
  return (
    <button className="dessert-button" type="button" onClick={onFeed} aria-label="Feed Mika">
      Cake
    </button>
  );
}
