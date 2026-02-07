const axios = require('axios');
const fs = require('fs');
const path = require('path');

const downloadImage = async (url, token, filepath) => {
    try {
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await axios({
            url: url,
            method: 'GET',
            responseType: 'stream',
            headers: headers
        });

        if (response.status !== 200) {
            throw new Error(`Failed to download image: Status ${response.status}`);
        }

        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', (err) => {
                writer.close(); // Ensure stream is closed
                // Optionally delete the partial file
                if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
                reject(err);
            });
        });
    } catch (error) {
        console.error(`Image Download Error (${url}):`, error.message);
        throw error;
    }
};

module.exports = { downloadImage };
