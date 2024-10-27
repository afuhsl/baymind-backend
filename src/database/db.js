const mongoose = require("mongoose");


const dbconnection = async () =>{
    try {
        await mongoose.connect(process.env.MONGO_URI,{

        });
        console.log('Conectado a MongoDB');
    } catch (error) {
        console.error('Error de conexión a MongoDB:', error.message);
        process.exit(1);
    }
};

module.exports = dbconnection;