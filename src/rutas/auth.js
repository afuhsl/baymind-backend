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
        // Crear nuevo usuario
        const user = new User({
            email: req.body.email,
            password: req.body.password
        });
        // Crear y asignar token
        const token = jwt.sign(
            { _id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        // Guardar usuario
        const savedUser = await user.save();
        res.json({
            error: null,
            data: {
                token,
                user: {
                    id: savedUser.id,
                    email: savedUser.email,
                    password: savedUser.password
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
                    email: user.email,
                    password: user.password
                }
            }
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/answers', async (req, res) => {
    console.log(req.body);  // Muestra lo que llega en la solicitud para depurar

    try {
        // Obtenemos el email directamente del cuerpo de la solicitud
        const { email, answers } = req.body;
        console.log('Datos recibidos:', email, answers);

        // Validación de las respuestas
        if (!email || !answers || answers.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Formato de respuestas inválido o incompleto. Por favor, asegúrese de enviar todos los campos requeridos.',
            });
        }

        // Buscar el usuario en la base de datos por el email
        const user = await User.findByEmail(email);  // Asume que tienes un método para buscar por email
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
router.post('/mood', async (req, res) => {
    try {
        const { email, dia, mes, estado } = req.body;

        // Validar que todos los datos requeridos estén presentes
        if (!email || !dia || !mes || !estado) {
            return res.status(400).json({
                success: false,
                message: 'Email, día, mes y estado de ánimo son requeridos.',
            });
        }

        // Buscar al usuario por email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado',
            });
        }

        // Construir la fecha a partir de día y mes
        const fecha = new Date(new Date().getFullYear(), mes - 1, dia);
        const fechaISO = fecha.toISOString().split('T')[0]; // Comparar solo la parte de la fecha (sin hora)

        // Buscar si ya existe un estado de ánimo para esa fecha
        const existingMoodIndex = user.cards.findIndex(
            card => card.date.toISOString().split('T')[0] === fechaISO
        );

        if (existingMoodIndex !== -1) {
            // Si ya existe un estado de ánimo para esa fecha, actualizarlo
            user.cards[existingMoodIndex].mood = estado;
        } else {
            // Si no existe, agregar un nuevo estado de ánimo
            user.cards.push({ date: fecha, mood: estado });
        }

        // Guardar los cambios en la base de datos
        await user.save();

        // Respuesta exitosa
        res.status(200).json({
            success: true,
            message: 'Estado de ánimo guardado o actualizado exitosamente',
        });
    } catch (error) {
        console.error('Error al guardar el estado de ánimo:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar el estado de ánimo',
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


// Obtener estados de ánimo de la semana actual
router.post('/obtenersemana', async (req, res) => {
    try {
        const { email, dia, mes } = req.body; // Cambié `req.query` a `req.body` para recibir un JSON

        if (!email || !dia || !mes) {
            return res.status(400).json({
                error: 'Por favor, proporciona email, día y mes',
            });
        }

        // Crear fecha de referencia
        const fechaReferencia = new Date(new Date().getFullYear(), mes - 1, dia);

        // Obtener inicio y fin de la semana
        const inicioSemana = new Date(fechaReferencia);
        inicioSemana.setDate(fechaReferencia.getDate() - fechaReferencia.getDay());
        inicioSemana.setHours(0, 0, 0, 0);

        const finSemana = new Date(fechaReferencia);
        finSemana.setDate(fechaReferencia.getDate() + (6 - fechaReferencia.getDay()));
        finSemana.setHours(23, 59, 59, 999);

        // Buscar el usuario por email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                error: 'Usuario no encontrado',
            });
        }

        // Generar todas las fechas de la semana
        const fechasSemana = [];
        for (let i = 0; i < 7; i++) {
            const fecha = new Date(inicioSemana);
            fecha.setDate(inicioSemana.getDate() + i);
            fechasSemana.push(fecha);
        }

        // Mapear las fechas con los estados de ánimo
        const estadosSemana = fechasSemana.map((fecha) => {
            const estado = user.cards.find(
                (card) =>
                    new Date(card.date).toDateString() === fecha.toDateString()
            );
            return {
                date: fecha.toISOString().split('T')[0], // Formatear la fecha en formato YYYY-MM-DD
                mood: estado ? estado.mood : '', // Si no hay estado, devolver vacío
            };
        });

        // Responder con los estados de la semana
        res.json({
            estados: estadosSemana,
        });
    } catch (error) {
        console.error('Error al obtener los estados de la semana:', error);
        res.status(500).json({
            error: error.message,
        });
    }
});


// Obtener estados entre fechas específicas
router.post('/obtenerultimosestados', async (req, res) => {
    try {
        const { email, primerdia, primermes, ultimodia, ultimomes } = req.body;

        // Validar entrada
        if (!email || !primerdia || !primermes || !ultimodia || !ultimomes) {
            return res.status(400).json({
                success: false,
                message: 'Por favor, proporciona email, primer día, primer mes, último día y último mes.',
            });
        }

        // Crear fechas de inicio y fin
        const fechaInicio = new Date(new Date().getFullYear(), primermes - 1, primerdia);
        fechaInicio.setHours(0, 0, 0, 0);

        const fechaFin = new Date(new Date().getFullYear(), ultimomes - 1, ultimodia);
        fechaFin.setHours(23, 59, 59, 999);

        // Verificar que las fechas sean válidas
        if (fechaInicio > fechaFin) {
            return res.status(400).json({
                success: false,
                message: 'La fecha de inicio debe ser anterior o igual a la fecha de fin.',
            });
        }

        // Buscar el usuario por email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado.',
            });
        }

        // Generar todas las fechas entre fechaInicio y fechaFin
        const fechas = [];
        let currentDate = new Date(fechaInicio);

        while (currentDate <= fechaFin) {
            fechas.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Mapear las fechas con los estados de ánimo
        const estados = fechas.map((fecha) => {
            const estado = user.cards.find(
                (card) =>
                    new Date(card.date).toDateString() === fecha.toDateString()
            );
            return {
                date: fecha.toISOString().split('T')[0], // Formatear la fecha como YYYY-MM-DD
                mood: estado ? estado.mood : '', // Si no hay estado, devolver vacío
            };
        });

        // Responder con los estados
        res.status(200).json({
            estados,
        });
    } catch (error) {
        console.error('Error al obtener los estados entre fechas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los estados entre fechas.',
        });
    }
});


// Obtener últimas 7 semanas del mismo día
router.post('/obtenersemanas', async (req, res) => {
    try {
        const { email, dia, mes } = req.body;

        // Validar entrada
        if (!email || !dia || !mes) {
            return res.status(400).json({
                success: false,
                message: 'Por favor, proporciona email, día y mes.',
            });
        }

        // Crear fecha de referencia
        const fechaReferencia = new Date(new Date().getFullYear(), mes - 1, dia);
        fechaReferencia.setHours(0, 0, 0, 0);

        // Crear array de fechas para las últimas 7 semanas
        const semanas = [];
        for (let i = 0; i < 7; i++) {
            const inicioSemana = new Date(fechaReferencia);
            inicioSemana.setDate(fechaReferencia.getDate() - i * 7);
            const finSemana = new Date(inicioSemana);
            finSemana.setHours(23, 59, 59, 999);

            semanas.push({
                inicio: inicioSemana,
                fin: finSemana,
                date: inicioSemana.toISOString().split('T')[0], // Formato YYYY-MM-DD
            });
        }

        // Buscar al usuario por email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado.',
            });
        }

        // Mapear las semanas con estados de ánimo
        const estados = semanas.map(({ inicio, fin, date }) => {
            const estado = user.cards.find(
                (card) =>
                    new Date(card.date) >= inicio && new Date(card.date) <= fin
            );
            return {
                date,
                mood: estado ? estado.mood : '', // Si no hay estado, devolver vacío
            };
        });

        // Responder con los estados de las últimas 7 semanas
        res.status(200).json({
            estados,
        });
    } catch (error) {
        console.error('Error al obtener los estados de las últimas semanas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los estados de las últimas semanas.',
        });
    }
});


// Obtener últimos 7 meses del mismo día
router.post('/obtenermeses', async (req, res) => {
    try {
        const { email, dia, mes } = req.body;

        // Validar entrada
        if (!email || !dia || !mes) {
            return res.status(400).json({
                success: false,
                message: 'Por favor, proporciona email, día y mes.',
            });
        }

        // Crear fecha de referencia
        const fechaReferencia = new Date(new Date().getFullYear(), mes - 1, dia);
        fechaReferencia.setHours(0, 0, 0, 0);

        // Crear array de fechas para los últimos 7 meses
        const meses = [];
        for (let i = 0; i < 7; i++) {
            const inicioMes = new Date(fechaReferencia);
            inicioMes.setMonth(fechaReferencia.getMonth() - i);
            const finMes = new Date(inicioMes);
            finMes.setHours(23, 59, 59, 999);

            meses.push({
                inicio: inicioMes,
                fin: finMes,
                date: inicioMes.toISOString().split('T')[0], // Formato YYYY-MM-DD
            });
        }

        // Buscar al usuario por email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado.',
            });
        }

        // Mapear los meses con estados de ánimo
        const estados = meses.map(({ inicio, fin, date }) => {
            const estado = user.cards.find(
                (card) =>
                    new Date(card.date) >= inicio && new Date(card.date) <= fin
            );
            return {
                date,
                mood: estado ? estado.mood : '', // Si no hay estado, devolver vacío
            };
        });

        // Responder con los estados de los últimos 7 meses
        res.status(200).json({
            estados,
        });
    } catch (error) {
        console.error('Error al obtener los estados de los últimos meses:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los estados de los últimos meses.',
        });
    }
});



// Obtener el estado de un día específico
router.post('/estadodia', async (req, res) => {
    try {
        const { email, dia, mes } = req.body;

        // Validar entrada
        if (!email || !dia || !mes) {
            return res.status(400).json({
                success: false,
                message: 'Por favor, proporciona email, día y mes.',
            });
        }

        // Encontrar al usuario por email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado.',
            });
        }

        // Crear la fecha específica
        const fechaBuscada = new Date(new Date().getFullYear(), mes - 1, dia);
        fechaBuscada.setHours(0, 0, 0, 0);

        // Buscar tarjeta en las tarjetas del usuario
        const tarjeta = user.cards.find(
            (card) =>
                new Date(card.date).toISOString() ===
                fechaBuscada.toISOString()
        );

        if (!tarjeta) {
            return res.status(404).json({
                estados: { date: fechaBuscada.toISOString().split('T')[0], mood: '' },
            });
        }

        res.status(200).json({
            estados: { date: fechaBuscada.toISOString().split('T')[0], mood: tarjeta.mood },
        });
    } catch (error) {
        console.error('Error al obtener el estado del día:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el estado del día.',
        });
    }
});
// Obtener chat
router.post('/chat', async (req, res) => {
    try {
        const { email, fecha, nombre, mensaje } = req.body;

        // Validamos que se proporcionen todos los datos requeridos
        if (!fecha || !nombre || !mensaje) {
            return res.status(400).json({
                success: false,
                message: 'La fecha, el nombre y el mensaje son requeridos.'
            });
        }

        // Encontrar al usuario por email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado.',
            });
        }

        user.chat.push({ date: fecha, from: nombre, message:mensaje });

        // Guardar los cambios en la base de datos
        await user.save();

        // Respuesta exitosa
        res.status(200).json({
            success: true,
            message: 'Mensaje guardado exitosamente',
        });
    } catch (error) {
        console.error('Error al guardar el mensaje:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar el mensaje',
        });
    }
});
// Obtener mensajes por email
router.post('/chat', async (req, res) => {
    try {
        const { email } = req.query;  // Obtener email desde los parámetros de la URL

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'El email es requerido.',
            });
        }

        // Buscar el usuario por email
        const user = await User.findByEmail({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado.',
            });
        }

        // Devolver los mensajes del usuario
        res.status(200).json({
            chat: user.chat,  // Devolvemos los mensajes del usuario
        });
    } catch (error) {
        console.error('Error al obtener los mensajes del usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener los mensajes del usuario.',
        });
    }
});


module.exports = router;