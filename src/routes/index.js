const express=require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const nodemailer = require('nodemailer');
const passport = require('passport');
const jwt = require('jsonwebtoken');

//Traemos el config para el jwtSecret
const { config } = require('./../config/config');

const views = path.join(__dirname, "/../views");

const isLoggedIn = require("../middlewares/IsLoggedIn");

//definicion de rutas
router.get("/", (req, res) =>{
    res.sendFile(views + "/index.html");
});

router.get("/administrator", (req, res)=>{
    res.sendFile(views + "/administrator.html");
});

router.get("/file", (req, res)=>{
    const filePath = path.join(__dirname,'data','votacion.txt'); // Ruta segura al archivo
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error al leer en el archivo:', err);
            return res.status(500).send('Error al leer en el archivo.');
        }

        // res.send('Archivo escrito exitosamente.');
        try {
            // Dividir las líneas y parsearlas a objetos JSON
            const votes = data.split('\n') // Dividir por líneas
                .filter(line => line.trim() !== '') // Eliminar líneas vacías
                .map(line => JSON.parse(line)); // Parsear cada línea como JSON
            res.json(votes);
        } catch (parseError) {
            console.error('Error al parsear los datos:', parseError);
            res.status(500).send('Error al procesar los datos');
        }
    }); 
});

router.get("/dataFile", (req, res)=>{
    const filePath = path.join(__dirname,'data','correos.txt'); // Ruta segura al archivo
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error al leer en el archivo:', err);
            return res.status(500).send('Error al leer en el archivo.');
        }

        // res.send('Archivo escrito exitosamente.');
        try {
            // Dividir las líneas y parsearlas a objetos JSON
            const emails = data.split('\n') // Dividir por líneas
                .filter(line => line.trim() !== '') // Eliminar líneas vacías
                .map(line => JSON.parse(line)); // Parsear cada línea como JSON
            res.json(emails);
        } catch (parseError) {
            console.error('Error al parsear los datos:', parseError);
            res.status(500).send('Error al procesar los datos');
        }
    }); 
});

// ================= Archivos de correo validar Quorum ==================
router.get("/emailFile", (req, res)=>{
    const filePath = path.join(__dirname,'data','correos.txt'); // Ruta segura al archivo
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error al leer en el archivo:', err);
            return res.status(500).send('Error al leer en el archivo.');
        }

        // res.send('Archivo escrito exitosamente.');
        try {
            // Dividir las líneas y parsearlas a objetos JSON
            const votes = data.split('\n') // Dividir por líneas
                .filter(line => line.trim() !== '') // Eliminar líneas vacías
                .map(line => JSON.parse(line)); // Parsear cada línea como JSON
            res.json(votes);
        } catch (parseError) {
            console.error('Error al parsear los datos:', parseError);
            res.status(500).send('Error al procesar los datos');
        }
    }); 
});

router.post("/fileOwnerByEmail", (req, res)=>{
    const  { email }  = req.body;

    if (!email || typeof email !== 'string') {
        return res.status(400).send('Email es requerido y debe ser un string.');
    }

    const filePath = path.join(__dirname,'data','correos.txt'); // Ruta segura al archivo

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error al leer en el archivo:', err);
            return res.status(500).send('Error al leer en el archivo.');
        }

        try {
            // const owners = JSON.parse(data);
            const lines = data.split('\n') // Dividir por líneas
                .filter(line => line.trim() !== '') // Eliminar líneas vacías

            // Intentar parsear cada línea y manejar errores individualmente
            const owners = lines.map((line, index) => {
                try {
                    return JSON.parse(line);
                } catch (error) {
                    console.error(`Error al parsear la línea ${index + 1}:`, error);
                    throw new Error('Archivo contiene líneas inválidas.');
                }
                
            });
            // console.log("owners",owners);

            const owner = owners.find(o => o.correo.trim().toLowerCase() === email.trim().toLowerCase());

            if (owner) {
                const participacion = owner['participacion'];
                // console.log("participacion",participacion);

                return res.json({message:"contenido del archivo parseado y participacion",owner, participacion});
            } else {
                
                return res.status(404).send('Correo no encontrado.');
            }
        } catch (parseError) {
            console.error('Error al parsear los datos:', parseError);
            res.status(500).send('Error al procesar los datos');
        }
    }); 
});

router.post("/routes", (req, res)=>{
    const   globalNewDict   = req.body;
    
    // res.json(globalNewDict);
    const filePath=path.join(__dirname,'data','votacion.txt'); // Ruta segura al archivo
    // console.log ( "tipo de dato", req)

    // Validar la entrada
    if (!filePath || !globalNewDict) {
        return res.status(400).send('Falta filePath o data en el cuerpo de la solicitud.');
    }

    // Escribir en el archivo
    fs.appendFile(filePath, JSON.stringify(globalNewDict) + '\n', (err) => {
        if (err) {
            console.error('Error al escribir en el archivo:', err);
            return res.status(500).send('Error al escribir en el archivo.');
        }

        res.send('Archivo escrito exitosamente.');
    });
});

// ============================= envio del enlace ======================

// Configuración de transporte de Nodemailer
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: config.email_user,
        pass: config.email_pass
    },
});

async function testMail() {
    try {
        await transporter.verify();
        console.log("Conexión con Gmail exitosa");
    } catch (error) {
        console.error("Error conectándose:", error.message);

    }
}
testMail();


router.get("/owner", (req, res) =>{
    res.sendFile(views + "/owner.html");
});

// Endpoint para solicitar un enlace mágico
router.post('/request-magic-link', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email es requerido' });
    }

    // Generar un token JWT con un tiempo de expiración (15 minutos)
    const token = jwt.sign({ email }, config.jwtSecret, { expiresIn: '15m' });
    const magicLink = `${config.BaseUrl}/owner?token=${token}`;

    try {
        // Enviar correo con el enlace mágico
        await transporter.sendMail({
            from: `"Asamblea Copropietarios" <${config.email_user}>`,
            to: email,
            subject: 'Tu enlace para acceder a la Asamblea de Copropietarios',
            html: `<p>Haz clic en el enlace para acceder a la aplicación:</p>
                   <a href="${magicLink}">Acceder</a>`,
        });

        res.json({ message: 'Enlace mágico enviado. Verifica tu correo electrónico.' });
    } catch (error) {
        res.status(500).json({ message: 'Error enviando el enlace mágico', error });
    }
});

// Endpoint para manejar el enlace mágico
router.get('/magic-link', (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ message: 'Token es requerido' });
    }

    try {
        // Verificar el token
        const payload = jwt.verify(token, SECRET_KEY);

        res.json({ message: 'Acceso concedido', email: payload.email });
    } catch (error) {
        res.status(401).json({ message: 'Token inválido o expirado' });
    }
});


module.exports = router;