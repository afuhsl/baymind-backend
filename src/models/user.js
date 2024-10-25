const mongoose = require('mongoose');
const userSchema = mongoose.Schema({
    name:{
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true,
        minlength: [6, 'El nombre debe tener al menos 6 caracteres'],
        maxlength: [255, 'El nombre no puede exceder 255 caracteres']
    },
    email:{
        type: String,
        required: [true, 'El email es requerido'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingrese un email válido']
    },
    password:{
        type: String,
        required: [true, 'La contraseña es requerida'],
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
    },
    date:{
        type: Date, 
        default: Date.now,
    },
});



module.exports = mongoose.model('User', userSchema);