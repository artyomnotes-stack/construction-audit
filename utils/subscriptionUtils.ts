
/**
 * ArchiCheck AI - Subscription Utilities
 * Logic for handling 10,000 AMD / 30-day access.
 */

/**
 * Checks if the subscription is currently valid.
 * @param expiryDate The date when the subscription expires.
 * @param isActive Explicit active flag from database.
 * @returns boolean
 */
export const isSubscriptionValid = (expiryDate: Date, isActive: boolean): boolean => {
  if (!isActive) return false;
  const now = new Date();
  return expiryDate > now;
};

/**
 * Calculates how many days are left until the subscription expires.
 * @param expiryDate The date when the subscription expires.
 * @returns number (rounded up)
 */
export const getDaysRemaining = (expiryDate: Date): number => {
  const now = new Date();
  const diffInMs = expiryDate.getTime() - now.getTime();
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(diffInDays));
};

/**
 * Formats the subscription status for Firestore/Firebase storage.
 * Note: When saving to Firestore, use Firebase's Timestamp.fromDate(date).
 */
export const generateNewSubscription = (email: string) => {
  const now = new Date();
  const expiry = new Date();
  expiry.setDate(now.getDate() + 30); // 30 days access

  return {
    email,
    subscriptionActive: true,
    lastPaymentDate: now,
    expiryDate: expiry,
    amountPaid: 10000,
    currency: 'AMD'
  };
};
