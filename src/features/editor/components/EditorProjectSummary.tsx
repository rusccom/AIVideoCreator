import styles from "./EditorProjectSummary.module.css";

type EditorProjectSummaryProps = {
  aspectRatio: string;
  title: string;
};

export function EditorProjectSummary(props: EditorProjectSummaryProps) {
  return (
    <div className={styles.summary}>
      <h1 className={styles.title}>{props.title}</h1>
      <span className={styles.aspect}>Aspect ratio {props.aspectRatio}</span>
    </div>
  );
}
