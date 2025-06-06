/**
 * F4cetPanel API - Release Funds
 *
 * Periodically checks for transactions eligible for escrow fund release
 * (7 days post-delivery for RWI, 7 days post-order for digital, no buyer confirmation,
 * no flagged issues) and triggers the releaseFunds Cloud Function.
 *
 * Project: https://github.com/F4cets/f4cetPanel
 * Deployed: Vercel (user.f4cets.market)
 * Trigger: HTTP POST
 * Authentication: None (for testing, to be secured)
 *
 * Dependencies: firebase-admin
 *
 * Firestore: transactions/{orderId}, notifications
 *
 * Copyright 2025 F4cets Team
 */

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

try {
  initializeApp();
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error.message);
}

const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    console.log(`release-funds: Invalid method: ${req.method}`);
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    console.log('release-funds: Processing fund release check');

    // Query transactions eligible for release
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const transactionsSnapshot = await db.collection('transactions')
      .where('buyerConfirmed', '==', false)
      .where('status', 'in', ['Ordered', 'Shipped', 'Delivered'])
      .get();

    const releasePromises = [];
    for (const txDoc of transactionsSnapshot.docs) {
      const txData = txDoc.data();
      const orderId = txDoc.id;
      const { type, deliveryConfirmedAt, createdAt, buyerId, sellerId } = txData;

      // Check for flagged issues
      const notificationsSnapshot = await db.collection('notifications')
        .where('orderId', '==', orderId)
        .where('userId', '==', sellerId)
        .where('type', '==', 'issue')
        .where('read', '==', false)
        .get();
      if (!notificationsSnapshot.empty) {
        console.log(`release-funds: Skipping order ${orderId} due to active flagged issue`);
        continue;
      }

      let releaseDate;
      if (type === 'rwi' && deliveryConfirmedAt) {
        const deliveryDate = new Date(deliveryConfirmedAt);
        releaseDate = new Date(deliveryDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (type === 'digital' && createdAt) {
        const createdDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
        releaseDate = new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else {
        continue;
      }

      if (now >= releaseDate) {
        console.log(`release-funds: Order ${orderId} eligible for fund release`);
        releasePromises.push(
          fetch('https://releasefunds-232592911911.us-central1.run.app', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, buyerId }),
          }).then(async (response) => {
            if (!response.ok) {
              const errorData = await response.json();
              console.error(`release-funds: Failed to release funds for order ${orderId}:`, errorData.error);
              return { orderId, success: false, error: errorData.error };
            }
            const result = await response.json();
            console.log(`release-funds: Released funds for order ${orderId}, signature: ${result.signature}`);
            return { orderId, success: true, signature: result.signature };
          }).catch((err) => {
            console.error(`release-funds: Error releasing funds for order ${orderId}:`, err.message);
            return { orderId, success: false, error: err.message };
          })
        );
      }
    }

    const results = await Promise.all(releasePromises);
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success);

    console.log(`release-funds: Processed ${releasePromises.length} orders: ${successful} successful, ${failed.length} failed`);
    res.status(200).json({
      processed: releasePromises.length,
      successful,
      failed: failed.map(f => ({ orderId: f.orderId, error: f.error })),
    });
  } catch (err) {
    console.error('release-funds: Error:', err.message);
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
}