import React, { useState, useEffect } from "react";
import axios from "axios";

const RegisterOwner = ({ onRegister }) => {

    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");

    // useEffect(() => {
    //     axios.get("https://localhost:3000/api/owner-data", { withCredentials: true })
    //       .then(() => window.location.href = "/owner")
    //       .catch(() => {}); // no hacer nada si no hay sesión
          
    //   }, []);
  
    const handleSendLink = async () => {
      try {
        const response = await axios.post("https://localhost:3000/api/request-magic-link", 
            { email },
            { withCredentials: true }
    );
        setMessage("Enlace enviado. Revisa tu correo.");
        onRegister?.(); // si quieres avanzar al siguiente paso visual
      } catch (error) {
        console.error(error);
        setMessage("Hubo un error al enviar el enlace.");
      }
    };

    return (
        <>
        <div className="input-group">
            <label htmlFor="username">Escribe tu correo electrónico</label>
            <input type="email" id="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
        </div>
        <div className="button-container">
            <button type="button" className="btn primary" id="login" onClick={handleSendLink}>
                Entrar al chat
            </button>
        </div>
        </>
    ); 
};

export default RegisterOwner;


