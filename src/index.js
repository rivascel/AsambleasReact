// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

require('dotenv').config(); // ruta relativa al root del proyecto
const { config } = require('dotenv');

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

// 2. Configura CORS de forma explícita (evita el origin: true si es posible)
const allowedOrigins = [
  'https://asambleasdeployed.onrender.com', 
  'https://asambleasreact.onrender.com', // Agrega todas las variantes que veas en tus logs
  'http://localhost:5173',
  'http://localhost:3000'
];

const originConfig = process.env.NODE_ENV === 'development' 
  ? true // Permite todo en desarrollo
  : function (origin, callback) {  // Permitir peticiones sin origin (como Postman o health checks)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error("❌ Bloqueado por CORS:", origin);
      callback(new Error('Not allowed by CORS'));
    } 
};

app.use(cors({
  origin: originConfig,
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


app.use(cookieParser()); // << esto debe ir ANTES de cualquier `app.use(router)`

// Middleware para parsear el cuerpo de las solicitudes como JSON
app.use(express.json());


app.get('/health', (req, res) => {
  res.send('OK');
});

const authRoutes = require('./routes'); // o './routes/auth'

app.use('/api', authRoutes);

if (process.env.NODE_ENV === 'production') {
    // Esta es la forma más segura de apuntar a la raíz del proyecto en Render
  const publicPath = path.resolve(__dirname, '..', 'cliente', 'dist');

  // Servir archivos estáticos
  app.use(express.static(publicPath));

  // Ruta comodín para React
  app.get('*', (req, res) => {
      res.sendFile(path.join(publicPath, 'index.html'));
});

};


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