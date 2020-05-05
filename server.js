'use strict';

if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
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
					if (!user) return done(null, false, { message: 'Incorrect username.' });
					if (!bcrypt.compareSync(password, user.password)) {
						return done(null, false, { message: 'Incorrect password.' });
					}
					return done(null, user);
				});
			})
		);

		function ensureAuthenticated(req, res, next) {
			if (req.isAuthenticated()) return next();
			res.redirect('/');
		}

		app.route('/').get((req, res) => {
			res.render(process.cwd() + '/views/pug/index', {
				title: 'Home page',
				message: 'login',
				showLogin: true,
				showRegistration: true,
			});
		});

		app.route('/register').post(
			(req, res, next) => {
				db.collection('users').findOne({ username: req.body.username }, (err, user) => {
					if (err) {
						next(err);
					} else if (user) {
						res.redirect('/');
					} else {
						db.collection('users').insertOne(
							{
								username: req.body.username,
								password: bcrypt.hashSync(req.body.password, 12),
							},
							(err, doc) => {
								if (err) {
									res.redirect('/');
								} else {
									next(null, user);
								}
							}
						);
					}
				});
			},
			passport.authenticate('local', { failureRedirect: '/' }),
			(req, res) => {
				res.redirect('/profile');
			}
		);

		app.route('/login').post(passport.authenticate('local', { successRedirect: '/profile', failureRedirect: '/' }));

		app.get('/logout', function (req, res) {
			req.logout();
			res.redirect('/');
		});

		app.route('/profile').get(ensureAuthenticated, function (req, res) {
			res.render(process.cwd() + '/views/pug/profile', { username: req.user.username });
		});

		app.use((req, res) => {
			res.status(404).type('text').send('Not Found');
		});

		app.listen(process.env.PORT || 3000, () => {
			console.log('Listening on port ' + process.env.PORT);
		});
	}
});
