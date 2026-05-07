type EditorProjectSummaryProps = {
  projectId: string;
  sceneCount: number;
  title: string;
  totalDuration: string;
};

export function EditorProjectSummary(props: EditorProjectSummaryProps) {
  return (
    <div className="editor-project-summary">
      <h1>{props.title}</h1>
      <p>
        {props.sceneCount} linked clips - {props.totalDuration} - {props.projectId}
      </p>
    </div>
  );
}
