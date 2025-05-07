import fs from 'fs';
import path from 'path';
import { Connection, PublicKey, Keypair, Transaction, SystemProgram, SendTransactionError } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
const payer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.PAYER_SECRET_KEY)));
const metadataHashesPath = path.join(__dirname, 'metadata_hashes.csv');
const metadataManifestPath = path.join(__dirname, 'metadata-manifest.csv');

async function mintTokens() {
    try {
        console.log('Starting minting process...');
        console.log('Payer Public Key:', payer.publicKey.toBase58());
        console.log('Connection URL:', connection.rpcEndpoint);

        const metadataHashes = fs.readFileSync(metadataHashesPath, 'utf-8').split('\n').slice(1);
        const metadataManifest = fs.readFileSync(metadataManifestPath, 'utf-8').split('\n').slice(1);

        for (let i = 0; i < metadataHashes.length; i++) {
            const [fileName, ipfsHash] = metadataHashes[i].split(',');
            const manifestEntry = metadataManifest.find(entry => entry.startsWith(fileName));

            if (!manifestEntry) {
                console.error(`No manifest entry found for ${fileName}`);
                continue;
            }

            const [, uniqueId] = manifestEntry.split(',');

            // Add logging for each step
            console.log(`Processing metadata file: ${fileName}`);
            console.log(`IPFS Hash: ${ipfsHash}, Unique ID: ${uniqueId}`);

            // Create a new mint
            console.log('Creating mint...');
            console.log('Mint creation parameters:', {
                connection: connection.rpcEndpoint,
                payer: payer.publicKey.toBase58(),
                mintAuthority: payer.publicKey.toBase58(),
                freezeAuthority: null,
                decimals: 0
            });
            const mint = await createMint(
                connection,
                payer,
                payer.publicKey,
                null,
                0 // Decimals
            );
            const tokenAccount = await getOrCreateAssociatedTokenAccount(
                connection,
                payer,
                mint,
                payer.publicKey
            );
            console.log('Token account created:', tokenAccount.address.toBase58());

            // Mint tokens to the associated token account
            console.log('Minting tokens...');
            await mintTo(
                connection,
                payer,
                mint,
                tokenAccount.address,
                payer,
                1 // Amount
            );
            console.log('Tokens minted successfully!');

            console.log(`Minted token for ${fileName} with IPFS Hash: ${ipfsHash} and Unique ID: ${uniqueId}`);
        }

        console.log('All tokens minted successfully!');
    } catch (error) {
        if (error instanceof SendTransactionError) {
            console.error('Transaction simulation failed:', error.transactionMessage);
            console.error('Logs:', error.transactionLogs);
        } else {
            console.error('Error minting tokens:', error);
        }
    }
}

mintTokens();