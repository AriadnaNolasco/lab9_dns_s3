// src/services/s3Storage.js

import AWS from 'aws-sdk';
// La importación y configuración de dotenv se eliminan porque se hace en server.js

// Inicializamos S3 y currentBucket como variables para almacenar la instancia y el nombre del bucket.
let S3 = null;
let currentBucket = null;

// Función para inicializar S3 y el bucket una vez que process.env esté cargado.
const initializeStorage = () => {
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
    // 1. Métodos de configuración (cambiar de bucket)
    getBucket: () => {
        initializeStorage();
        return currentBucket;
    },
    setBucket: (newBucketName) => {
        initializeStorage();
        currentBucket = newBucketName;
        console.log(`Bucket activo cambiado a: ${currentBucket}`);
    },

    // 2. Método para el CRUD: SUBIR (CREATE)
    uploadFile: async (file) => {
        initializeStorage();

        if (!currentBucket) {
            throw new Error("El nombre del bucket activo no está definido. Verifique .env");
        }

        const params = {
            Bucket: currentBucket,
            Key: `${Date.now()}-${file.originalname}`,
            Body: file.buffer,
            ContentType: file.mimetype,
        };

        const data = await S3.upload(params).promise();
        return data.Location;
    },

    // 3. Método de Backup/Restauración: COPIAR
    copyObject: async (sourceBucket, sourceKey, destinationBucket) => {
        initializeStorage();

        // Aseguramos el formato correcto de CopySource: /BucketName/Key
        const copySourcePath = `/${sourceBucket}/${sourceKey}`;

        const params = {
            Bucket: destinationBucket,
            CopySource: copySourcePath,
            Key: sourceKey
        };
        await S3.copyObject(params).promise();
    },

    // 4. Método de Backup/Restauración: ELIMINAR (DELETE)
    deleteObject: async (key, bucketName) => {
        initializeStorage();
        const params = {
            Bucket: bucketName,
            Key: key
        };
        await S3.deleteObject(params).promise();
    },

    // 5. Función de Backup Masivo
    backupAndEmpty: async () => {
        initializeStorage();

        const activeBucket = process.env.ACTIVE_BUCKET;
        const backupBucket = process.env.BACKUP_BUCKET;

        if (!activeBucket || !backupBucket) {
            throw new Error("ACTIVE_BUCKET o BACKUP_BUCKET no están definidos en .env.");
        }

        let objects = await S3.listObjectsV2({ Bucket: activeBucket }).promise();

        if (objects.Contents.length === 0) {
            return { message: "No hay imágenes para hacer backup." };
        }

        const keysToBackup = objects.Contents.map(item => item.Key);

        // Copiar cada objeto usando el BUCKET ACTIVO como fuente.
        for (const key of keysToBackup) {
            await S3Storage.copyObject(activeBucket, key, backupBucket);
        }

        // Eliminar los objetos del bucket activo
        const deleteParams = {
            Bucket: activeBucket,
            Delete: {
                Objects: keysToBackup.map(key => ({ Key: key }))
            }
        };
        await S3.deleteObjects(deleteParams).promise();

        return { message: `Backup exitoso de ${keysToBackup.length} imágenes a ${backupBucket}. Bucket activo vaciado.` };
    },
    
    // 6. Función de Restauración Masiva
    restoreFromBackup: async () => {
        initializeStorage();

        const backupBucket = process.env.BACKUP_BUCKET;
        const targetBucket = process.env.ACTIVE_BUCKET;

        if (!backupBucket || !targetBucket) {
             throw new Error("Buckets de origen o destino no definidos en .env.");
        }

        let objects = await S3.listObjectsV2({ Bucket: backupBucket }).promise();

        if (objects.Contents.length === 0) {
            return { message: "El bucket de backup está vacío." };
        }

        const keysToRestore = objects.Contents.map(item => item.Key);

        // Copiar cada objeto del backup al bucket ACTIVO (targetBucket)
        for (const key of keysToRestore) {
            // Origen: backupBucket, Clave: key, Destino: targetBucket
            await S3Storage.copyObject(backupBucket, key, targetBucket); 
        }

        S3Storage.setBucket(targetBucket);

        return { message: `Restauración exitosa de ${keysToRestore.length} imágenes a ${targetBucket}.` };
    }
};

export default S3Storage;