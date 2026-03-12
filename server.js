require('dotenv').config();

const express = require('express');


const app = express();

// 3. Define a port number
const PORT = 9002;

// 4. Create a basic test route
app.get('/', (req, res) => {
    res.send('Hello! The server is running successfully from scratch! 🚀');
});

// 5. Start the server and listen on the defined port
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
