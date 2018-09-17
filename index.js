const mongoose = require('mongoose');
const express = require('express');
const posts = require('./routes/posts');
const users = require('./routes/users');
const app = express();

mongoose.connect('mongodb://localhost/microblog')
  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => console.error('Could not connect to MongoDB...'));

app.use(express.json());
app.use('/api/posts', posts);
app.use('/api/users', users);

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}...`));