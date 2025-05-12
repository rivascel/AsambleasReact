import React, { useState } from "react";

const Questions = () => {
  const [selected, setSelected] = useState(null);
  const [decisionText, setDecisionText] = useState("Propuesta de ejemplo para ser votada.");
  const [votingEnabled, setVotingEnabled] = useState(false); // Cambia a true cuando debas habilitar la votación

  const handleVoteChange = (e) => {
    const value = e.target.value;
    setSelected(value);
    // Aquí puedes enviar el voto al backend si es necesario
    console.log("Voto seleccionado:", value);
  };

  return (
    <div className="bg-white p-4 rounded shadow-md space-y-4">
      <h2 className="text-xl font-semibold">Votación puntos de la agenda</h2>
      <h3 className="text-lg">Decisión a ser votada</h3>

      <div>
        <textarea
          value={decisionText}
          readOnly
          className="w-full border rounded p-2"
          rows={4}
        />
      </div>

      <form className="space-y-2">
        <fieldset>
          <legend className="font-medium mb-2">Opciones para decidir sobre propuesta</legend>
          <label className="block">
            <input
              type="radio"
              name="myRadio"
              value="1"
              disabled={!votingEnabled}
              checked={selected === "1"}
              onChange={handleVoteChange}
            />{" "}
            Aprueba
          </label>
          <label className="block">
            <input
              type="radio"
              name="myRadio"
              value="2"
              disabled={!votingEnabled}
              checked={selected === "2"}
              onChange={handleVoteChange}
            />{" "}
            Rechaza
          </label>
          <label className="block">
            <input
              type="radio"
              name="myRadio"
              value="0"
              disabled={!votingEnabled}
              checked={selected === "0"}
              onChange={handleVoteChange}
            />{" "}
            Blanco
          </label>
        </fieldset>
      </form>
    </div>
  );
};

export default Questions;

