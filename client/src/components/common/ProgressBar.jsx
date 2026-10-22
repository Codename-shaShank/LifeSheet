export default function ProgressBar({ value, max, size = 'md', label }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  return (
    <span
      className={`progress progress-${size}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
    >
      <span className="progress-fill" style={{ width: `${pct}%` }} />
    </span>
  );
}
