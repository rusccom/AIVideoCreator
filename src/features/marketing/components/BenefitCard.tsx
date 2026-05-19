type BenefitCardProps = {
  benefit: {
    title: string;
    text: string;
  };
};

export function BenefitCard({ benefit }: BenefitCardProps) {
  return (
    <article className="feature-card">
      <h3>{benefit.title}</h3>
      <p>{benefit.text}</p>
    </article>
  );
}
