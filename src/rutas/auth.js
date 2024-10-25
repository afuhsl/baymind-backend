const router = require('express').Router();
const User = require('../models/user');
const verifyToken = require('../middleware/auth');
const bcrypt = require('bcryptjs');
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
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(400).json({ error: 'Email o contraseña incorrectos' });
        }

        // Verificar contraseña
        const validPassword = await bcrypt.compare(req.body.password, user.password);
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

router.get('/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json({ error: null, data: { user } });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;