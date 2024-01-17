// server/routes/dictionary.js
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const dictionaryFilePath = path.join(__dirname, '../public/dictionary.txt');

router.get('/', (req, res) => {
    console.log('ROUTE REACHED');
    try {
        console.log('Received request for dictionary');
        const dictionaryData = fs.readFileSync(dictionaryFilePath, 'utf-8');
        const dictionaryArray = dictionaryData.split('\n');
        console.log(dictionaryArray)

        // Set the Content-Type header to indicate plain text
        res.setHeader('Content-Type', 'text/plain');

        // Send the dictionary content as plain text
        res.send(dictionaryData);
    } catch (error) {
        console.error('Error reading dictionary file:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
