const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const API_URL_UPLOAD_VISITOR = process.env.API_URL_UPLOAD_VISITOR;
const API_URL_AUTHENTICATE = process.env.API_URL_AUTHENTICATE;

const authenticate = async (visitorImageName) => {
    const requestUrl = `${API_URL_AUTHENTICATE}?objectKey=${visitorImageName}`;
    const response = await axios.get(requestUrl, {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
    return response.data;
};

app.post('/capture', async (req, res) => {
    const imageData = req.body.image;
    if (!imageData) {
        return res.status(400).json({ message: 'No image data received' });
    }

    const imageBinary = Buffer.from(imageData.split(',')[1], 'base64');
    const username = req.query.username;
    const lastname = req.query.lastname;
    const filename = `${username}_${lastname}`;
    const extension = 'png';
    const visitorImageName = `${filename}_${uuidv4()}.${extension}`;

    try {
        await axios.put(`${API_URL_UPLOAD_VISITOR}/${visitorImageName}`, imageBinary, {
            headers: { 'Content-Type': 'image/png' }
        });

        const authResponse = await authenticate(visitorImageName);
        if (authResponse.Message === 'Success') {
            res.json({ message: `Hi ${authResponse.firstName} ${authResponse.lastName}, welcome to work`, is_auth: true, visitor_name: visitorImageName });
        } else {
            res.json({ message: 'Authentication Failed', is_auth: false, visitor_name: visitorImageName });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error in image upload process, try again later.', is_auth: false, visitor_name: 'placeholder.jpeg' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
