import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import '../styles/Header.css';

import { UserContext } from "../components/UserContext";

const Header = () => {
    const { ownerData, quorum } = useContext(UserContext);

    // useEffect(() => {
    //     console.log("Datos del propietario recibidos en Header:", ownerData);
    // }, [ownerData]);

    return (
        <header style={{
            backgroundColor: '#282c34',
            padding: '1rem',
            color: 'white',
            textAlign: 'center',
          }}>
            <h1>Web Asambleas</h1>
            <div className="identification">
                <h3>Dato Inmueble/Propietario</h3>

                <form id="data">
                    <div className="form-row">
                        <strong>Interior</strong>
                        <p id="interior">
                            {ownerData?.interior || ''}
                            </p>
                    </div>
                
                    <div className="form-row">
                        <strong>Apartamento</strong>
                        <p id="apartamento">
                            {ownerData?.apartamento || ''}
                            </p>
                    </div>
                
                    <div className="form-row">
                        <strong>Correo Electrónico</strong>
                        <p id="correo">
                            {ownerData?.email || ''}
                            </p>
                    </div>
                
                    <div className="form-row">
                        <strong>Inmuebles que representa</strong>
                        <p id="participacion">
                            {ownerData?.participacion || ''}
                            </p>
                    </div>
                
                    <div className="form-row">
                        <strong>Porcentaje de quorum</strong>
                        <div id="quorum">
                            {/* {quorum !== null ? `${quorum.toFixed(2)}%` : "No disponible"} */}
                            {/* {quorum || "No disponible"} */}
                            {typeof quorum === "number" ? `${quorum.toFixed(2)}%` : "No disponible"}
                        </div>
                    </div>

                    <p id="mensajeError"></p>
                    <p id="resultado">  </p>
                </form>
            </div>
            
        </header>
        );
};

export default Header;