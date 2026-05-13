import Link from "next/link";

import type { StudioProject } from "../server/dashboard-service";
import { ProjectCardMenu } from "./ProjectCardMenu";

type ProjectCardProps = {
  project: StudioProject;
};

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="project-card">
      <Link className="project-card-link" href={`/app/projects/${project.id}`}>
        <div className="project-cover" />
        <div className="project-card-body">
          <h3>{project.title}</h3>
          <div className="project-meta">
            <span className="badge">{project.aspectRatio}</span>
            <span className="badge">{project.clips} clips</span>
            <span className="badge">{project.duration}</span>
            <span className="badge">{project.status}</span>
          </div>
          <p className="form-note">Updated {project.updatedAt}</p>
        </div>
      </Link>
      <ProjectCardMenu projectId={project.id} title={project.title} />
    </article>
  );
}
