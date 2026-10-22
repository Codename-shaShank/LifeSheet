export default function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="empty-state">
      {Icon && (
        <span className="empty-icon">
          <Icon size={18} />
        </span>
      )}
      <h2>{title}</h2>
      {body && <p>{body}</p>}
      {action}
    </div>
  );
}
