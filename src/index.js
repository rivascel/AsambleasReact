const express = require("express");
const {createServer} = require("http");
const realTimeServer = require("./realTimeServer");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');


const app = express();
const httpServer = createServer(app);

app.use(bodyParser.json());

// Middleware para parsear el cuerpo de las solicitudes como JSON
app.use(express.json());

//settings
app.set("port", process.env.PORT || 3000);
app.set("views", path.join(__dirname, "views"))
app.use(cookieParser());

//Routes
app.use(require("./routes"));

//Public
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, 'assets')));

//app.use()

// Manejo de rutas en Single Page Applications (SPA)
app.get('*', (req, res, next) => {
    if (req.path.endsWith('.js') || req.path.endsWith('.css')) {
        return next(); // Deja que Express maneje los archivos estáticos
    }
    res.sendFile(path.join(__dirname, 'public')); // Envía el archivo HTML para cualquier otra ruta
});


//Levanto el servidor
httpServer.listen(app.get("port"), ()=>{
    console.log("el servidor esta corriendo en el puerto ", 
    app.get("port"));
});

//Llamo al servidor de Socket.io
realTimeServer(httpServer);



