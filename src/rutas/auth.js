const router = require('express').Router();
const User = require('../models/user');
const verifyToken = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Phrase = require('../models/frases');

// Ruta para obtener todos los usuarios
router.get('/users', async (req, res) => {
    try {
        const users = await User.getAllUsers(); // Usa el método estático definido
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la lista de usuarios' });
    }
});

// Ruta de registro
router.post('/register', async (req, res) => {
    try {
        // Verificar si el email ya existe
        const emailExists = await User.findOne({ email: req.body.email });
        if (emailExists) {
            return res.status(400).json({ error: 'Email ya registrado' });
        }

        // Encriptar la contraseña
        /* const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        */
        // Crear nuevo usuario
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password
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

        const { email, password } = req.body; console.log("Datos recibidos:", { email, passwordLength: password ? password.length : 0});

        // Verificar si el usuario existe
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({ error: 'Email o contraseña incorrectos' });
        }

        console.log("Contraseña enviada:", req.body.password);  // Verifica si la contraseña está siendo enviada correctamente
        console.log("Contraseña almacenada:", user.password);

        // Verificar contraseña
        const validPassword = (password === user.password);        
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
router.post('/answers',verifyToken, async (req, res) => {
    console.log(req.body);
    try {
      // Verifica si el token ha sido verificado correctamente en el middleware
        if (!req.user || !req.user._id) {
            console.error('Token no verificado correctamente:', req.user);
            return res.status(401).json({
            success: false,
            message: 'Acceso denegado, no se encontró el usuario asociado al token',
            });
        }
        
        const userId = req.user._id;
        const { answers } = req.body;
        console.log('Token verificado, userId:', req.user._id); // Verifica el userId del token

     // Validación de las respuestas
    if (!answers) {
        return res.status(400).json({
            success: false,
            message: 'Formato de respuestas inválido o incompleto. Por favor, asegúrese de enviar todos los campos requeridos.',
        });
    }



      // Buscar el usuario en la base de datos
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
            success: false,
            message: 'Usuario no encontrado',
            });
        }

      // Guardar las respuestas en el perfil del usuario
        user.answers = answers;
        await user.save();
  
      // Respuesta exitosa
        res.status(200).json({
            success: true,
            message: 'Respuestas guardadas exitosamente',
        });
    } catch (error) {
        console.error('Error al guardar respuestas:', error);
      // Respuesta de error detallada para el cliente
        res.status(500).json({
        success: false,
        message: 'Error al guardar respuestas',
        error: error.message || 'Error desconocido',
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
router.post('/mood', verifyToken,async (req, res) => { 
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


//Endpoint para obtener frase aleatoria
router.get('/frase', async (req, res) => { try { const count = await Phrase.countDocuments(); const randomIndex = Math.floor(Math.random() * count); const randomPhrase = await Phrase.findOne().skip(randomIndex); res.json({ error: null, data: randomPhrase }); } catch (error) { console.error('Error al obtener la frase aleatoria:', error); res.status(500).json({ error: error.message }); } });


// 1. Registrar estado
router.post('/registrarestado', async (req, res) => {
    try {
        const { userId, dia, mes, estado } = req.body;
        
        // Crear fecha con el año actual
        const fecha = new Date(new Date().getFullYear(), mes - 1, dia);
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Agregar nuevo estado a cards
        user.cards.push({
            date: fecha,
            mood: estado
        });

        await user.save();
        res.status(201).json({ 
            mensaje: 'Estado registrado exitosamente', 
            estado: user.cards[user.cards.length - 1] 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Obtener estados de la semana actual
router.get('/obtenersemana', async (req, res) => {
    try {
        const { userId, dia, mes } = req.query;
        
        // Crear fecha de referencia
        const fechaReferencia = new Date(new Date().getFullYear(), mes - 1, dia);
        
        // Obtener inicio y fin de la semana
        const inicioSemana = new Date(fechaReferencia);
        inicioSemana.setDate(fechaReferencia.getDate() - fechaReferencia.getDay());
        inicioSemana.setHours(0, 0, 0, 0);
        
        const finSemana = new Date(fechaReferencia);
        finSemana.setDate(fechaReferencia.getDate() + (6 - fechaReferencia.getDay()));
        finSemana.setHours(23, 59, 59, 999);

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const estadosSemana = user.cards.filter(card => 
            card.date >= inicioSemana && card.date <= finSemana
        );
        
        res.json(estadosSemana);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Obtener estados entre fechas
router.get('/obtenerultimosestados', async (req, res) => {
    try {
        const { userId, primerdia, primermes, ultimodia, ultimomes } = req.query;
        
        const fechaInicio = new Date(new Date().getFullYear(), primermes - 1, primerdia);
        fechaInicio.setHours(0, 0, 0, 0);
        
        const fechaFin = new Date(new Date().getFullYear(), ultimomes - 1, ultimodia);
        fechaFin.setHours(23, 59, 59, 999);
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const estados = user.cards.filter(card => 
            card.date >= fechaInicio && card.date <= fechaFin
        );
        
        res.json(estados);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. Obtener últimas 7 semanas del mismo día
router.get('/obtenersemanas', async (req, res) => {
    try {
        const { userId, dia, mes } = req.query;
        
        // Fecha de referencia
        const fechaReferencia = new Date(new Date().getFullYear(), mes - 1, dia);
        
        // Crear array de fechas para las últimas 7 semanas
        const fechas = [];
        for (let i = 0; i < 7; i++) {
            const fecha = new Date(fechaReferencia);
            fecha.setDate(fecha.getDate() - (i * 7));
            fechas.push({
                inicio: new Date(fecha.setHours(0, 0, 0, 0)),
                fin: new Date(fecha.setHours(23, 59, 59, 999))
            });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Buscar estados para cada fecha
        const estados = fechas.map(({ inicio, fin }) => {
            const estadosDia = user.cards.filter(card => 
                card.date >= inicio && card.date <= fin
            );
            return estadosDia[0] || null; // Devolver el primer estado del día o null
        }).filter(estado => estado !== null);
        
        res.json(estados);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. Obtener últimos 7 meses del mismo día
router.get('/obtenermeses', async (req, res) => {
    try {
        const { userId, dia, mes } = req.query;
        
        // Fecha de referencia
        const fechaReferencia = new Date(new Date().getFullYear(), mes - 1, dia);
        
        // Crear array de fechas para los últimos 7 meses
        const fechas = [];
        for (let i = 0; i < 7; i++) {
            const fecha = new Date(fechaReferencia);
            fecha.setMonth(fecha.getMonth() - i);
            fechas.push({
                inicio: new Date(fecha.setHours(0, 0, 0, 0)),
                fin: new Date(fecha.setHours(23, 59, 59, 999))
            });
        }
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Buscar estados para cada fecha
        const estados = fechas.map(({ inicio, fin }) => {
            const estadosDia = user.cards.filter(card => 
                card.date >= inicio && card.date <= fin
            );
            return estadosDia[0] || null; // Devolver el primer estado del día o null
        }).filter(estado => estado !== null);
        
        res.json(estados);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.post('/tarjeta', async (req, res) => {
    try {
        const { userId, dia, mes, estado } = req.body;

        // Encontrar el usuario por ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Crear la tarjeta
        const date = new Date();
        date.setDate(dia);
        date.setMonth(mes - 1);  // Meses en JavaScript son 0-11

        const card = {
            date: date,
            mood: estado
        };

        // Añadir la tarjeta al usuario
        user.cards.push(card);
        await user.save();

        res.json({ error: null, data: 'Tarjeta registrada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;