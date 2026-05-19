type UseCaseCardProps = {
  useCase: {
    title: string;
    text: string;
  };
};

export function UseCaseCard({ useCase }: UseCaseCardProps) {
  return (
    <article className="use-case-card">
      <div className="use-case-media">
        <span className="use-case-frame" />
        <span className="use-case-frame" />
        <span className="use-case-frame" />
        <span className="use-case-frame" />
      </div>
      <h3>{useCase.title}</h3>
      <p>{useCase.text}</p>
    </article>
  );
}
