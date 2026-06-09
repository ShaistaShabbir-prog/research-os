interface ScoreCardProps {
  title: string;
  value: string | number;
  description?: string;
  color?: string;
}
export function ScoreCard({ title, value, description, color = "text-indigo-400" }: ScoreCardProps) {
  return (
    <div className="card">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">{title}</p>
      <p className={`text-3xl font-bold ${color} mb-1`}>{value}</p>
      {description && <p className="text-sm text-slate-400">{description}</p>}
    </div>
  );
}
