import { Navigate, useLocation } from "react-router-dom";

/**
 * Redirect that preserves the query string (and hash) so UTM / attribution
 * parameters survive legacy-URL and route-variant redirects.
 */
const KeepQueryRedirect = ({ to }: { to: string }) => {
  const { search, hash } = useLocation();
  return <Navigate to={`${to}${search}${hash}`} replace />;
};

export default KeepQueryRedirect;
