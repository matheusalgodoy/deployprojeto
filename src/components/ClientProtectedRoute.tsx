import { Navigate } from "react-router-dom";

interface ClientProtectedRouteProps {
  children: React.ReactNode;
}

const ClientProtectedRoute = ({ children }: ClientProtectedRouteProps) => {
  const isAuthenticated = localStorage.getItem("client_authenticated") === "true";
  const authTimestamp = localStorage.getItem("client_auth_timestamp");
  
  // Verificar se o token expirou (24 horas)
  if (authTimestamp) {
    const now = new Date().getTime();
    const tokenAge = now - parseInt(authTimestamp);
    const tokenExpired = tokenAge > 24 * 60 * 60 * 1000; // 24 horas em milissegundos
    
    if (tokenExpired) {
      // Limpar dados de autenticação expirados
      localStorage.removeItem("client_auth_token");
      localStorage.removeItem("client_auth_timestamp");
      localStorage.removeItem("client_auth_email");
      localStorage.removeItem("client_authenticated");
      return <Navigate to="/login" replace />;
    }
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ClientProtectedRoute;
