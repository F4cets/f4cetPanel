import { Storage } from '@google-cloud/storage';
import formidable from 'formidable';
import { readFile } from 'fs/promises';

export const config = {
  api: {
    bodyParser: false, // Disable Next.js body parsing to handle multipart form data
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Google Cloud Storage with credentials
    const credentialsBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
    if (!credentialsBase64) {
      throw new Error('GOOGLE_APPLICATION_CREDENTIALS_BASE64 environment variable not set');
    }

    // Decode base64 credentials to JSON
    const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString('utf8');
    const credentials = JSON.parse(credentialsJson);

    const storage = new Storage({ credentials });

    // Parse form data with formidable
    const form = formidable({ multiples: false });
    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const { storeId, productId } = fields;
    const image = files.image?.[0]; // Get the first uploaded image

    if (!storeId || !productId || !image) {
      return res.status(400).json({ error: 'storeId, productId, and image are required' });
    }

    // Read the image file buffer
    const buffer = await readFile(image.filepath);

    // Upload to Google Cloud Storage
    const bucket = storage.bucket('f4cet-nft-assets');
    const fileExt = image.originalFilename.split('.').pop().toLowerCase();
    const nftImageFile = bucket.file(`nfts/${storeId}/${productId}/${productId}.${fileExt}`);

    console.log('Uploading NFT image to:', nftImageFile.name);
    await new Promise((resolve, reject) => {
      const stream = nftImageFile.createWriteStream({
        contentType: `image/${fileExt}`,
        metadata: { cacheControl: 'public, max-age=31536000' },
      });
      stream.on('error', reject);
      stream.on('finish', resolve);
      stream.end(buffer);
    });

    // Make the file public
    await nftImageFile.makePublic();

    // Return the public URL
    const nftImageUrl = `https://storage.googleapis.com/f4cet-nft-assets/nfts/${storeId}/${productId}/${productId}.${fileExt}`;
    return res.status(200).json({ url: nftImageUrl, fileExt });
  } catch (error) {
    console.error('Error uploading NFT image:', error);
    return res.status(500).json({ error: error.message });
  }
}