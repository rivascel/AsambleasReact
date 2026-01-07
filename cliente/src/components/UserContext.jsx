import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import AppContext from '../context/AppContext';

export const UserContext = createContext(null);

import { API_URL } from '../config/api'; // Impórtalo directamente


const UserProvider = ({ children }) => {
  // const { apiUrl } = useContext(AppContext);
  // const apiUrl = import.meta.env.VITE_BACKEND_URL;
  const apiUrl = API_URL; // Úsalo directamente


  const [email, setEmail] = useState("");
  const [users, setUsers] = useState([]); // NUEVO
  const [adminId, setAdminId] = useState(""); // NUEVO
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [ownerData, setOwnerData] = useState(null); // NUEVO
  const [quorum, setQuorum] = useState(null);
  const [votingEnabled, setVotingEnabled] = useState(false); 
  const [decisionText, setDecisionText] = useState("Propuesta de ejemplo para ser votada.");
  const [approvalVotes, setApprovalVotes] = useState(0);
  const [rejectVotes, setRejectVotes] = useState(0);
  const [blankVotes, setBlankVotes] = useState(0);    
  const [checkApprove, setCheckApprove] = useState(null);
  const [isAuthenticatedAdmin, setIsAuthenticatedAdmin] = useState(false);
  const [isAuthenticatedOwner, setIsAuthenticatedOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  
 // ✅ Verificar sesión con el backend y restaurar localStorage
  useEffect(() => {
    const verifySession = async () => {
      try {
        // Intenta verificar cookies de owner
        const ownerAuth = localStorage.getItem("isAuthenticatedOwner") === "true";
        const adminAuth = localStorage.getItem("isAuthenticatedAdmin") === "true";

        if (ownerAuth) setIsAuthenticatedOwner(true);
        if (adminAuth) setIsAuthenticatedAdmin(true);

        // Verifica sesión en el backend (opcional, más seguro)
        // await checkBackendSession();
      } catch (error) {
        console.log("⚠️ Error verificando sesión:", error);
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  // 🔍 Verifica cookies del backend
  const checkBackendSession = async () => {
    try {
      // Verifica si hay sesión del owner
      const ownerRes = await axios.get(`${apiUrl}/api/owner-data`, {
        withCredentials: true,
      });

      if (ownerRes.data?.user === "owner") {
        setIsAuthenticatedOwner(true);
        localStorage.setItem("isAuthenticatedOwner", "true");
      }

      // Verifica si hay sesión del admin
      const adminRes = await axios.get(`${apiUrl}/api/admin-data`, {
        withCredentials: true,
      });

      if (adminRes.data?.user === "administrador") {
        setIsAuthenticatedAdmin(true);
        localStorage.setItem("isAuthenticatedAdmin", "true");
      }
    } catch (error) {
      // Si no hay sesión activa, se limpia el localStorage
      localStorage.removeItem("isAuthenticatedOwner");
      localStorage.removeItem("isAuthenticatedAdmin");
    }
  };

  const login = (email, data) => {
    setEmail(email);
    setIsAuthenticated(true);
    setOwnerData(data);
    // setVotingEnabled(true);

     localStorage.setItem(
      "ownerInfo",
      JSON.stringify({ email, ownerData: data, quorum }) // quorum puede agregarse después
    );
  };

  // 🔐 Función para cerrar sesión
  const logout = async () => {
    try {
      await axios.post(`${apiUrl}/api/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    } finally {
      setIsAuthenticatedAdmin(false);
      setIsAuthenticatedOwner(false);
      localStorage.removeItem("isAuthenticatedOwner");
      localStorage.removeItem("isAuthenticatedAdmin");

      setEmail("");
      setIsAuthenticated(false);
      setOwnerData(null);
      setQuorum(null);
      localStorage.removeItem("ownerInfo");

    }
  };

    // ✅ Recuperar datos guardados al inicio
  useEffect(() => {
    const savedData = localStorage.getItem("ownerInfo");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setEmail(parsed.email);
      setOwnerData(parsed.ownerData);
      setQuorum(parsed.quorum || null);
      setIsAuthenticated(true);
    }
  }, []);

  
  return (
    <UserContext.Provider value={
      { 
        isAuthenticated,
        setIsAuthenticated,
        email,
        setEmail,
        login,
        logout,
        ownerData,
        quorum,
        setQuorum,
        votingEnabled, 
        setVotingEnabled,
        decisionText,
        setDecisionText,
        approvalVotes,
        rejectVotes,
        blankVotes,
        setApprovalVotes,
        setRejectVotes,
        setBlankVotes,
        setAdminId,
        checkApprove,
        setCheckApprove,
        isAuthenticatedOwner,
        isAuthenticatedAdmin,
        setIsAuthenticatedOwner,
        setIsAuthenticatedAdmin,
        loading,
        checkBackendSession
        
       }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
