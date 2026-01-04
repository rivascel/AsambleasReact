// middlewares/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config'); // Ajusta la ruta a tu config

function requireAuth(req, res, next) {
    // 1. Extraer el token de las cookies
    const token = req.cookies.token;

    if (!token) {
        console.warn("⚠️ Intento de acceso sin token");
        return res.status(401).json({ message: "No hay token, por favor inicia sesión" });
    }

    try {
        // 2. Verificar el JWT
        const payload = jwt.verify(token, config.jwtSecret);
        
        // 3. Inyectar el usuario en la request para que los endpoints lo usen
        req.user = payload; 

        // 4. (Opcional) Si además necesitas la cookie de sesión para algo extra:
        if (!req.cookies.session) {
             console.warn("⚠️ Token válido pero falta cookie de sesión");
             // Podrías dejarlo pasar o ser estricto:
             // return res.status(401).json({ message: 'Sesión incompleta' });
        }

        // 5. ¡IMPORTANTE! Solo un next() al final del éxito
        next();
        
    } catch (err) {
        console.error("❌ Error de JWT:", err.message);
        return res.status(401).json({ message: "Token inválido o expirado" });
    }
}

module.exports = { requireAuth };