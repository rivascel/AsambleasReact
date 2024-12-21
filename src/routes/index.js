const express=require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");

const views = path.join(__dirname, "/../views");

const isLoggedIn = require("../middlewares/IsLoggedIn");


//definicion de rutas
router.get("/", (req, res) =>{
    res.sendFile(views + "/index.html");
});

router.get("/owner", (req, res) =>{
    res.sendFile(views + "/owner.html");
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

module.exports = router;