import type { FailedJobRow, JobStatusCount } from "../server/operations-service";

type OperationsJobsPanelProps = {
  failedJobs: FailedJobRow[];
  jobCounts: JobStatusCount[];
};

export function OperationsJobsPanel({ failedJobs, jobCounts }: OperationsJobsPanelProps) {
  return (
    <section className="settings-panel">
      <h2>Generation jobs</h2>
      {jobCounts.length === 0 ? <p className="form-note">No jobs yet.</p> : countRows(jobCounts)}
      <h3 className="ops-subhead">Recent failures</h3>
      {failedJobs.length === 0 ? <p className="form-note">No failed jobs.</p> : failedTable(failedJobs)}
    </section>
  );
}

function countRows(jobCounts: JobStatusCount[]) {
  return jobCounts.map((item) => (
    <div className="metric-row" key={item.status}>
      <span>{item.status.toLowerCase()}</span>
      <span className="metric-value">{item.count.toLocaleString()}</span>
    </div>
  ));
}

function failedTable(failedJobs: FailedJobRow[]) {
  return (
    <div className="billing-table-wrap">
      <table className="billing-table">
        <thead><tr><th>Model</th><th>Error</th><th>When</th></tr></thead>
        <tbody>{failedJobs.map(failedRow)}</tbody>
      </table>
    </div>
  );
}

function failedRow(job: FailedJobRow) {
  return (
    <tr key={job.id}>
      <td>{job.modelId}</td>
      <td>{job.message}</td>
      <td>{formatDate(job.createdAt)}</td>
    </tr>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", { dateStyle: "short", timeStyle: "short" }).format(date);
}
