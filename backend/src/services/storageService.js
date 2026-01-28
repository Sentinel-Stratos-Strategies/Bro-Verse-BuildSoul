// Storage Service - Handle Azure Blob Storage operations
const { BlobServiceClient, generateBlobSASUrl, BlobSASPermissions } = require('@azure/storage-blob');

// Initialize blob service client from environment
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER || 'uploads';

if (!connectionString) {
  console.warn('AZURE_STORAGE_CONNECTION_STRING not configured. Storage operations will fail.');
}

// Storage quotas (in bytes)
const STORAGE_QUOTAS = {
  POST_UPLOAD: 50 * 1024 * 1024,        // 50 MB per file
  USER_TOTAL: 5 * 1024 * 1024 * 1024,   // 5 GB per user
};

/**
 * Upload file to Azure Blob Storage
 * @param {string} userId - User ID (partition)
 * @param {Buffer} fileBuffer - File contents
 * @param {string} fileName - Original file name
 * @param {string} fileType - MIME type
 * @returns {Promise<{url: string, blobName: string, size: number}>}
 */
async function uploadBlob(userId, fileBuffer, fileName, fileType) {
  if (!connectionString) {
    throw new Error('Storage not configured');
  }

  // Validate file size
  if (fileBuffer.length > STORAGE_QUOTAS.POST_UPLOAD) {
    throw new Error(`File exceeds maximum size of ${STORAGE_QUOTAS.POST_UPLOAD / 1024 / 1024}MB`);
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // Generate blob name: userId/timestamp-filename
  const timestamp = Date.now();
  const blobName = `${userId}/${timestamp}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '-')}`;

  try {
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Upload with metadata
    await blockBlobClient.upload(fileBuffer, fileBuffer.length, {
      metadata: {
        originalName: fileName,
        uploadedAt: new Date().toISOString(),
        userId: userId,
      },
      blobHTTPHeaders: {
        blobContentType: fileType,
      },
    });

    // Generate signed URL (7-day expiry)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);

    const sasUrl = await generateBlobSASUrl(
      blobServiceClient.accountName,
      containerName,
      blobName,
      new BlobSASPermissions({ read: true }),
      expiryDate
    );

    return {
      url: sasUrl,
      blobName: blobName,
      size: fileBuffer.length,
      expiresAt: expiryDate.toISOString(),
    };
  } catch (error) {
    console.error('Blob upload error:', error);
    throw new Error(`Upload failed: ${error.message}`);
  }
}

/**
 * Delete blob from storage
 * @param {string} blobName - Full blob path
 * @returns {Promise<void>}
 */
async function deleteBlob(blobName) {
  if (!connectionString) {
    throw new Error('Storage not configured');
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  try {
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
  } catch (error) {
    console.error('Blob delete error:', error);
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Get storage usage for user
 * @param {string} userId - User ID
 * @returns {Promise<{used: number, quota: number, percentUsed: number}>}
 */
async function getStorageUsage(userId) {
  if (!connectionString) {
    throw new Error('Storage not configured');
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  try {
    let totalUsed = 0;
    
    // List all blobs for this user
    for await (const blob of containerClient.listBlobsFlat({ prefix: `${userId}/` })) {
      totalUsed += blob.properties.contentLength || 0;
    }

    return {
      used: totalUsed,
      quota: STORAGE_QUOTAS.USER_TOTAL,
      percentUsed: (totalUsed / STORAGE_QUOTAS.USER_TOTAL) * 100,
    };
  } catch (error) {
    console.error('Storage usage error:', error);
    throw new Error(`Failed to get usage: ${error.message}`);
  }
}

/**
 * Validate if user can upload (quota check)
 * @param {string} userId - User ID
 * @param {number} fileSize - File size in bytes
 * @returns {Promise<{canUpload: boolean, reason?: string}>}
 */
async function validateUploadQuota(userId, fileSize) {
  if (!connectionString) {
    return { canUpload: false, reason: 'Storage not configured' };
  }

  try {
    const usage = await getStorageUsage(userId);

    if (fileSize > STORAGE_QUOTAS.POST_UPLOAD) {
      return {
        canUpload: false,
        reason: `File exceeds maximum size of ${STORAGE_QUOTAS.POST_UPLOAD / 1024 / 1024}MB`,
      };
    }

    if (usage.used + fileSize > STORAGE_QUOTAS.USER_TOTAL) {
      const remainingMB = (STORAGE_QUOTAS.USER_TOTAL - usage.used) / 1024 / 1024;
      return {
        canUpload: false,
        reason: `Insufficient storage. ${remainingMB.toFixed(2)}MB remaining.`,
      };
    }

    return { canUpload: true };
  } catch (error) {
    console.error('Quota validation error:', error);
    return { canUpload: false, reason: 'Failed to check quota' };
  }
}

module.exports = {
  uploadBlob,
  deleteBlob,
  getStorageUsage,
  validateUploadQuota,
  STORAGE_QUOTAS,
};
