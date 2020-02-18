'use strict';

require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const fccTesting = require('./freeCodeCamp/fcctesting.js');

const app = express();

fccTesting(app); //For FCC testing purposes

app.set('view engine', 'pug');
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.route('/').get((req, res) => {
	res.render(process.cwd() + '/views/pug/index', { title: 'Hello', message: 'Please login' });
});

app.listen(process.env.PORT, () => {
	console.log('Listening on port ' + process.env.PORT);
});
