import styles from "./EditorCreditBalance.module.css";

type EditorCreditBalanceProps = {
  credits: number;
};

export function EditorCreditBalance(props: EditorCreditBalanceProps) {
  return <span className={styles.credit}>{props.credits} credits</span>;
}
