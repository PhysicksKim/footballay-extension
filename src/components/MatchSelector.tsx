type MatchSelectorProps = {
  selectedFixtureId?: number;
  onSelectFixture: (fixtureId: number | undefined) => void;
};

export function MatchSelector({ selectedFixtureId, onSelectFixture }: MatchSelectorProps) {
  return (
    <label className="footballay-popup-field">
      <span>Fixture ID</span>
      <input
        min={1}
        placeholder="1001"
        type="number"
        value={selectedFixtureId ?? ""}
        onChange={(event) => {
          const value = event.currentTarget.valueAsNumber;
          onSelectFixture(Number.isFinite(value) ? value : undefined);
        }}
      />
    </label>
  );
}
