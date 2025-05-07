import { PinataSDK } from 'pinata';
import fs, { createWriteStream } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { Blob } from 'buffer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.GATEWAY_URL,
});

const metadataDir = path.join(__dirname, 'metadata');

async function uploadMetadata() {
    try {
        const files = fs.readdirSync(metadataDir);

        for (const file of files) {
            const filePath = path.join(metadataDir, file);
            const fileContent = fs.readFileSync(filePath);

            const fileBlob = new Blob([fileContent]);

            const upload = await pinata.upload.public.file(fileBlob, {
                name: file,
            });

            console.log(`Uploaded ${file} with IPFS Hash: ${upload.cid}`);
        }

        console.log('All metadata files uploaded successfully!');
    } catch (error) {
        console.error('Error uploading metadata:', error);
    }
}

uploadMetadata();