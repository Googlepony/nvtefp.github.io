// Import required packages
const { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync } = require('fs');
const { join } = require('path');
const { pipeline } = require('stream');
const { promisify } = require('util');
const fetch = require('node-fetch');
const tabula = require('tabula-js');

// Define the temporary directory path
const TMP_DIR = join(__dirname, 'tmp');

// Define the handler function for the Vercel API endpoint
module.exports = async (req, res) => {
    // Get the PDF file URL from the request
    const { pdfUrl } = req.query;

    // Check if the PDF URL is present
    if (!pdfUrl) {
        res.status(400).send('PDF URL missing');
        return;
    }

    try {
        // Fetch the PDF file from the URL
        const response = await fetch(pdfUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`);
        }

        // Create the temporary directory if it doesn't exist
        if (!existsSync(TMP_DIR)) {
            mkdirSync(TMP_DIR);
        }

        // Define the paths for the temporary files
        const pdfPath = join(TMP_DIR, 'input.pdf');
        const csvPath = join(TMP_DIR, 'output.csv');

        // Log the paths of the temporary files
        console.log(`PDF file path: ${pdfPath}`);
        console.log(`CSV file path: ${csvPath}`);

        // Write the PDF file to the temporary directory
        await new Promise((resolve, reject) => {
            const fileStream = createWriteStream(pdfPath);
            response.body.pipe(fileStream);
            response.body.on('error', (error) => {
                reject(error);
            });
            fileStream.on('finish', () => {
                resolve();
            });
        });

        // Use the `tabula-js` library to convert the PDF to CSV
        await promisify(pipeline)(
            createReadStream(pdfPath),
            tabula(pdfPath).streamCsv(),
            createWriteStream(csvPath)
        );

        // Read the CSV file contents
        const csvContents = readFileSync(csvPath, 'utf-8');

        // Send the CSV contents as the response
        res.status(200).send(csvContents);
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred');
    }
};
