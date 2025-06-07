import React, { useState } from "react";
import axios from "axios";

const AskToParticipate = () => {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleRequest = async () => {
    try {
      // Ejemplo de envío al backend (ajusta a tu API o Supabase)
      await axios.post("http://localhost:3000/api/request-participation", 
        { roomId: "main-room" }, 
        {
        withCredentials: true, // si usas cookies seguras
      });

      setSent(true);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Error al enviar la solicitud.");
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow-md text-center">
      <h3 className="text-lg font-semibold mb-4">¿Quieres participar?</h3>

      {sent ? (
        <p className="text-green-600 font-medium">Solicitud enviada ✅</p>
      ) : (
        <>
          <button
            onClick={handleRequest}
            className="bg-blue-600 text-black px-6 py-2 rounded hover:bg-blue-700"
          >
            Solicitar participación
          </button>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </>
      )}
    </div>
  );
};

export default AskToParticipate;