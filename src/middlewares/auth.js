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
        const userRole = req.cookies.username;

        if (userRole === 'owner' && !token) {
            console.warn("⚠️ Intento de acceso sin token");
            return res.status(401).json({ message: "No hay token, por favor inicia sesión" });
        }

        // USA DIRECTAMENTE process.env PARA EVITAR ERRORES DE REFERENCIA
        const secret = process.env.JWT_SECRET_KEY; 

        if (!secret) {
            console.error("❌ ERROR CRÍTICO: La variable JWT_SECRET_KEY no está definida en el sistema");
            return res.status(500).json({ message: "Error interno de configuración" });
        }

    
        // 2. Verificar el JWT
        if (userRole === 'owner') {
            console.log("🔍 Verificando Secret:", process.env.JWT_SECRET_KEY ? "EXISTE" : "NO EXISTE/UNDEFINED");
            const payload = jwt.verify(token, secret);
            console.log("✅ Token verificado para usuario ID:", payload);
        
            // 3. Inyectar el usuario en la request para que los endpoints lo usen
            req.user = payload; 
            // 5. ¡IMPORTANTE! Solo un next() al final del éxito
            next();
        }

        // CASO 1: Es Administrador -> Pasa directo
        if (userRole === 'administrador') {
            console.log("👤 Acceso concedido como Administrador (sin JWT)");
            return next(); 
        }

        // CASO 3: No es ninguno de los dos
        console.warn("🚫 Rol no reconocido:", userRole);
        return res.status(403).json({ message: "No tienes permiso para acceder" });
        
        
    } catch (err) {
        console.error("❌ Error de JWT:", err.message);
        return res.status(401).json({ message: "Token inválido o expirado" });
    }
}

module.exports = { requireAuth };