import { COPY } from "@/src/shared/copy";
import { PageHeader } from "@/src/ui/PageHeader";
import styles from "./placeholder.module.css";

/** A Release 2 page in Release 1 (backlog T-07): its heading and "Coming in Release 2". */
export function Release2Placeholder({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <p className={`text-preset-4 ${styles.body}`}>{COPY.comingInRelease2}</p>
    </>
  );
}
