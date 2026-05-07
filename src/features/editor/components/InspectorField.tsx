type InspectorFieldProps = {
  label: string;
  value: string;
};

export function InspectorField({ label, value }: InspectorFieldProps) {
  return (
    <div className="inspector-field">
      <span>{label}</span>
      <div className="inspector-value">{value}</div>
    </div>
  );
}
