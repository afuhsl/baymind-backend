const router = require('express').Router();
const User = require('../models/user');
const verifyToken = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Phrase = require('../models/frases');


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

        const { email, password } = req.body; console.log("Datos recibidos:", { email, passwordLength: password ? password.length : 0});

        // Verificar si el usuario existe
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({ error: 'Email o contraseña incorrectos' });
        }

        console.log("Contraseña enviada:", req.body.password);  // Verifica si la contraseña está siendo enviada correctamente
        console.log("Contraseña enviada (buffer):", Buffer.from(password).toString('hex'));
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
router.post('/registrarestado', async (req, res) => {
    try {
        const { userId, dia, mes, estado } = req.body;

        // Encontrar el usuario por ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Crear el registro de estado de ánimo
        const date = new Date();
        date.setDate(dia);
        date.setMonth(mes - 1);  // Meses en JavaScript son 0-11

        const moodRecord = {
            date: date,
            mood: estado
        };

        // Añadir el registro de estado de ánimo al usuario
        user.moodRecords.push(moodRecord);
        await user.save();

        res.json({ error: null, data: 'Estado de ánimo registrado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/obtenersemana', async (req, res) => {
    try {
        const { userId } = req.query;
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - startDate.getDay());

        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);

        const user = await User.findById(userId, 'moodRecords');
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const weekRecords = user.moodRecords.filter(record => {
            return record.date >= startDate && record.date < endDate;
        });

        res.json({ error: null, data: weekRecords });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/obtenerultimosestados', async (req, res) => {
    try {
        const { userId, startDate, endDate } = req.query;

        const start = new Date(startDate);
        const end = new Date(endDate);

        const user = await User.findById(userId, 'moodRecords');
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const filteredRecords = user.moodRecords.filter(record => {
            return record.date >= start && record.date <= end;
        });

        res.json({ error: null, data: filteredRecords });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/obtenersemanas', async (req, res) => {
    try {
        const { userId, dayOfWeek } = req.query;

        const user = await User.findById(userId, 'moodRecords');
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const dayOfWeekInt = parseInt(dayOfWeek);

        const pastSevenWeeks = [];
        let currentDate = new Date();

        for (let i = 0; i < 7; i++) {
            const date = new Date(currentDate);
            date.setDate(date.getDate() - date.getDay() + dayOfWeekInt);
            pastSevenWeeks.push(date);
            currentDate.setDate(currentDate.getDate() - 7);
        }

        const weekRecords = user.moodRecords.filter(record => {
            return pastSevenWeeks.some(week => 
                record.date.getFullYear() === week.getFullYear() && 
                record.date.getMonth() === week.getMonth() && 
                record.date.getDate() === week.getDate()
            );
        });

        res.json({ error: null, data: weekRecords });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/obtenermeses', async (req, res) => {
    try {
        const { userId, dayOfMonth } = req.query;

        const user = await User.findById(userId, 'moodRecords');
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const dayOfMonthInt = parseInt(dayOfMonth);

        const pastSevenMonths = [];
        let currentDate = new Date();

        for (let i = 0; i < 7; i++) {
            const date = new Date(currentDate);
            date.setDate(dayOfMonthInt);
            pastSevenMonths.push(date);
            currentDate.setMonth(currentDate.getMonth() - 1);
        }

        const monthRecords = user.moodRecords.filter(record => {
            return pastSevenMonths.some(month => 
                record.date.getFullYear() === month.getFullYear() && 
                record.date.getMonth() === month.getMonth() && 
                record.date.getDate() === month.getDate()
            );
        });

        res.json({ error: null, data: monthRecords });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;