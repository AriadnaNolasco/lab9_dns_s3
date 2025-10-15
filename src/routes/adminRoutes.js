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

// ¡ASEGÚRATE DE QUE ESTA LÍNEA EXISTA Y ESTÉ CORRECTA!
router.post('/storage/backup', adminController.performBackup); 

// Rutas de Restore y Cambio de Bucket también deben estar:
router.post('/storage/restore', adminController.performRestore);
router.post('/storage/change-bucket', adminController.changeActiveBucket);

export default router;