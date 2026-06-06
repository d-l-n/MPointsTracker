interface ToastProps {
  msg: string;
  show: boolean;
}

export default function Toast({ msg, show }: ToastProps) {
  return <div className={`toast${show ? " show" : ""}`}>{msg}</div>;
}
