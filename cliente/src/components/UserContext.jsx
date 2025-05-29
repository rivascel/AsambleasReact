import React, { createContext, useState, useEffect } from "react";

export const UserContext = createContext();

const UserProvider = ({ children }) => {
  const [email, setEmail] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [ownerData, setOwnerData] = useState(null); // NUEVO
  const [quorum, setQuorum] = useState(null);
  const [votingEnabled, setVotingEnabled] = useState(false); 


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

  const logout = () => {
    setEmail("");
    setIsAuthenticated(false);
    setOwnerData(null);
    setQuorum(null);
    localStorage.removeItem("ownerInfo");
  };

  return (
    <UserContext.Provider value={
      { 
        isAuthenticated,
        setIsAuthenticated,
        email,
        login,
        logout,
        ownerData,
        quorum,
        setQuorum,
        votingEnabled, 
        setVotingEnabled
       }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
