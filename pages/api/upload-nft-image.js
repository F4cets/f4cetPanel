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

    // Initialize Google Cloud Storage
    const storage = new Storage();
    const bucket = storage.bucket('f4cet-nft-assets');
    const fileExt = image.originalFilename.split('.').pop().toLowerCase();
    const nftImageFile = bucket.file(`nfts/${storeId}/${productId}/${productId}.${fileExt}`);

    // Upload to Google Cloud Storage
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