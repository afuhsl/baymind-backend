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
        minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
        select: false // No incluir por defecto en las consultas
    },
    name: {
        type: String,
        //required: [true, 'El nombre es requerido'],
        //trim: true,
        //minlength: [2, 'El nombre debe tener al menos 2 caracteres']
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
    },
    lastLogin: {
        type: Date
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
            delete ret.password;
            return ret;
        }
    }
});





// Middleware pre-save para hashear la contraseña
/*userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});*/

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
