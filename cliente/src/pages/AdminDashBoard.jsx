import React from 'react';
import { useState, useEffect, useContext } from 'react';


import Approve from '../containers/admin/Approve';
import Chat from '../containers/Chat';
import Graph from '../containers/Graph';
import VideoAdmin from '../containers/admin/Video_admin';
import MeetingPoll from '../containers/admin/Meeting_poll';
import Questions from '../containers/admin/SendQuestion';
import { UserContext } from "../components/UserContext";

const Section = ({ title, children }) => (
  <div className="bg-white p-4 rounded-lg shadow-md">
    <h2 className="text-xl font-semibold mb-2">{title}</h2>
    <div>{children}</div>
  </div>
);

const DashBoardAdmin = () => {
  // const [email, setEmail] = useState(null);
  const [error, setError] = useState(null);
  const { email, login } = useContext(UserContext);

  useEffect(() => {
    if (!email) {
      setError("No autorizado. Redirigiendo...");
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  }, []);

  if (error) return <p>{error}</p>;

    return (
        <>
    
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Bienvenido al panel del Administrador</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        <Section title="Transmisión General">
          <VideoAdmin />
        </Section>

        <Section title="Punto a ser votado">
          <Questions />
        </Section>

        <Section title="Otorgar la Palabra">
          <Approve />
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

export default DashBoardAdmin;