// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

require('dotenv').config({ path: '../.env' }); // ruta relativa al root del proyecto

const express = require("express");
const fs = require("fs");
const realTimeServer = require("./realTimeServer");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');
const https = require("https");
const http = require("http");
const app = express();
const cors = require('cors');

app.use(cors({
  origin: ['https://localhost:5173','https://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200 // Para navegadores antiguos
}));

// Middleware para parsear el cuerpo de las solicitudes como JSON
app.use(express.json());
app.use(cookieParser()); // << esto debe ir ANTES de cualquier `app.use(router)`
// app.use(bodyParser.json());

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


//settings
app.set("port", process.env.PORT || 3000);
app.set("host", "0.0.0.0");

// Obtén los valores
const PORT = app.get("port");
const HOST = "0.0.0.0";

// Configuración para Render (certificados automáticos)
// En Render, los certificados están en rutas específicas
// const isRender = process.env.RENDER || false; // Render setea RENDER=true
const isRender = !!process.env.RENDER

let sslOptions;
if (isRender) {
  // En Render, usa certificados automáticos si están disponibles
  // O configura para aceptar HTTPS externo
  // console.log('✅ Modo Render: Configurando para HTTPS externo');
  // Continuar sin opciones específicas, Render maneja SSL

  console.log('✅ Render detectado: usando HTTP (SSL lo maneja Render)');
  server = http.createServer(app);
} else {
  // Desarrollo local: tus certificados autofirmados
  console.log('🔐 Desarrollo local: usando HTTPS');

  sslOptions = {
      key: fs.readFileSync(path.join(__dirname, 'ssl/localhost-key.pem')),
      cert: fs.readFileSync(path.join(__dirname, 'ssl/localhost.pem'))
    };
 server = https.createServer(sslOptions, app);
 realTimeServer(server);
};
//Levanto el servidor
//  httpsServer = https.createServer(sslOptions, app); //crea servidor https


// const isProduction = process.env.NODE_ENV === 'production';
// const protocol = httpsServer instanceof https.Server ? 'https' : 'http';


//Llamo al servidor de Socket.io
// realTimeServer(httpsServer);
// realTimeServer(server);

// httpsServer.listen(app.get("port"), () => {
//     console.log(`Servidor HTTPS corriendo en https://localhost:${app.get("port")}`);
//   });


//   httpsServer.listen(app.get("port"), "0.0.0.0", () => {
//   console.log(`Servidor corriendo en puerto ${app.get("port")}`);
// });


// httpsServer.listen(PORT, HOST, () => {
//   console.log(`✅ Servidor ${protocol} corriendo en ${protocol}://${HOST}:${PORT}`);
  
//   if (HOST === '0.0.0.0') {
//     console.log(`🔗 Accede localmente en: ${protocol}://localhost:${PORT}`);
//   }
  
//   if (isProduction) {
//     console.log(`🚀 Aplicación lista en producción`);
//   }
// });

// httpsServer.listen(PORT, HOST, () => {
//   console.log(`✅ Servidor HTTPS listo en puerto ${PORT}`);
//   if (!isRender) {
//     console.log(`🔗 Local: https://localhost:${PORT}`);
//   }
// });

server.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor escuchando en ${HOST}:${PORT}`);
});