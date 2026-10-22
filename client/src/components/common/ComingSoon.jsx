import { Link } from 'react-router';
import { Lock } from 'lucide-react';
import EmptyState from './EmptyState.jsx';

export default function ComingSoon({ title, body }) {
  return (
    <div className="page">
      <EmptyState
        icon={Lock}
        title={title}
        body={body}
        action={
          <Link to="/prep" className="btn">
            Go to Prep Hub
          </Link>
        }
      />
    </div>
  );
}
