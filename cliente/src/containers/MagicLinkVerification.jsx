console.log("✅ MagicLinkVerification.jsx actualizado");
import React, { useEffect, useState } from 'react';

const MagicLinkVerification = () => {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");


  useEffect(() => {
    const verifyMagicLink = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        setErrorMsg("Token no proporcionado en el enlace.");
        setLoading(false);
        return;
      };

      try {
        const res = await fetch(`https://localhost:3000/api/magic-link?token=${token}`, {
          credentials: "include",
        });

        const data = await res.json();

        if (res.ok && data.redirectTo) {
          window.location.href = data.redirectTo;
        } else {
          setErrorMsg(data.message || "Error al verificar el enlace.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error en la verificación:", err);
        setErrorMsg("Hubo un problema al conectar con el servidor.");
        setLoading(false);
      }
    };

    verifyMagicLink();
  }, []);

  if (loading) return <p>Verificando enlace mágico...</p>;
  if (errorMsg) return <p style={{ color: 'red' }}>{errorMsg}</p>;

  return null;
  
};

export default MagicLinkVerification;