type StatusBarsProps = {
  mood: number;
  energy: number;
};

export function StatusBars({ mood, energy }: StatusBarsProps) {
  return (
    <div className="status-bars" aria-label="Mika status">
      <div className="status-row" aria-label={`Mood ${mood} of 100`}>
        <span className="status-icon" aria-hidden="true">
          M
        </span>
        <span className="status-track">
          <span className="status-fill mood" style={{ width: `${mood}%` }} />
        </span>
      </div>
      <div className="status-row" aria-label={`Energy ${energy} of 100`}>
        <span className="status-icon" aria-hidden="true">
          E
        </span>
        <span className="status-track">
          <span className="status-fill energy" style={{ width: `${energy}%` }} />
        </span>
      </div>
    </div>
  );
}
