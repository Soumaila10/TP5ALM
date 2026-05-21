const fs = require('fs');
const path = require('path');
const { BlobServiceClient } = require('@azure/storage-blob');
const { loadEnv } = require('../config/env');
const { logger } = require('./logger');

const env = loadEnv();
const connectionString = env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = env.AZURE_CONTAINER_NAME || 'tickets';

let containerClient = null;

if (connectionString) {
  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    containerClient = blobServiceClient.getContainerClient(containerName);
    logger.info(`[storage] Azure Blob Storage client initialized for container: ${containerName}`);
  } catch (err) {
    logger.error({ err }, '[storage] Failed to initialize Azure Blob Storage client');
  }
} else {
  logger.warn('[storage] AZURE_STORAGE_CONNECTION_STRING missing, using local storage fallback');
}

/**
 * Téléverse un fichier (buffer PDF) vers Azure Blob Storage (ou fallback local).
 * @param {Buffer} buffer - Le contenu du fichier PDF en mémoire.
 * @param {string} fileName - Le nom de fichier cible (ex: ticket-id.pdf).
 * @returns {Promise<string>} - L'URL publique d'accès au fichier.
 */
async function uploadToBlobStorage(buffer, fileName) {
  // Fallback local en développement ou tests
  if (!containerClient) {
    const localDir = path.join(__dirname, '../../public/tickets');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const localPath = path.join(localDir, fileName);
    fs.writeFileSync(localPath, buffer);
    logger.info(`[storage] File saved locally (fallback): ${localPath}`);
    
    // On retourne une URL relative/simulée
    const port = env.PORT || 3000;
    return `http://localhost:${port}/tickets/${fileName}`;
  }

  // Azure Blob Storage réel
  try {
    // S'assurer que le conteneur existe avec accès public pour les blobs
    await containerClient.createIfNotExists({ access: 'blob' });
    
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: { blobContentType: 'application/pdf' },
    });
    
    return blockBlobClient.url;
  } catch (err) {
    logger.error({ err }, `[storage] Azure upload failed for ${fileName}, falling back to local storage`);
    
    const localDir = path.join(__dirname, '../../public/tickets');
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const localPath = path.join(localDir, fileName);
    fs.writeFileSync(localPath, buffer);
    const port = env.PORT || 3000;
    return `http://localhost:${port}/tickets/${fileName}`;
  }
}

module.exports = { uploadToBlobStorage };
