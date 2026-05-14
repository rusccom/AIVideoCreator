type ModelChipListProps = {
  label: string;
  values: string[];
};

export function ModelChipList({ label, values }: ModelChipListProps) {
  return (
    <div className="model-chip-list">
      <span>{label}</span>
      <div className="model-chip-row">
        {values.length ? values.map((value) => <strong key={value}>{value}</strong>) : <strong>none</strong>}
      </div>
    </div>
  );
}
