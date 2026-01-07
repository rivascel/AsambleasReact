// middlewares/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config/config'); // Ajusta la ruta a tu config

function requireAuth(req, res, next) {
    // 1. Extraer el token de las cookies
    // LOGS DE EMERGENCIA (Aparecerán antes de cualquier lógica)
    console.log("---------------- AUTH CHECK ----------------");
    console.log("🕒 Hora:", new Date().toISOString());
    console.log("🔗 Path:", req.path);
    console.log("🍪 Cookies crudas (Header):", req.headers.cookie || "SIN COOKIES EN HEADER");
    console.log("📦 req.cookies (Parser):", req.cookies ? JSON.stringify(req.cookies) : "COOKIE-PARSER NO FUNCIONA");
    console.log("--------------------------------------------");

    try {
        if (!req.cookies) {
        console.error("❌ cookie-parser no activo");
        return res.status(500).json({ message: "Error de servidor (cookies)" });
        }

        const token = req.cookies.token;

        if (!token) {
            console.warn("⚠️ Intento de acceso sin token");
            return res.status(401).json({ message: "No hay token, por favor inicia sesión" });
        }
    
        // 2. Verificar el JWT
        console.log("🔍 Verificando Secret:", process.env.JWT_SECRET_KEY ? "EXISTE" : "NO EXISTE/UNDEFINED");
        const payload = jwt.verify(token, config.jwtSecret);
        console.log("✅ Token verificado para usuario ID:", payload);
        
        // 3. Inyectar el usuario en la request para que los endpoints lo usen
        req.user = payload; 

        // 5. ¡IMPORTANTE! Solo un next() al final del éxito
        next();
        
    } catch (err) {
        console.error("❌ Error de JWT:", err.message);
        return res.status(401).json({ message: "Token inválido o expirado" });
    }
}

module.exports = { requireAuth };