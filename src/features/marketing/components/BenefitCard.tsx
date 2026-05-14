type BenefitCardProps = {
  benefit: string;
};

export function BenefitCard({ benefit }: BenefitCardProps) {
  return (
    <article className="feature-card">
      <h3>{benefit}</h3>
      <p>Keep prompts, frames, videos, statuses, and exports connected inside one project history.</p>
    </article>
  );
}
