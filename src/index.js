const express = require("express");
const {createServer} = require("http");
const realTimeServer = require("./realTimeServer");
const path = require("path");
const cookieParser = require("cookie-parser");


const app = express();
const httpServer = createServer(app);

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

//app.use()

//Levanto el servidor
httpServer.listen(app.get("port"), ()=>{
    console.log("el servidor esta corriendo en el puerto ", 
    app.get("port"));
});

//Llamo al servidor de Socket.io
realTimeServer(httpServer);



