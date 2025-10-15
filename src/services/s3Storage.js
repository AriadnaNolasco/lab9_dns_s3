// src/services/s3Storage.js

import AWS from 'aws-sdk';
// No hay dotenv.config() aquí, confiamos en que server.js lo haga.

// Inicializamos S3 y currentBucket como variables para almacenar la instancia y el nombre del bucket.
// No las inicializamos con process.env.X aquí.
let S3 = null; 
let currentBucket = null;

// Función para inicializar S3 y el bucket una vez que process.env esté cargado.
const initializeStorage = () => {
    // Si ya están inicializados, no hacemos nada.
    if (S3) return; 

    S3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION
    });
    
    currentBucket = process.env.ACTIVE_BUCKET;
    console.log(`[StorageService] Inicializado con bucket: ${currentBucket}`);
};

const S3Storage = {
    // Garantizamos la inicialización en cada método público.
    
    // 1. Métodos de configuración (cambiar de bucket)
    getBucket: () => {
        initializeStorage(); // Inicializar antes de acceder
        return currentBucket;
    },
    setBucket: (newBucketName) => {
        initializeStorage(); // Inicializar antes de acceder
        currentBucket = newBucketName;
        console.log(`Bucket activo cambiado a: ${currentBucket}`);
    },
    
    // 2. Método para el CRUD: SUBIR (CREATE)
    uploadFile: async (file) => {
        initializeStorage(); // Inicializar antes de usar S3
        
        if (!currentBucket) {
             throw new Error("El nombre del bucket activo no está definido. Verifique .env");
        }
        
        const params = {
            Bucket: currentBucket,
            Key: `${Date.now()}-${file.originalname}`,
            Body: file.buffer,
            ContentType: file.mimetype,
            // ACL: eliminado
        };

        const data = await S3.upload(params).promise();
        return data.Location; 
    },
    
    // El resto de los métodos (copyObject, deleteObject, backupAndEmpty, restoreFromBackup)
    // también deberán llamar a initializeStorage() al principio.
    // ... (Asegúrate de agregar initializeStorage() al inicio de cada función del objeto S3Storage)
    
    // Ejemplo de un método más:
    backupAndEmpty: async () => {
        initializeStorage();
        // ... el resto de la lógica ...
        
        const activeBucket = process.env.ACTIVE_BUCKET; // Aún accedemos a process.env para el bucket de backup
        const backupBucket = process.env.BACKUP_BUCKET;
        // ...
        
        // La lógica de backup y eliminación debe usar S3 y currentBucket correctamente
        // ...
        
        return { message: `Backup exitoso...` };
    },
    
    // Y restaurar:
    restoreFromBackup: async () => {
        initializeStorage();
        // ... el resto de la lógica ...
        
        const backupBucket = process.env.BACKUP_BUCKET;
        const targetBucket = process.env.ACTIVE_BUCKET;

        // ...
        return { message: `Restauración exitosa...` };
    }
};

export default S3Storage;