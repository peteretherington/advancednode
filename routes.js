const bcrypt = require('bcrypt');
const passport = require('passport');

module.exports = (app, db) => {
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
};
