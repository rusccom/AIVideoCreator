type UseCaseCardProps = {
  title: string;
};

export function UseCaseCard({ title }: UseCaseCardProps) {
  return (
    <article className="use-case-card">
      <div className="use-case-media">
        <span className="use-case-frame" />
        <span className="use-case-frame" />
        <span className="use-case-frame" />
        <span className="use-case-frame" />
      </div>
      <h3>{title}</h3>
      <p>Start frame, linked clips, and final stitched result in one project.</p>
    </article>
  );
}
