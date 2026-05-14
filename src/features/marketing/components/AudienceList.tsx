import { audiences } from "../data/marketing-content";

export function AudienceList() {
  return (
    <div className="audience-list">
      {audiences.map((item) => <span className="audience-pill" key={item}>{item}</span>)}
    </div>
  );
}
