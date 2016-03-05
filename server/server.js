var express = require('express');
var bodyParser = require('body-parser');
var app = express();
// For github auth and sessions
var passport = require('passport');
var session = require('express-session');
var methodOverride = require('method-override');
var GitHubStrategy = require('passport-github2').Strategy;
var partials = require('express-partials');

// coinbase
var Client = require('coinbase').Client;

var db = require('./db/database');
var config = require('./config');

var stripe = require('stripe')('sk_test_5KBnPsmTc3iJUk7H4ZtOU3Jj');

var Issues = require('./models/issues');
Issues = new Issues();

var Repos = require('./models/repos');
Repos = new Repos();

var Users = require('./models/users');
Users = new Users();

var Bounties = require('./models/bounties');
Bounties = new Bounties();

// configure express
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/../client'));

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

var port = 3000;

app.route('/api')
  .get(function(req, res) {
    res.send('Hello World');
  });

app.route('/api/issues')
  .get(function(req, res) {
    Issues.getIssues()
    .then((results) => res.send(results))
    .catch((err) => {
      console.log(err);
      res.statusCode = 501;
      res.send('Unknown Server Error');
    });
  });

app.route('/api/bounties')
  .get(function(req, res) {
    console.log('bounties call');
    Issues.getBounties()
    .then((results) => res.send(results))
    .catch((err) => {
      console.log(err);
      res.statusCode = 501;
      res.send('Unknown Server Error');
    });
  });

app.route('/api/repos')
  .get(function(req, res) {
    Repos.getRepos()
    .then((results) => res.send(results))
    .catch(() => {
      res.statusCode = 501;
      res.send('Unknown Server Error');
    });
  });

// for github auth
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

passport.use(new GitHubStrategy({
  clientID: config.GITHUB_CLIENT,
  clientSecret: config.GITHUB_SECRET,
  callbackURL: 'http://107.170.222.135:3000/auth/github/callback'
},
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      Users.doesUserExist(profile.id).then(function(data) {
        if (data.length === 0) {
          var userData = {
            id: profile.id,
            username: profile.username,
            name: profile.displayName,
            email: profile.emails[0].value
          };
          Users.createUser(userData)
          .then(() => {
            console.log('Saved new user');
          })
          .catch((err) => {
            console.log(err);
          });
        } else {
          console.log('USER ALREADY EXISTS');
        }
      }).catch(function(err) {
        if (err) {
          console.log(err);
        }
      });
      // To keep the example simple, the user's GitHub profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the GitHub account with a user record in your database,
      // and return that user instead.
      // console.log(profile);
      return done(null, profile);
    });
  }
));

app.use(partials());
app.use(methodOverride());
app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
// Initialize Passport!  Also use passport.session() middleware, to support
// persistent login sessions
app.use(passport.initialize());
app.use(passport.session());

// GET /auth/github
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in GitHub authentication will involve redirecting
//   the user to github.com.  After authorization, GitHub will redirect the user
//   back to this application at /auth/github/callback
app.get('/gitHubRedirect',
  passport.authenticate('github', { scope: [ 'user:email' ] }),
  function(req, res) {
    // The request will be redirected to GitHub for authentication, so this
    // function will not be called.
  });

// GET /auth/github/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function will be called,
//   which, in this example, will redirect the user to the home page.
app.get('/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/logout', function(req, res) {
  req.logout(); // passport
  res.redirect('/');
});

var ensureAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
};

app.get('/fetchUserInfo', function(req, res) {
  // console.log('on cookie: ', req.session);
  res.json(req.session.passport.user);
});

app.route('/stripeCC')
  .post(function(req, res) {
    var stripeToken = req.body.stripeToken;
    var githubId = req.body.githubId;
    var org_name = req.body.org_name;
    var repo_name = req.body.repo_name;
    var issueNumber = req.body.number;
    var bountyPrice = Math.round(req.body.bountyPrice);
    stripe.customers.create({
      source: stripeToken,
    }).then((customer) => {
      Users.saveCCPaymentId(customer.id, githubId)
      .then(() => {
        Bounties.saveIssue(githubId, org_name, repo_name, issueNumber, bountyPrice)
        .then((bounty) => {
          console.log('succesfully added bounty: ', bounty);
          Bounties.updateIssue(bounty[0])
          .then(() => {
            console.log('succesfully updated bounty');
            res.status(200).send('completed cycle with creating bounty;');
          })
          .catch((err) => {
            console.log('Error updating bounty: ', err);
          });
        })
        .catch((err) => {
          console.log('Error adding bounty: ', err);
        });
      }) // should update this record immediately
      .catch(() => {
        res.status(501).send('Error adding payment data');
      });
    })
    .catch(() => {
      res.status(501).send('Unknown Server Error');
    });
  });

app.route('/stripeB')
  .post(function(req, res) {
    var githubId = req.body.githubId;
    console.log('req.body: ', req.body);
    stripe.recipients.create({
      name: req.body.name,
      type: req.body.type,
      bank_account: req.body.bank_account,
      email: req.body.email
    })
    .then((recipient) => {
      console.log('recipient', recipient);
      Users.saveBankRecipientId(recipient.name, recipient.type, recipient.id, recipient.email, githubId)
      .then(() => {
        console.log('saved bank account recipient ID to DB');
      })
      .catch(() => {
        res.status(501).send('Unknown Server Error');
      });
    })
    .catch((err) => {
      console.log('error');
      res.status(501).send('Unknown Server Error');
    });
  });

app.route('/bitcoin')
  .post(function(req, res) {
    var githubId = req.body.githubId;
    var org_name = req.body.org_name;
    var repo_name = req.body.repo_name;
    var issueNumber = req.body.number;
    var bitcoin_amount = req.body.bitcoin_amount;
    // Bounties.saveBitcoin(req.body.bitCoinAmount, req.body.org_name, req.body.repo_name, req.body.number, req.body.githubId)
    Bounties.saveIssue(githubId, org_name, repo_name, issueNumber, null, bitcoin_amount)
    .then((bounty) => {
      console.log('succesfully added bounty: ', bounty);
      Bounties.updateIssue(bounty[0])
      .then(() => {
        console.log('succesfully updated bounty');
      })
      .catch((err) => {
        console.log('Error updating bounty: ', err);
      });
    })
    .catch((err) => {
      console.log('Error adding bounty: ', err);
      res.status(501).send('Error adding bounty');
    });
  });

  // coinbase authenticate our wallet
var client = new Client({
  'apiKey': config.COINBASE_API_KEY,
  'apiSecret': config.COINBASE_API_SECRET,
  'baseApiUri': 'https://api.coinbase.com/v2/',
  'tokenUri': 'https://api.coinbase.com/oauth/token'
});

  // Create a wallet (only happens once)
  // client.createAccount({'name': 'mongooseWallet'}, function(err, acct) {
  //   console.log(acct.name + ': ' + acct.balance.amount + ' ' + acct.balance.currency);
  // });

  // list the wallets and transactions in our account
client.getAccounts({}, function(err, accounts) {
  if (err) { 
    console.log(err); 
  } else {
    accounts.forEach(function(acct) {
      console.log(acct.name + ': ' + acct.balance.amount + ' ' + acct.balance.currency, acct.id);
      acct.getTransactions(null, function(err, txns) {
        if (txns) {
          txns.forEach(function(txn) {
            console.log('txn: ' + txn.id);
          });
        }
      });
    });
  }
});

// 53f4b4cd-8a6d-58a1-8b94-d318a216d209
app.get('/reqNewAddress', function(req, res) {

  client.getAccount('80113505-bb59-5d0d-88b0-c6bd2c6d4a1a', function(err, account) {
    if (err) {
      console.log('get acct err', err);
    } else {
      account.createAddress(null, function(err, addr) {
        if (err) {
          console.log('create address err', err);
        } else {
          console.log('address:', addr.address);
          res.json(addr.address);
        }
      });
    }
  });
});

app.post('/addToQueue', function(req, res) {
  var issue_id = req.body.issue_id;
  var user_id = req.session.passport.user.id;
  Users.addToQueue(issue_id, user_id)
  .then(() => {
    console.log('Successfully added bounty to queue');
    res.status(200).send('Success');
  })
  .catch((err) => {
    console.log('Error adding bounty to queue: ', err);
    res.status(501).send('Error adding bounty');
  });
});

app.get('/fetchUserIssues', function(req, res) {
  var user_id = req.session.passport.user.id;
  Issues.getUserIssues(user_id)
  .then((results) => {
    console.log('results: ', results);
    res.send(results);
  })
  .catch((err) => {
    console.log(err);
    res.statusCode = 501;
    res.send('Unknown Server Error');
  });
});

app.post('/submitPull', function(req, res) {
  console.log('pull', req.body);
  // Create handler to save it to db
  res.json();
});

// Payout to a bitcoin bountyhunter
app.post('/payoutBitcoin', function(req, res) {
  console.log('req.body.amount', req.body.amount)
  client.getAccount('80113505-bb59-5d0d-88b0-c6bd2c6d4a1a', function(err, account) {
    account.sendMoney({'to': req.body.address,
    'amount': req.body.amount / 100000000 ,
    'currency': 'BTC'}, function(err, tx) {
      if (err) {
        console.log(err);
      } else {
        // remove bounty from DB
        console.log(tx);
      }
    });
  });
});


console.log(`server running on port ${port}`);
// start listening to requests on port 3000
app.listen(port);

// export our app for testing and flexibility, required by index.js
module.exports = app;
