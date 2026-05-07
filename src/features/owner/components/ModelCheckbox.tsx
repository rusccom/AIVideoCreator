type ModelCheckboxProps = {
  checked: boolean;
  label?: string;
  name: string;
};

export function ModelCheckbox({ checked, label, name }: ModelCheckboxProps) {
  return (
    <label className="model-check">
      <input defaultChecked={checked} name={name} type="checkbox" />
      <span>{label ?? name}</span>
    </label>
  );
}
