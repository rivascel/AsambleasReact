import React from 'react';


const Header = () => {
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
                        <p id="interior"></p>
                    </div>
                
                    <div className="form-row">
                        <strong>Apartamento</strong>
                        <p id="apartamento"></p>
                    </div>
                
                    <div className="form-row">
                        <strong>Correo Electrónico</strong>
                        <p id="correo"></p>
                    </div>
                
                    <div className="form-row">
                        <strong>Inmuebles que representa</strong>
                        <p id="participacion"></p>
                    </div>
                
                    <div className="form-row">
                        <strong>Porcentaje de quorum</strong>
                        <div id="quorum"></div>
                    </div>

                    <p id="mensajeError"></p>
                    <p id="resultado"></p>
                </form>
            </div>
            
        </header>
        );
};

export default Header;