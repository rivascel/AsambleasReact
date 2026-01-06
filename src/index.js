// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

require('dotenv').config(); // ruta relativa al root del proyecto

const express = require("express");
// const fs = require("fs");
const realTimeServer = require("./realTimeServer");
// const path = require("path");
const cookieParser = require("cookie-parser");
// const bodyParser = require('body-parser');
// const https = require("https");
const http = require("http");
const app = express();
const cors = require('cors');
const path = require("path");

// app.use(cors({
//   origin: ['https://localhost:5173','https://localhost:3000'],
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization'],
//   credentials: true,
//   optionsSuccessStatus: 200 // Para navegadores antiguos
// }));

app.set('trust proxy', 1);

// app.use(cors({
//   origin: (origin, callback) => {
//     console.log("🌐 Origin recibido:", origin);
//     callback(null, true);
//   },
//   credentials: true,
// }));

// 2. Configura CORS de forma explícita (evita el origin: true si es posible)
const allowedOrigins = [
  'https://asambleasdeployed.onrender.com', 
  'https://asambleasreact.onrender.com' // Agrega todas las variantes que veas en tus logs
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir peticiones sin origin (como Postman o health checks)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error("❌ Bloqueado por CORS:", origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: [    
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'],
    exposedHeaders: ['Set-Cookie']
}));

// app.use(cors({
//   // origin: 'https://asambleasdeployed.onrender.com',
//   origin: true,
//   credentials: true,
//   methods: ['GET', 'POST', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

// app.use(cors({
//   origin: config.FrontEndBaseUrl, // URL de tu frontend
//   credentials: true, // Importante para cookies
//   methods: ['GET', 'POST', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

app.use(cookieParser()); // << esto debe ir ANTES de cualquier `app.use(router)`
// app.use(bodyParser.json());

// Middleware para parsear el cuerpo de las solicitudes como JSON
app.use(express.json());



// app.use(cors({ origin: process.env.FRONTEND_URL }));

app.get('/health', (req, res) => {
  res.send('OK');
});

const authRoutes = require('./routes'); // o './routes/auth'
app.use('/api', authRoutes);

// servir frontend
app.use(express.static(path.join(__dirname, "cliente/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "cliente/dist/index.html"));
});


// app.use(express.static(path.join(__dirname, 'assets')));
// app.use(express.static(path.join(__dirname, '../cliente/dist')));

// app.get('*', (req, res, next) => {
//   const ext = path.extname(req.path);
//   if (ext) return next(); // Deja pasar archivos estáticos con extensión

  // Si no tiene extensión, asumimos que es una ruta de SPA
//   res.sendFile(path.join(__dirname, '../cliente/dist/index.html'));
// });



//settings
app.set("port", process.env.PORT || 10000);
app.set("host", "0.0.0.0");

// Obtén los valores
const PORT = app.get("port");
const HOST = "0.0.0.0";


let server;
server = http.createServer(app);
realTimeServer(server);


server.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor escuchando en ${HOST}:${PORT}`);
});