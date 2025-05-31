/**
=========================================================
* F4cetPanel - Cleanup Failed Mint API
=========================================================

* Copyright 2025 F4cets Team
*/

// Firebase Admin SDK
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Google Cloud Storage
import { Storage } from '@google-cloud/storage';

// Initialize Firebase Admin
const firebaseCredentials = JSON.parse(
  Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString('utf8')
);
initializeApp({
  credential: cert(firebaseCredentials),
  storageBucket: 'f4cet-nft-assets',
});
const db = getFirestore();
const storage = getStorage();

// Initialize Google Cloud Storage
const gcs = new Storage({ credentials: firebaseCredentials });
const bucket = gcs.bucket('f4cet-nft-assets');

/**
 * API handler to clean up failed mint operations
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 */
export default async function handler(req, res) {
  // Allow only POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { productId, storeId, txId, imagePaths } = req.body;

  // Validate inputs
  if (!productId || !storeId) {
    return res.status(400).json({ error: 'Missing required fields: productId, storeId' });
  }

  try {
    // Step 1: Delete Firestore product
    await db.doc(`products/${productId}`).delete();
    console.log(`Cleanup: Deleted product ${productId}`);

    // Step 2: Delete Firestore transaction (if provided)
    if (txId) {
      await db.doc(`transactions/${txId}`).delete();
      console.log(`Cleanup: Deleted transaction ${txId}`);
    }

    // Step 3: Delete Firebase Storage images (if provided)
    if (imagePaths && Array.isArray(imagePaths) && imagePaths.length > 0) {
      await Promise.all(
        imagePaths.map(async (path) => {
          try {
            const fileRef = storage.bucket().file(path);
            await fileRef.delete();
            console.log(`Cleanup: Deleted Firebase Storage image ${path}`);
          } catch (err) {
            console.error(`Cleanup: Failed to delete Firebase image ${path}:`, err);
            // Continue with other deletions
          }
        })
      );
    }

    // Step 4: Delete Google Cloud Storage folder
    const prefix = `nfts/${storeId}/${productId}/`;
    const [files] = await bucket.getFiles({ prefix });
    if (files.length > 0) {
      await Promise.all(files.map(file => file.delete()));
      console.log(`Cleanup: Deleted Google Cloud Storage folder ${prefix}`);
    }

    return res.status(200).json({ message: 'Cleanup completed successfully' });
  } catch (err) {
    console.error('Cleanup: Error during cleanup:', err);
    return res.status(500).json({ error: `Cleanup failed: ${err.message}` });
  }
}

// Disable body parsing for multipart/form-data (not needed here)
export const config = {
  api: {
    bodyParser: true,
  },
};