const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = 3000;

// Pinata API credentials
const PINATA_API_KEY = '47f5234ffd6edbd6eb3e';
const PINATA_SECRET_API_KEY = 'b78e0eef5b70fa20960964d7722a5d2d373de6726298a59c416273346551657a';

app.use(bodyParser.json());

// Endpoint to generate presigned URL
app.get('/presigned_url', async (req, res) => {
    try {
        const response = await axios.post(
            'https://api.pinata.cloud/pinning/presignedUrl',
            {
                contentType: 'application/json',
                metadata: {
                    name: 'metadata_upload',
                },
            },
            {
                headers: {
                    pinata_api_key: PINATA_API_KEY,
                    pinata_secret_api_key: PINATA_SECRET_API_KEY,
                },
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        console.error('Error details:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to generate presigned URL' });
    }
});

app.post('/upload_file', async (req, res) => {
    try {
        const { fileName, fileContent } = req.body;

        const response = await axios.post(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            {
                file: fileContent,
                pinataMetadata: {
                    name: fileName,
                },
            },
            {
                headers: {
                    pinata_api_key: PINATA_API_KEY,
                    pinata_secret_api_key: PINATA_SECRET_API_KEY,
                    'Content-Type': 'application/json',
                },
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('Error uploading file to Pinata:', error);
        console.error('Error details:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Failed to upload file to Pinata' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});