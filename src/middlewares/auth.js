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

    // Permite scripts de dominios externos necesarios para Excalidraw
    res.setHeader(
        "Content-Security-Policy",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://asambleasreact.onrender.com;"
    );
    next();

    // const sessionData = req.cookies.session ? JSON.parse(req.cookies.session) : null;
    // const userRole = sessionData ? sessionData.role : null;

    try {
            if (!req.cookies) {
                return res.status(500).json({ message: "Error de servidor (cookies)" });
            }

            // 1. Intentar obtener el rol desde la cookie 'session' o 'username'
            let userRole = null;
            try {
                const sessionData = req.cookies.session ? JSON.parse(req.cookies.session) : null;
                userRole = sessionData ? sessionData.role : null;
            } catch (e) {
                console.error("Error parseando cookie de sesión");
            }

            const token = req.cookies.token;

            // CASO 1: Administrador
            if (userRole === 'administrador') {
                // Inyectamos req.user manualmente para que el endpoint no falle
                req.user = { email: sessionData.email, role: 'administrador' };
                console.log("👤 Acceso concedido como Administrador");
                return next(); 
            }

            // CASO 2: Owner
            if (userRole === 'owner') {
                if (!token) {
                    return res.status(401).json({ message: "No hay token de owner" });
                }

                const secret = process.env.JWT_SECRET_KEY;
                const payload = jwt.verify(token, secret);
                req.user = payload;
                return next();
            }

            // CASO 3: Fallo
            console.warn("🚫 Rol no reconocido:", userRole);
            return res.status(403).json({ message: "Acceso denegado: Rol inválido" });

        } catch (err) {
            console.error("❌ Error en Auth:", err.message);
            if (!res.headersSent) {
                return res.status(401).json({ message: "Sesión inválida o expirada" });
            }
        }
}

module.exports = { requireAuth };