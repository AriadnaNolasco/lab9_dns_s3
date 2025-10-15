// server.js

import express from 'express';
import dotenv from 'dotenv';
// Importaciones locales (deben llevar .js)
import adminRoutes from './src/routes/adminRoutes.js'; 
import S3Storage from './src/services/s3Storage.js'; 
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware y configuración de EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// **IMPORTANTE:** Simulación de Base de Datos para Productos
let products = []; // En una app real, esto sería una BD (Mongo, DynamoDB, etc.)

// Middleware para inyectar la 'BD' y el Storage al controlador/rutas
app.use((req, res, next) => {
    req.productsDB = products; // Pasamos la "BD"
    req.StorageService = S3Storage; // Pasamos el servicio de S3
    next();
});

// Rutas del Administrador
app.use('/', adminRoutes);

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log(`Bucket activo: ${S3Storage.getBucket()}`);
});