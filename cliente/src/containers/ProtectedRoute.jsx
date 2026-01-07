// src/components/ProtectedRoute.jsx
import { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { UserContext } from "../components/UserContext";
import AppContext from '../context/AppContext';

const ProtectedRoute = ({ children }) => {
  const {
    isAuthenticatedOwner,
    isAuthenticatedAdmin,
    setIsAuthenticatedOwner,
    setIsAuthenticatedAdmin,
  } = useContext(UserContext);

  // const {email, setEmail} = useState(false);
  
  const { apiUrl } = useContext(AppContext);

  const [isVerifying, setIsVerifying] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Detectar si la ruta es del admin o del owner
        const isAdminRoute = location.pathname.startsWith("/admin");

        // try {
        //   const res = await axios.get(`${apiUrl}/api/admin-data`, {
        //     withCredentials: true,
        //   });
        //   setIsAuthenticatedAdmin(true);
        //   setEmail(res.data.email);

        // } catch {
        //   setIsAuthenticatedAdmin(false);
        //   console.warn("❌ No autenticado:");
        // }
        
        const endpoint = isAdminRoute
          ? `${apiUrl}/api/admin-data`
          : `${apiUrl}/api/owner-data`;

        try {
          const response = await axios.get(endpoint, { withCredentials: true });
          console.log("✅ Autenticación verificada:", response.data);

          if (response.data?.user === "administrador") {
            setIsAuthenticatedAdmin(true);
            // localStorage.setItem("isAuthenticatedAdmin", "true");
          } else if (response.data?.user === "owner") {
            setIsAuthenticatedOwner(true);
            // localStorage.setItem("isAuthenticatedOwner", "true");
          } else {
            throw new Error("Usuario no autorizado");
          }
        } catch (error) {
          if (error.response && error.response.status === 401) {
            console.error("Sesión expirada o no válida", error);
          }
          // No redirijas inmediatamente si estás en medio de la carga
        }

        
      } catch (error) {
        console.warn("❌ No autenticado:", error);

        // Limpiar autenticación local
        localStorage.removeItem("isAuthenticatedAdmin");
        localStorage.removeItem("isAuthenticatedOwner");
        setIsAuthenticatedAdmin(false);
        setIsAuthenticatedOwner(false);

        // Redirigir al login correcto
        // if (location.pathname.startsWith("/admin")) {
        //   navigate("/admin", { replace: true });
        // } else {
        //   navigate("/", { replace: true });
        // }
      } finally {
        setIsVerifying(false);
      }
    };

    // Revisión inicial
    verifyAuth();
  }, [setIsAuthenticatedAdmin, setIsAuthenticatedOwner]);

  // Mientras verifica autenticación
  if (isVerifying) {
    return (
      <div style={{ textAlign: "center", marginTop: "3rem" }}>
        <p>🔒 Verificando autenticación...</p>
      </div>
    );
  }

  // Mostrar el contenido si está autenticado
  const isAuthorized =
    (location.pathname.startsWith("/admin") && isAuthenticatedAdmin) ||
    (location.pathname.startsWith("/owner") && isAuthenticatedOwner);

  return isAuthorized ? children : null;
};

export default ProtectedRoute;
