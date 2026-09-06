interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'warn' | 'danger';
}

export default function StatCard({ label, value, sub, tone = 'default' }: StatCardProps) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}
