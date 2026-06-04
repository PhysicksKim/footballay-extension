type StatLineProps = {
  label: string;
  home?: string | number;
  away?: string | number;
};

export function StatLine({ label, home = "-", away = "-" }: StatLineProps) {
  return (
    <div className="footballay-stat-line">
      <span>{label}</span>
      <strong>
        {home} - {away}
      </strong>
    </div>
  );
}
