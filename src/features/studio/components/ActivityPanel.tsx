type ActivityPanelProps = {
  activity: Array<{
    name: string;
    status: string;
  }>;
};

export function ActivityPanel({ activity }: ActivityPanelProps) {
  return (
    <section className="activity-panel">
      <h2>Recent generations</h2>
      {activity.length === 0 ? <p className="form-note">No generation jobs yet.</p> : null}
      {activity.map((item) => (
        <div className="activity-row" key={item.name}>
          <span>{item.name}</span>
          <span className="badge">{item.status}</span>
        </div>
      ))}
    </section>
  );
}
