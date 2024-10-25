const mongoose = require("mongoose");

const MONGO_URI = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@clusterbaymind.do2eg.mongodb.net/?retryWrites=true&w=majority&appName=ClusterBayMind`


const dbconnection = async () =>{
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Conectado a MongoDB');
    } catch (error) {
        console.error('Error de conexión a MongoDB:', error.message);
        process.exit(1);
    }
};

module.exports = dbconnection;