require('dotenv').config({ path: '../.env' }); // ruta relativa al root del proyecto

const express = require("express");
const fs = require("fs");
const realTimeServer = require("./realTimeServer");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');
// const https = require("https");
const http = require("http");
const app = express();
const cors = require('cors');

app.use(cors({
  origin: ['http://localhost:5173','http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200 // Para navegadores antiguos
}));

// Middleware para parsear el cuerpo de las solicitudes como JSON
app.use(express.json());
app.use(cookieParser()); // << esto debe ir ANTES de cualquier `app.use(router)`
app.use(bodyParser.json());

//settings
app.set("port", process.env.PORT || 3000);

// Pasa io a tus rutas
// app.use((req, res, next) => {
//   req.io = io; // Ahora todas las rutas tendrán acceso a io
//   next();
// });


const authRoutes = require('./routes'); // o './routes/auth'
app.use('/api', authRoutes);


// app.use(express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, '../cliente/dist')));

app.get('*', (req, res, next) => {
  const ext = path.extname(req.path);
  if (ext) return next(); // Deja pasar archivos estáticos con extensión

  // Si no tiene extensión, asumimos que es una ruta de SPA
  res.sendFile(path.join(__dirname, '../cliente/dist/index.html'));
});

const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'ssl/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'ssl/cert.pem'))
  };

//Levanto el servidor
const httpsServer = http.createServer(sslOptions, app); //crea servidor https

//Llamo al servidor de Socket.io
realTimeServer(httpsServer);


httpsServer.listen(app.get("port"), () => {
    console.log(`Servidor HTTPS corriendo en http://localhost:${app.get("port")}`);
  });


