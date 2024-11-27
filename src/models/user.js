const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const moodSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    mood: {
        type: String,
        required: true,
    },
});
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'El email es requerido'],
        unique: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
            },
            message: props => `${props.value} no es un email válido`
        }
    },
    password: {
        type: String,
        required: [true, 'La contraseña es requerida'],
    },
    name: {
        type: String
    },
    profileImage: {
        type: String,
        default: null
    },
    answers: {
        name: { type: String, required: false },
        age: { type: Number, required: false },
        isWorking: { type: Boolean, required: false },
        isStudying: { type: Boolean, required: false },
        appUsageReason: { type: String, required: false },
        hasTherapy:{ type: Boolean, required: false},  
    },
    cards: [moodSchema],
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, {
    timestamps: true,
    toJSON: {
        transform: function(doc, ret) {
            return ret;
        }
    }
});


// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error(error);
    }
};

// Método para actualizar último login
userSchema.methods.updateLastLogin = async function() {
    this.lastLogin = new Date();
    return this.save();
};

// Método estático para buscar por email
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};
// Método estático para obtener todos los usuarios
userSchema.statics.getAllUsers = function () {
    return this.find({}, 'email password'); // Selecciona los campos que deseas incluir
};

const User = mongoose.model('User', userSchema);

module.exports = User;
