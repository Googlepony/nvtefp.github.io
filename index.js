const express = require('express');
const multer = require('multer');
const tabula = require('tabula-js');

const app = express();

// configure multer for handling file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage });

app.get('/', (req, res) => {
    res.send('Get - Working');
});

app.post('/upload', upload.single('pdf'), async (req, res) => {
    try {
        const pdfPath = req.file.path;
        const stream = tabula(pdfPath, { pages: "all" }, { area: "80, 30, 1080 , 810" }).streamCsv();
        const fileStream = stream.fork();
        let csvData = '';
        fileStream.on('data', chunk => csvData += chunk);
        fileStream.on('end', () => {
            const jsonArray = csvToJson(csvData);
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=${req.file.originalname.split('.')[0]}.json`);
            res.send(jsonArray);
        });
    } catch (err) {
        res.status(500).send(`Error occurred while processing PDF: ${err.message}`);
    }
});

function csvToJson(csvData) {
    const lines = csvData.trim().split('\n');
    const headers = lines.shift().split(',');
    return lines.map(line => {
        const values = line.split(',');
        return headers.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
        }, {});
    });
}

app.listen(3000, () => {
    console.log(`App is listening on port 3000`);
});
