'use strict';

if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const auth = require('./auth.js');
const bodyParser = require('body-parser');
const express = require('express');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const mongo = require('mongodb').MongoClient;
const passport = require('passport');
const routes = require('./routes.js');
const session = require('express-session');

const app = express();

fccTesting(app); //For FCC testing purposes

app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'pug');

app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: true,
		saveUninitialized: true,
	})
);

app.use(passport.initialize());
app.use(passport.session());

mongo.connect(process.env.DATABASE, { useUnifiedTopology: true }, (err, client) => {
	if (err) throw new Error(err);
	else {
		const db = client.db('advancednode-fcc');

		auth(app, db);
		routes(app, db);

		app.listen(process.env.PORT || 3000, () => {
			console.log('Listening on port ' + process.env.PORT);
		});
	}
});
