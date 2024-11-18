const router = require('express').Router();
const User = require('../models/user');
const verifyToken = require('../middleware/auth');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Ruta de registro
router.post('/register', async (req, res) => {
    try {
        // Verificar si el email ya existe
        const emailExists = await User.findOne({ email: req.body.email });
        if (emailExists) {
            return res.status(400).json({ error: 'Email ya registrado' });
        }

        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        // Crear nuevo usuario
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashedPassword
        });

        // Guardar usuario
        const savedUser = await user.save();
        
        // Crear y asignar token
        const token = jwt.sign(
            { _id: savedUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            error: null,
            data: {
                token,
                user: {
                    id: savedUser._id,
                    name: savedUser.name,
                    email: savedUser.email
                }
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Ruta de login
router.post('/login', async (req, res) => {
    try {
        // Verificar si el usuario existe
        const user = await User.findOne({ email: req.body.email }).select('+password');
        if (!user) {
            return res.status(400).json({ error: 'Email o contraseña incorrectos' });
        }

        console.log("Contraseña enviada:", req.body.password);  // Verifica si la contraseña está siendo enviada correctamente
        console.log("Contraseña almacenada:", user.password);

        // Verificar contraseña
        const validPassword = await bcrypt.compare(req.body.password, user.password);
        console.log("Contraseña válida:", validPassword);

        if (!validPassword) {
            return res.status(400).json({ error: 'Email o contraseña incorrectos' });
        }
        
        // Crear y asignar token
        const token = jwt.sign(
            { _id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            error: null,
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email
                }
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

//Guardar respuestas
router.post('/answers', async (req, res) => {
    try {
        const userId = req.user.userId;
        const { answers } = req.body; 
        
        if (!answers || !Array.isArray(answers)) { 
            return res.status(400).json({ 
                success: false, 
                message: 'Formato de respuestas inválido' 
            }); 
        } 
        
        const user = await User.findById(userId); 
        if (!user) { 
            return res.status(404).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            }); 
        } 
        
        user.answers = answers; 
        await user.save(); 
        
        res.status(200).json({ 
            success: true, 
            message: 'Respuestas guardadas exitosamente' 
        }); 
    } catch (error) { 
        console.error('Error al guardar respuestas:', error); 
        res.status(500).json({ 
            success: false, 
            message: 'Error al guardar respuestas' 
        });
    }
});

//Obtener Respuestas
router.get('/answers/:userId', async (req, res) => { 
    try { 
        const requestingUserId = req.user.userId; 
        const { userId } = req.params; 
        
        if (requestingUserId !== userId && req.user.role !== 'admin') { 
            return res.status(403).json({ 
                success: false, 
                message: 'No autorizado para acceder a estas respuestas' 
            }); 
        } 
        
        const user = await User.findById(userId); 
        
        if (!user) { return res.status(404).json({ 
            success: false, 
            message: 'Usuario no encontrado' 
        }); 
    } 
    res.status(200).json({ 
        success: true, 
        message: 'Respuestas recuperadas exitosamente', 
        data: user.answers 
    }); 
} catch (error) { 
    console.error('Error al recuperar respuestas:', error); 
    res.status(500).json({ 
        success: false, 
        message: 'Error al recuperar respuestas' 
    }); 
} 
}); 

// Ruta para guardar estado de ánimo 
router.post('/mood', async (req, res) => { 
    try { 
        const userId = req.user.userId; 
        const { mood } = req.body; 
        
        if (!mood) { 
            return res.status(400).json({ 
                success: false, 
                message: 'El estado de ánimo es requerido' 
            }); 
        } 
        
        const user = await User.findById(userId); 
        
        if (!user) { 
            return res.status(404).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            }); 
        } 
        
        user.mood = mood; 
        await user.save(); 
        res.status(200).json({ 
            success: true, 
            message: 'Estado de ánimo guardado exitosamente' 
        }); 
    } catch (error) { 
        console.error('Error al guardar el estado de ánimo:', error); 
        res.status(500).json({ 
            success: false, 
            message: 'Error al guardar el estado de ánimo' 
        }); 
    } 
}); 

// Ruta para obtener estado de ánimo 
router.get('/mood/:userId', async (req, res) => { 
    try { 
        const requestingUserId = req.user.userId; 
        const { userId } = req.params; 
        
        if (requestingUserId !== userId && req.user.role !== 'admin') { 
            return res.status(403).json({ 
                success: false, 
                message: 'No autorizado para acceder a este estado de ánimo' 
            }); 
        } 
        
        const user = await User.findById(userId); 
        
        if (!user) { 
            return res.status(404).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            }); 
        } 
        
        res.status(200).json({ 
            success: true, 
            message: 'Estado de ánimo recuperado exitosamente', 
            data: user.mood 
        }); 
    } catch (error) { 
        console.error('Error al recuperar el estado de ánimo:', error); 
        res.status(500).json({ 
            success: false, 
            message: 'Error al recuperar el estado de ánimo' 
        }); 
    } 
}); 

// Ruta de logout 
router.post('/logout', async (req, res) => { 
    try { 
        res.cookie('token', '', { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'strict', 
            expires: new Date(0) }); 
            
            if (req.user && req.user.userId) { 
                await User.findByIdAndUpdate(req.user.userId, { 
                    lastLogout: new Date() 
                }); 
            } 
            res.status(200).json({ 
                success: true, 
                message: 'Sesión cerrada exitosamente' 
            }); 
        } 
        catch (error) { 
            console.error('Error en logout:', error); 
            res.status(500).json({ 
                success: false, 
                message: 'Error al cerrar sesión' 
            }); 
        } 
    });


module.exports = router;