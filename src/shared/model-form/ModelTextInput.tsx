type ModelTextInputProps = {
  label?: string;
  min?: number;
  name: string;
  value: string;
  type?: string;
};

export function ModelTextInput({ label, min, name, type, value }: ModelTextInputProps) {
  return (
    <label className="model-input">
      <span>{label ?? name}</span>
      <input defaultValue={value} min={min} name={name} type={type ?? "text"} />
    </label>
  );
}
