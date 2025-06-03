/**
=========================================================
* F4cetPanel - API Route to Update NFT Metadata
=========================================================

* Copyright 2025 F4cets Team
*/

import { Storage } from "@google-cloud/storage";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { storeId, productId, metadataId, status } = req.body;

  if (!storeId || !productId || !metadataId || !status) {
    return res.status(400).json({ error: "Missing required fields: storeId, productId, metadataId, status" });
  }

  try {
    // Decode base64-encoded Google Cloud credentials
    const credentialsBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
    if (!credentialsBase64) {
      throw new Error("GOOGLE_APPLICATION_CREDENTIALS_BASE64 environment variable is not set");
    }

    // Decode the base64 string to JSON
    const credentialsJson = Buffer.from(credentialsBase64, "base64").toString("utf-8");
    const credentials = JSON.parse(credentialsJson);

    // Initialize Google Cloud Storage with credentials
    const storage = new Storage({
      credentials,
    });

    const bucket = storage.bucket("f4cet-nft-assets");
    const filePath = `nfts/${storeId}/${productId}/${metadataId}.json`;
    const file = bucket.file(filePath);

    // Check if file exists
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({ error: `Metadata file not found: ${filePath}` });
    }

    // Download existing metadata
    const [content] = await file.download();
    const metadata = JSON.parse(content.toString());

    // Update Status attribute
    metadata.attributes = metadata.attributes.map(attr =>
      attr.trait_type === "Status" ? { ...attr, value: status } : attr
    );

    // Save updated metadata
    await file.save(JSON.stringify(metadata, null, 2), {
      contentType: "application/json",
      metadata: { cacheControl: "public, max-age=31536000" },
    });

    console.log(`Updated NFT metadata at ${filePath} with status: ${status}`);
    return res.status(200).json({ success: true, metadataUri: `https://storage.googleapis.com/f4cet-nft-assets/${filePath}` });
  } catch (error) {
    console.error("Error updating NFT metadata:", error);
    return res.status(500).json({ error: "Failed to update NFT metadata: " + error.message });
  }
}