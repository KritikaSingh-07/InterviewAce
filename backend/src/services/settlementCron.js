import { settleEarnings } from './walletService.js';

let intervalId = null;

// Run every hour (3600000ms)
const SETTLEMENT_INTERVAL = 60 * 60 * 1000;

/**
 * Start the settlement cron job.
 */
export const startSettlementCron = () => {
  if (intervalId) {
    console.log('[SettlementCron] Already running');
    return;
  }

  console.log('[SettlementCron] Starting settlement cron (hourly)');

  // Run immediately on start
  runSettlement();

  // Then run every hour
  intervalId = setInterval(runSettlement, SETTLEMENT_INTERVAL);
};

/**
 * Stop the settlement cron job.
 */
export const stopSettlementCron = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[SettlementCron] Stopped');
  }
};

/**
 * Execute a single settlement run.
 */
const runSettlement = async () => {
  try {
    const settledCount = await settleEarnings();
    if (settledCount > 0) {
      console.log(`[SettlementCron] Settled ${settledCount} pending earning(s)`);
    }
  } catch (err) {
    console.error('[SettlementCron] Settlement run failed:', err);
  }
};

export default { startSettlementCron, stopSettlementCron };
