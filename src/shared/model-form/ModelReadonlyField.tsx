type ModelReadonlyFieldProps = {
  label: string;
  value: string;
};

export function ModelReadonlyField({ label, value }: ModelReadonlyFieldProps) {
  return (
    <div className="model-readonly">
      <span>{label}</span>
      <strong>{value || "none"}</strong>
    </div>
  );
}
