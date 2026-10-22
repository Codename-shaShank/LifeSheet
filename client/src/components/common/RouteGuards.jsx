import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

function FullScreenLoader() {
  return (
    <div className="fullscreen-center" aria-busy="true">
      <span className="brand">LifeSheet</span>
    </div>
  );
}

export function RequireAuth({ children }) {
  const { status, user } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}

/** Login/signup pages: once a user exists, send them where they were heading. */
export function PublicOnly({ children }) {
  const { status, user } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullScreenLoader />;
  if (user) return <Navigate to={location.state?.from ?? '/prep'} replace />;
  return children;
}
