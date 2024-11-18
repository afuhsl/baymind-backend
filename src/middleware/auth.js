const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {      
        return res.status(401).json({ error: 'Acceso denegado, no se proporcionó un token' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified;
        console.log('Token verificado:', req.user);  // Añade un log para verificar el contenido del token
        next();
    } catch (error) {
        console.error('Error al verificar el token:', error);  // Registra el error de verificación
        res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

module.exports = verifyToken;
