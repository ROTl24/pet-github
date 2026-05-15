type SettingsPanelProps = {
  paused: boolean;
  onPausedChange: (paused: boolean) => void;
  onClose: () => void;
};

export function SettingsPanel({ paused, onPausedChange, onClose }: SettingsPanelProps) {
  return (
    <section className="settings-panel" aria-label="Mika settings">
      <label className="settings-row">
        <input
          type="checkbox"
          checked={paused}
          onChange={(event) => onPausedChange(event.currentTarget.checked)}
        />
        Pause Mika
      </label>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </section>
  );
}
