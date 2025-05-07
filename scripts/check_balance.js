const Arweave = require('arweave');
const fs = require('fs');

const arweave = Arweave.init({
  host: 'ar-io.dev', // Updated to AR.IO Testnet node
  port: 443,
  protocol: 'https',
});

const keyfilePath = './scripts/arweave-keyfile/qZxrtptv5l3YpnwxcyHU5xeCmnklKlbH_8yCuLds4ZM.json';
const key = JSON.parse(fs.readFileSync(keyfilePath, 'utf-8'));

async function checkBalance() {
  try {
    const address = await arweave.wallets.jwkToAddress(key);
    const balance = await arweave.wallets.getBalance(address);
    console.log(`Wallet Address: ${address}`);
    console.log(`Balance: ${arweave.ar.winstonToAr(balance)} AR`);
  } catch (error) {
    console.error('Error checking balance:', error);
  }
}

checkBalance();