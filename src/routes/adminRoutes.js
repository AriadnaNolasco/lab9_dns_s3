// src/routes/adminRoutes.js

import express from 'express';
import multer from 'multer';
import * as adminController from '../controllers/adminController.js'; // <-- CORRECTED IMPORT

const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() }); 

// Rutas de Administración y CRUD
// Now you access the functions as properties of the imported object:
router.get('/', adminController.getAdminView); 
router.post('/product/create', upload.single('productImage'), adminController.createProduct);
// ... and so on for all routes

export default router;