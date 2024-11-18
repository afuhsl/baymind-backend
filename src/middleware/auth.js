const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Acceso denegado' });
    }
  
    console.log("Token recibido:", token);  // Imprime el token para ver si está llegando correctamente
  
    try {
      const verified = jwt.verify(token, process.env.JWT_SECRET);
      req.user = verified;
      console.log("Usuario verificado:", req.user);  // Verifica el contenido de req.user
      next();
    } catch (error) {
      res.status(401).json({ error: 'Token inválido' });
    }
  };
  
module.exports = verifyToken;
