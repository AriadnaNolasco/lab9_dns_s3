// src/controllers/adminController.js

// Nota: req.productsDB y req.StorageService provienen del middleware en server.js

export const getAdminView = (req, res) => {
    res.render('admin', { 
        products: req.productsDB,
        activeBucket: req.StorageService.getBucket(),
        message: req.query.message || null
    });
};

// --- CRUD ---
export const createProduct = async (req, res) => {
    try {
        const { name, price } = req.body;
        const imageFile = req.file;

        if (!imageFile) {
            return res.redirect('/?message=Error: Se requiere una imagen.');
        }

        const imageUrl = await req.StorageService.uploadFile(imageFile);

        req.productsDB.push({
            id: Date.now(),
            name,
            price,
            imageUrl,
            imageKey: imageFile.originalname 
        });

        res.redirect('/?message=Producto creado con éxito!');
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.redirect(`/?message=Error al crear producto: ${error.message}`);
    }
};

// --- GESTIÓN DE STORAGE ---
export const performBackup = async (req, res) => {
    try {
        const result = await req.StorageService.backupAndEmpty();
        
        // Limpiar la BD, ya que las imágenes se han eliminado del bucket activo
        req.productsDB.length = 0; // Método rápido para vaciar el array

        res.redirect(`/?message=¡${result.message} Los productos deben re-crearse o restaurarse!`);
    } catch (error) {
        console.error('Error en el backup:', error);
        res.redirect(`/?message=Error en el backup: ${error.message}`);
    }
};

export const performRestore = async (req, res) => {
    try {
        const result = await req.StorageService.restoreFromBackup();
        res.redirect(`/?message=¡${result.message}!`);
    } catch (error) {
        console.error('Error en la restauración:', error);
        res.redirect(`/?message=Error en la restauración: ${error.message}`);
    }
};

export const changeActiveBucket = (req, res) => {
    const { newBucket } = req.body;
    req.StorageService.setBucket(newBucket); 

    res.redirect(`/?message=Bucket activo cambiado a: ${newBucket}. Los nuevos archivos se subirán aquí.`);
};

// Ya no es necesario module.exports gracias a 'export const'