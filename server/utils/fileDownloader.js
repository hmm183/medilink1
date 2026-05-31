// server/utils/fileDownloader.js
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Dynamically import the uuid package
let uuidv4;
import('uuid').then(module => {
    uuidv4 = module.v4;
});

// Ensure a temporary directory exists
const tempDir = path.join(__dirname, '..', 'tmp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

const downloadFile = async (url) => {
  // Wait for uuidv4 to be imported before using it
  if (!uuidv4) {
    await new Promise(resolve => {
        const checkImport = setInterval(() => {
            if (uuidv4) {
                clearInterval(checkImport);
                resolve();
            }
        }, 50);
    });
  }
  
  const tempFileName = `${uuidv4()}-${path.basename(new URL(url).pathname)}`;
  const tempFilePath = path.join(tempDir, tempFileName);

  const response = await axios({
    method: 'GET',
    url: url,
    responseType: 'stream',
  });

  const writer = fs.createWriteStream(tempFilePath);

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on('finish', () => resolve(tempFilePath));
    writer.on('error', reject);
  });
};

module.exports = { downloadFile };