const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
   
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado' });
    }
  
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token verificado:', verified);  // Verificar el contenido del token decodificado
        req.user = verified;  // Asignar el contenido del token a req.user
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
  };
  

module.exports = verifyToken;
