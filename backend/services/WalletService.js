const { ethers } = require('ethers');
const dotenv = require('dotenv');

dotenv.config();

class WalletService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(
      process.env.INFURA_URL || 'http://localhost:8545'
    );
  }

  /**
   * Verify a wallet address signature
   * @param {string} walletAddress - The wallet address to verify
   * @param {string} message - The original message
   * @param {string} signature - The signed message
   * @returns {boolean} - Whether the signature is valid
   */
  async verifySignature(walletAddress, message, signature) {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
      console.error('Signature verification error:', error);
      return false;
    }
  }

  /**
   * Generate a message for wallet verification
   * @param {string} walletAddress - The wallet address
   * @param {number} timestamp - Current timestamp
   * @returns {string} - Message to be signed
   */
  generateVerificationMessage(walletAddress, timestamp = Date.now()) {
    return `MedTrustFund Wallet Verification\nAddress: ${walletAddress}\nTimestamp: ${timestamp}\n\nSign this message to verify your wallet ownership.`;
  }

  /**
   * Check wallet balance
   * @param {string} walletAddress - The wallet address
   * @returns {Promise<string>} - Balance in ETH
   */
  async getWalletBalance(walletAddress) {
    try {
      const balance = await this.provider.getBalance(walletAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      throw error;
    }
  }

  /**
   * Check if address is valid
   * @param {string} address - Wallet address to check
   * @returns {boolean} - Valid or not
   */
  isValidAddress(address) {
    return ethers.isAddress(address);
  }

  /**
   * Get checksummed address
   * @param {string} address - Wallet address
   * @returns {string} - Checksummed address
   */
  getChecksumAddress(address) {
    try {
      return ethers.getAddress(address);
    } catch (error) {
      return null;
    }
  }

  /**
   * Monitor wallet for incoming donations
   * @param {string} walletAddress - Address to monitor
   * @param {function} callback - Callback when transaction received
   */
  async monitorWallet(walletAddress, callback) {
    try {
      this.provider.on('block', async () => {
        const balance = await this.getWalletBalance(walletAddress);
        callback(null, balance);
      });
    } catch (error) {
      console.error('Error monitoring wallet:', error);
      callback(error, null);
    }
  }

  /**
   * Get transaction details
   * @param {string} txHash - Transaction hash
   * @returns {Promise<object>} - Transaction details
   */
  async getTransaction(txHash) {
    try {
      const tx = await this.provider.getTransaction(txHash);
      const receipt = await this.provider.getTransactionReceipt(txHash);
      return { tx, receipt };
    } catch (error) {
      console.error('Error fetching transaction:', error);
      throw error;
    }
  }

  /**
   * Wait for transaction confirmation
   * @param {string} txHash - Transaction hash
   * @param {number} confirmations - Number of confirmations needed
   * @returns {Promise<object>} - Receipt
   */
  async waitForConfirmation(txHash, confirmations = 1) {
    try {
      const receipt = await this.provider.waitForTransaction(txHash, confirmations);
      return receipt;
    } catch (error) {
      console.error('Error waiting for confirmation:', error);
      throw error;
    }
  }
}

module.exports = new WalletService();
