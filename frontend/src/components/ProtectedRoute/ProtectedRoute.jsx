import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from '../Loader/Loader';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader fullPage size="lg" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!user.isVerified) {
    return <Navigate to={`/verify-otp?email=${encodeURIComponent(user.email)}`} replace />;
  }

  return children;
};

export default ProtectedRoute;
