'use strict';

if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const bodyParser = require('body-parser');
const express = require('express');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const LocalStrategy = require('passport-local');
const mongo = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const passport = require('passport');
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

		passport.serializeUser((user, done) => {
			done(null, user._id);
		});

		passport.deserializeUser((id, done) => {
			db.collection('users').findOne({ _id: new ObjectID(id) }, (err, doc) => {
				done(null, doc);
			});
		});

		passport.use(
			new LocalStrategy(function (username, password, done) {
				db.collection('users').findOne({ username }, function (err, user) {
					console.log(`User ${username} tried to login`);
					if (err) return done(err);
					if (!user) return done(null, false);
					if (password !== user.password) return done(null, false);
					return done(null, user);
				});
			})
		);

		app.route('/').get((req, res) => {
			res.render(process.cwd() + '/views/pug/index', { title: 'Hello', message: 'Please login', showLogin: true });
		});

		app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), function (res, req) {
			res.redirect('/profile');
		});

		app.route('/profile').get(function (req, res) {
			res.render(process.cwd() + '/views/pug/profile');
		});

		app.listen(process.env.PORT || 3000, () => {
			console.log('Listening on port ' + process.env.PORT);
		});
	}
});
