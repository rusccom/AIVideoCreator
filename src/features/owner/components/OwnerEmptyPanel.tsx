type OwnerEmptyPanelProps = {
  title: string;
  description: string;
};

export function OwnerEmptyPanel({ title, description }: OwnerEmptyPanelProps) {
  return (
    <section className="settings-panel">
      <h2>{title}</h2>
      <p className="form-note">{description}</p>
    </section>
  );
}
