const express = require('express');
const authRoutes = require("./src/rutas/auth");
const Connection = require('./src/database/db');
const cors = require('cors');
require("dotenv").config();

const app = express();
const port = 3000;

//Conexion a base de datos
Connection();

//Middleware
app.use(cors());
app.use(express.json());

app.use("/api/user", authRoutes);

app.get('/', (req, res) =>{
    res.json({mensaje: "Api Rest BayMind"});
});

app.listen(port, () =>{
    console.log(`Servidor escuchando en el puerto ${port}`);
});