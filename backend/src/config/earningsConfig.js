export const PLATFORM_COMMISSION = Number(process.env.PLATFORM_COMMISSION_PERCENT || 30) / 100; // 0.30
export const MENTOR_SHARE = 1 - PLATFORM_COMMISSION; // 0.70
export const SETTLEMENT_HOLD_DAYS = Number(process.env.SETTLEMENT_HOLD_DAYS || 7);
export const MIN_WITHDRAWAL_AMOUNT = Number(process.env.MIN_WITHDRAWAL_AMOUNT || 50000); // ₹500 in paise
export const MAX_RETRY_COUNT = 3;
export const HIGH_VALUE_THRESHOLD = 5000000; // ₹50,000 in paise — flag for review
export const MAX_WITHDRAWALS_PER_DAY = 3;

/**
 * Calculate the mentor and platform shares from a gross amount (in paise).
 * @param {number} grossAmount - Total amount paid by the student in paise
 * @returns {{ mentorAmount: number, platformAmount: number }}
 */
export const calculateSplit = (grossAmount) => {
  const mentorAmount = Math.floor(grossAmount * MENTOR_SHARE);
  const platformAmount = grossAmount - mentorAmount; // Remainder to platform to avoid rounding loss
  return { mentorAmount, platformAmount };
};

/**
 * Calculate the settlement date from now based on hold period.
 * @returns {Date}
 */
export const getSettlementDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + SETTLEMENT_HOLD_DAYS);
  return date;
};
