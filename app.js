require('dotenv').config();
const { PORT } = process.env;

const express = require('express');
const app = express();

app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`App is now running on port: ${PORT}`);
});
