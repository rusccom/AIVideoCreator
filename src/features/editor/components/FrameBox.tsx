import { ResolvedAssetImage } from "./ResolvedAssetImage";

type FrameBoxProps = {
  label: string;
  source?: string | null;
};

export function FrameBox(props: FrameBoxProps) {
  return <ResolvedAssetImage alt={props.label} className="frame-box" fallback={props.label} source={props.source} />;
}
