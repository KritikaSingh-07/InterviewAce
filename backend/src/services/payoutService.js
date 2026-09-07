import Razorpay from 'razorpay';

let razorpayXInstance = null;

const isRazorpayXConfigured = () =>
  !!(process.env.RAZORPAY_X_KEY_ID && process.env.RAZORPAY_X_KEY_SECRET);

const getRazorpayX = () => {
  if (!razorpayXInstance) {
    if (!isRazorpayXConfigured()) {
      return null; // Simulation mode
    }
    razorpayXInstance = new Razorpay({
      key_id: process.env.RAZORPAY_X_KEY_ID,
      key_secret: process.env.RAZORPAY_X_KEY_SECRET,
    });
  }
  return razorpayXInstance;
};

const getAccountNumber = () => process.env.RAZORPAY_X_ACCOUNT_NUMBER || '';

/**
 * Generate a simulated ID for test mode.
 */
const simulatedId = (prefix) =>
  `${prefix}_sim_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * Create a Razorpay Contact for the mentor.
 * @param {{ name: string, email: string, phone?: string }} mentor
 * @returns {Promise<{ id: string, simulated: boolean }>}
 */
export const createContact = async ({ name, email, phone }) => {
  const rpx = getRazorpayX();
  if (!rpx) {
    console.log(`[PayoutService] SIMULATED: Creating contact for ${email}`);
    return { id: simulatedId('cont'), simulated: true };
  }

  // RazorpayX Contacts API
  const contact = await rpx.contacts?.create?.({
    name,
    email,
    contact: phone || undefined,
    type: 'vendor',
    reference_id: email,
  }) || await fetch(`https://api.razorpay.com/v1/contacts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_X_KEY_ID}:${process.env.RAZORPAY_X_KEY_SECRET}`).toString('base64')}`,
    },
    body: JSON.stringify({ name, email, contact: phone || undefined, type: 'vendor', reference_id: email }),
  }).then((res) => res.json());

  return { id: contact.id, simulated: false };
};

/**
 * Create a Fund Account (bank account or VPA) linked to a Contact.
 * @param {{ contactId: string, accountNumber: string, ifsc: string, accountHolderName: string }} bankDetails
 * @returns {Promise<{ id: string, simulated: boolean }>}
 */
export const createBankFundAccount = async ({ contactId, accountNumber, ifsc, accountHolderName }) => {
  const rpx = getRazorpayX();
  if (!rpx) {
    console.log(`[PayoutService] SIMULATED: Creating bank fund account for contact ${contactId}`);
    return { id: simulatedId('fa'), simulated: true };
  }

  const response = await fetch(`https://api.razorpay.com/v1/fund_accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_X_KEY_ID}:${process.env.RAZORPAY_X_KEY_SECRET}`).toString('base64')}`,
    },
    body: JSON.stringify({
      contact_id: contactId,
      account_type: 'bank_account',
      bank_account: {
        name: accountHolderName,
        ifsc,
        account_number: accountNumber,
      },
    }),
  }).then((res) => res.json());

  if (response.error) {
    throw new Error(response.error.description || 'Failed to create fund account');
  }

  return { id: response.id, simulated: false };
};

/**
 * Create a VPA (UPI) Fund Account linked to a Contact.
 * @param {{ contactId: string, vpa: string }} details
 * @returns {Promise<{ id: string, simulated: boolean }>}
 */
export const createVpaFundAccount = async ({ contactId, vpa }) => {
  const rpx = getRazorpayX();
  if (!rpx) {
    console.log(`[PayoutService] SIMULATED: Creating VPA fund account for contact ${contactId}`);
    return { id: simulatedId('fa'), simulated: true };
  }

  const response = await fetch(`https://api.razorpay.com/v1/fund_accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_X_KEY_ID}:${process.env.RAZORPAY_X_KEY_SECRET}`).toString('base64')}`,
    },
    body: JSON.stringify({
      contact_id: contactId,
      account_type: 'vpa',
      vpa: { address: vpa },
    }),
  }).then((res) => res.json());

  if (response.error) {
    throw new Error(response.error.description || 'Failed to create VPA fund account');
  }

  return { id: response.id, simulated: false };
};

/**
 * Validate a fund account via penny-drop verification.
 * @param {{ fundAccountId: string, accountNumber: string, ifsc: string, accountHolderName: string }} details
 * @returns {Promise<{ id: string, status: string, simulated: boolean }>}
 */
export const validateFundAccount = async ({ fundAccountId, accountNumber, ifsc, accountHolderName }) => {
  const rpx = getRazorpayX();
  if (!rpx) {
    console.log(`[PayoutService] SIMULATED: Validating fund account ${fundAccountId}`);
    return { id: simulatedId('fav'), status: 'completed', simulated: true };
  }

  const response = await fetch(`https://api.razorpay.com/v1/fund_accounts/validations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_X_KEY_ID}:${process.env.RAZORPAY_X_KEY_SECRET}`).toString('base64')}`,
    },
    body: JSON.stringify({
      fund_account: {
        id: fundAccountId,
      },
      amount: 100, // ₹1 in paise
      currency: 'INR',
      notes: { purpose: 'bank_verification' },
    }),
  }).then((res) => res.json());

  if (response.error) {
    throw new Error(response.error.description || 'Fund account validation failed');
  }

  return { id: response.id, status: response.status || 'created', simulated: false };
};

/**
 * Initiate a payout to a mentor's bank account.
 * @param {{ fundAccountId: string, amount: number, currency: string, referenceId: string, narration: string }} params
 * @returns {Promise<{ id: string, status: string, utr: string|null, simulated: boolean }>}
 */
export const initiatePayout = async ({ fundAccountId, amount, currency = 'INR', referenceId, narration }) => {
  const rpx = getRazorpayX();
  if (!rpx) {
    console.log(`[PayoutService] SIMULATED: Payout of ${amount} paise to fund account ${fundAccountId}`);
    return {
      id: simulatedId('pout'),
      status: 'processed',
      utr: simulatedId('UTR'),
      simulated: true,
    };
  }

  const accountNumber = getAccountNumber();
  const response = await fetch(`https://api.razorpay.com/v1/payouts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_X_KEY_ID}:${process.env.RAZORPAY_X_KEY_SECRET}`).toString('base64')}`,
    },
    body: JSON.stringify({
      account_number: accountNumber,
      fund_account_id: fundAccountId,
      amount,
      currency,
      mode: 'IMPS',
      purpose: 'payout',
      queue_if_low_balance: true,
      reference_id: referenceId,
      narration: narration || 'InterviewAce Mentor Payout',
    }),
  }).then((res) => res.json());

  if (response.error) {
    throw new Error(response.error.description || 'Payout initiation failed');
  }

  return {
    id: response.id,
    status: response.status || 'processing',
    utr: response.utr || null,
    simulated: false,
  };
};

/**
 * Get the status of a payout.
 * @param {string} payoutId
 * @returns {Promise<{ id: string, status: string, utr: string|null, simulated: boolean }>}
 */
export const getPayoutStatus = async (payoutId) => {
  if (payoutId?.startsWith('pout_sim_')) {
    return { id: payoutId, status: 'processed', utr: 'UTR_sim_success', simulated: true };
  }

  const response = await fetch(`https://api.razorpay.com/v1/payouts/${payoutId}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.RAZORPAY_X_KEY_ID}:${process.env.RAZORPAY_X_KEY_SECRET}`).toString('base64')}`,
    },
  }).then((res) => res.json());

  return {
    id: response.id,
    status: response.status,
    utr: response.utr || null,
    simulated: false,
  };
};

export { isRazorpayXConfigured };
