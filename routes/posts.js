const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
    res.status(200).send('Test Completed');
  });

module.exports = router;