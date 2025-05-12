import React, { useEffect, useState } from 'react';
import axios from 'axios';

import Ask from '../containers/owner/Ask';
import Chat from '../containers/Chat';
import Graph from '../containers/Graph';
import VideoGeneral from '../containers/Video_general';
import VideoPersonal from '../containers/Video_personal';
import Questions from '../containers/Questions';
import MeetingPoll from '../containers/admin/Meeting_poll';

const Section = ({ title, children }) => (
  <div className="bg-white p-4 rounded-lg shadow-md">
    <h2 className="text-xl font-semibold mb-2">{title}</h2>
    <div>{children}</div>
  </div>
);

const DashBoardOwner = () => {
  const [email, setEmail] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get("https://localhost:3000/api/owner-data", {
      withCredentials: true,
    })
    .then((res) => setEmail(res.data.email))
    .catch((err) => {
      console.error(err);
      setError("No autorizado. Redirigiendo...");
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    });
  }, []);

  if (error) return <p>{error}</p>;

  return (
    <>
    
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Bienvenido al panel del propietario</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Section title="Transmisión General">
          <VideoGeneral />
        </Section>

        <Section title="Tu Cámara">
          <VideoPersonal />
        </Section>

        <Section title="Preguntas Recibidas">
          <Questions />
        </Section>

        <Section title="Pedir la Palabra">
          <Ask />
        </Section>

        <Section title="Votación">
          <MeetingPoll />
        </Section>

        <Section title="Chat">
          <Chat />
        </Section>

        <Section title="Gráficos">
          <Graph />
        </Section>
      </div>
    </div>
    </>
  );

};

export default DashBoardOwner;