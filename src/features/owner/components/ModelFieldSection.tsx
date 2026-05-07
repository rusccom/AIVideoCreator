import type { ReactNode } from "react";

type ModelFieldSectionProps = {
  children: ReactNode;
  title: string;
};

export function ModelFieldSection({ children, title }: ModelFieldSectionProps) {
  return (
    <section className="ai-model-section">
      <h3>{title}</h3>
      <div className="ai-model-section-body">{children}</div>
    </section>
  );
}
