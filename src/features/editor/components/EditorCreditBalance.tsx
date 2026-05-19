import Link from "next/link";
import styles from "./EditorCreditBalance.module.css";

type EditorCreditBalanceProps = {
  credits: number;
};

export function EditorCreditBalance(props: EditorCreditBalanceProps) {
  return <Link className={styles.credit} href="/app/billing">{props.credits} credits</Link>;
}
