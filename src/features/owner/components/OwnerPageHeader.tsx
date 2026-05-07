type OwnerPageHeaderProps = {
  title: string;
  description: string;
};

export function OwnerPageHeader({ title, description }: OwnerPageHeaderProps) {
  return (
    <div className="studio-page-header">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </div>
  );
}
