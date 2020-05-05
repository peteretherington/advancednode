const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local');
const ObjectID = require('mongodb').ObjectID;
const passport = require('passport');

module.exports = (app, db) => {
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
};
