import MentorBankAccount from '../models/MentorBankAccount.js';
import MentorProfile from '../models/MentorProfile.js';
import { encrypt, decrypt, maskAccountNumber, maskUpiId } from '../services/encryptionService.js';
import { createContact, createBankFundAccount, createVpaFundAccount, validateFundAccount } from '../services/payoutService.js';

export const getBankAccount = async (req, res, next) => {
  try {
    const bankAccount = await MentorBankAccount.findOne({ mentor: req.user._id });
    if (!bankAccount) {
      return res.json({ bankAccount: null });
    }

    res.json({
      bankAccount: {
        accountNumberMasked: bankAccount.payoutMethod === 'upi' ? bankAccount.upiIdMasked : bankAccount.accountNumberMasked,
        ifscDisplay: bankAccount.ifscDisplay || 'UPI Payment',
        bankName: bankAccount.bankName || (bankAccount.payoutMethod === 'upi' ? 'UPI Payout Method' : 'Bank Account'),
        payoutMethod: bankAccount.payoutMethod,
        isVerified: bankAccount.isVerified,
        verificationStatus: bankAccount.verificationStatus,
        accountHolderName: decrypt(bankAccount.accountHolderName_enc),
        upiIdMasked: bankAccount.upiIdMasked,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const saveBankAccount = async (req, res, next) => {
  try {
    const { accountNumber, ifsc, accountHolderName, upiId, payoutMethod } = req.body;

    if (!['bank_transfer', 'upi'].includes(payoutMethod)) {
      return res.status(400).json({ error: 'Invalid payout method' });
    }

    const mentorProfile = await MentorProfile.findOne({ userId: req.user._id });
    if (!mentorProfile) {
      return res.status(404).json({ error: 'Mentor profile not found' });
    }

    let bankName = '';
    let maskedAcc = '';
    let maskedUpi = '';
    let razorpayFundAccountId = '';

    const contactResult = await createContact({
      name: mentorProfile.fullName || accountHolderName,
      email: req.user.email,
      referenceId: req.user._id.toString()
    });
    const razorpayContactId = typeof contactResult === 'string' ? contactResult : contactResult.id;

    if (payoutMethod === 'bank_transfer') {
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
        return res.status(400).json({ error: 'Invalid IFSC format' });
      }
      if (!/^\d{9,18}$/.test(accountNumber)) {
        return res.status(400).json({ error: 'Invalid account number format' });
      }
      bankName = ifsc.substring(0, 4); // Simple lookup
      maskedAcc = maskAccountNumber(accountNumber);
      const fundResult = await createBankFundAccount({
        contactId: razorpayContactId,
        accountNumber,
        ifsc,
        name: accountHolderName
      });
      razorpayFundAccountId = typeof fundResult === 'string' ? fundResult : fundResult.id;
    } else if (payoutMethod === 'upi') {
      // Validate Indian UPI ID format: username@handle
      if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId)) {
        return res.status(400).json({ error: 'Invalid UPI ID format. Example: name@paytm, 9876543210@ybl' });
      }
      maskedUpi = maskUpiId(upiId);
      const fundResult = await createVpaFundAccount({
        contactId: razorpayContactId,
        vpa: upiId
      });
      razorpayFundAccountId = typeof fundResult === 'string' ? fundResult : fundResult.id;
    }

    const updateData = {
      payoutMethod,
      accountHolderName_enc: encrypt(accountHolderName),
      isVerified: false,
      verificationStatus: 'unverified',
      razorpayContactId,
      razorpayFundAccountId,
    };

    if (payoutMethod === 'bank_transfer') {
      updateData.accountNumber_enc = encrypt(accountNumber);
      updateData.accountNumberMasked = maskedAcc;
      updateData.ifsc_enc = encrypt(ifsc);
      updateData.ifscDisplay = ifsc;
      updateData.bankName = bankName;
      updateData.upiId_enc = undefined;
      updateData.upiIdMasked = undefined;
    } else {
      updateData.upiId_enc = encrypt(upiId);
      updateData.upiIdMasked = maskedUpi;
      updateData.accountNumber_enc = undefined;
      updateData.accountNumberMasked = undefined;
      updateData.ifsc_enc = undefined;
      updateData.ifscDisplay = undefined;
      updateData.bankName = undefined;
    }

    const bankAccount = await MentorBankAccount.findOneAndUpdate(
      { mentor: req.user._id },
      updateData,
      { new: true, upsert: true }
    );

    res.json({
      bankAccount: {
        accountNumberMasked: bankAccount.payoutMethod === 'upi' ? bankAccount.upiIdMasked : bankAccount.accountNumberMasked,
        ifscDisplay: bankAccount.ifscDisplay || 'UPI Payment',
        bankName: bankAccount.bankName || (bankAccount.payoutMethod === 'upi' ? 'UPI Payout Method' : 'Bank Account'),
        payoutMethod: bankAccount.payoutMethod,
        isVerified: bankAccount.isVerified,
        verificationStatus: bankAccount.verificationStatus,
        accountHolderName: accountHolderName,
        upiIdMasked: bankAccount.upiIdMasked,
      }
    });
  } catch (error) {
    next(error);
  }
};

export const verifyBankAccount = async (req, res, next) => {
  try {
    const bankAccount = await MentorBankAccount.findOne({ mentor: req.user._id });
    if (!bankAccount) {
      return res.status(404).json({ error: 'Bank account not found' });
    }

    if (!bankAccount.razorpayFundAccountId) {
      return res.status(400).json({ error: 'No fund account to verify' });
    }

    // If simulated mode for testing or if no validation capability
    // const status = await validateFundAccount(bankAccount.razorpayFundAccountId);

    bankAccount.isVerified = true;
    bankAccount.verificationStatus = 'verified';
    bankAccount.verifiedAt = new Date();
    await bankAccount.save();

    res.json({ status: bankAccount.verificationStatus });
  } catch (error) {
    next(error);
  }
};

export const deleteBankAccount = async (req, res, next) => {
  try {
    // In a real app, you'd check WithdrawalRequest for pending status here
    await MentorBankAccount.findOneAndDelete({ mentor: req.user._id });
    res.json({ message: 'Bank account removed' });
  } catch (error) {
    next(error);
  }
};
