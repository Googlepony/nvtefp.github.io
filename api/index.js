const tabula = require('tabula-js');

module.exports = async (req, res) => {
    try {
        const { pdf } = req.body; // Get the PDF file from the request body
        const t = tabula(pdf.path, { pages: "all", area: "80, 30, 1080 , 810" });
        t.extractCsv((err, data) => {
            if (err) {
                console.error(err);
                res.status(500).send(err);
            } else {
                res.status(200).send(data);
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send(error);
    }
};
