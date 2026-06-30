export default function Loader({ text = "Loading..." }) {
  return (
    <div className="flex items-center gap-3 text-slate-400 text-sm">
      <div className="spinner" />
      <span>{text}</span>
    </div>
  );
}
