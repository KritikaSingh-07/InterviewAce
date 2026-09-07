export interface UpiValidationResult {
  isValid: boolean;
  handle: string;
  providerName: string;
  providerBadge: string;
  color: string;
  errorMessage?: string;
}

const UPI_PROVIDERS: Record<string, { name: string; badge: string; color: string }> = {
  paytm: { name: 'Paytm UPI', badge: 'Paytm', color: 'text-sky-500 bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-800' },
  ybl: { name: 'PhonePe (YES Bank)', badge: 'PhonePe', color: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-800' },
  ibl: { name: 'PhonePe (IndusInd)', badge: 'PhonePe', color: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-800' },
  axl: { name: 'PhonePe (Axis)', badge: 'PhonePe', color: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-800' },
  okaxis: { name: 'Google Pay (Axis)', badge: 'GPay', color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800' },
  okhdfcbank: { name: 'Google Pay (HDFC)', badge: 'GPay', color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800' },
  okicici: { name: 'Google Pay (ICICI)', badge: 'GPay', color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800' },
  oksbi: { name: 'Google Pay (SBI)', badge: 'GPay', color: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800' },
  apl: { name: 'Amazon Pay', badge: 'Amazon Pay', color: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-800' },
  upi: { name: 'BHIM Standard UPI', badge: 'BHIM UPI', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-800' },
  sbi: { name: 'BHIM SBI Pay', badge: 'SBI UPI', color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-800' },
  cred: { name: 'CRED Pay UPI', badge: 'CRED', color: 'text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-800' },
  jupiteraxis: { name: 'Jupiter UPI', badge: 'Jupiter', color: 'text-teal-500 bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-800' },
  ikwik: { name: 'MobiKwik UPI', badge: 'MobiKwik', color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-800' },
  postbank: { name: 'IPPB Post Bank UPI', badge: 'Post Bank', color: 'text-orange-500 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-800' },
  airtel: { name: 'Airtel Money UPI', badge: 'Airtel', color: 'text-red-500 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-800' },
  jio: { name: 'Jio UPI', badge: 'Jio', color: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800' },
  icici: { name: 'ICICI iMobile UPI', badge: 'ICICI', color: 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-800' },
  hdfcbank: { name: 'HDFC MobileBanking UPI', badge: 'HDFC', color: 'text-blue-700 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800' },
  axisbank: { name: 'Axis Mobile UPI', badge: 'Axis', color: 'text-pink-600 bg-pink-50 dark:bg-pink-500/10 border-pink-200 dark:border-pink-800' },
  kotak: { name: 'Kotak 811 UPI', badge: 'Kotak', color: 'text-red-600 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-800' },
  pnb: { name: 'PNB ONE UPI', badge: 'PNB', color: 'text-purple-600 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-800' },
  barodampay: { name: 'BOB World UPI', badge: 'Bank of Baroda', color: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-800' },
};

/**
 * Validates an Indian UPI ID and identifies the provider/handle live.
 */
export function validateUpiId(upiId: string): UpiValidationResult {
  const trimmed = (upiId || '').trim().toLowerCase();

  if (!trimmed) {
    return {
      isValid: false,
      handle: '',
      providerName: '',
      providerBadge: '',
      color: '',
      errorMessage: 'Please enter a UPI ID',
    };
  }

  if (!trimmed.includes('@')) {
    return {
      isValid: false,
      handle: '',
      providerName: '',
      providerBadge: '',
      color: '',
      errorMessage: 'Missing @ symbol (e.g. name@paytm, mobile@ybl)',
    };
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return {
      isValid: false,
      handle: '',
      providerName: '',
      providerBadge: '',
      color: '',
      errorMessage: 'Invalid UPI ID format',
    };
  }

  const [username, handle] = parts;

  // Username validation: 2-64 characters
  const usernameRegex = /^[a-zA-Z0-9.\-_]{2,64}$/;
  if (!usernameRegex.test(username)) {
    return {
      isValid: false,
      handle,
      providerName: '',
      providerBadge: '',
      color: '',
      errorMessage: 'Username should be 2-64 alphanumeric characters',
    };
  }

  // Handle validation: 2-32 characters
  const handleRegex = /^[a-zA-Z]{2,32}$/;
  if (!handleRegex.test(handle)) {
    return {
      isValid: false,
      handle,
      providerName: '',
      providerBadge: '',
      color: '',
      errorMessage: 'Invalid handle after @ (e.g. paytm, ybl, okaxis)',
    };
  }

  const knownProvider = UPI_PROVIDERS[handle];

  if (knownProvider) {
    return {
      isValid: true,
      handle,
      providerName: knownProvider.name,
      providerBadge: knownProvider.badge,
      color: knownProvider.color,
    };
  }

  // Generic valid Indian UPI handle
  return {
    isValid: true,
    handle,
    providerName: `${handle.toUpperCase()} UPI`,
    providerBadge: handle.toUpperCase(),
    color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-800',
  };
}
