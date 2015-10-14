var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bcrypt = require('bcrypt-nodejs');

// var cookieParser = require('cookie-parser');
// do we need to npm cookie parser?
var bodyParser = require('body-parser');
var session = require('express-session');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();
var currentLoggedInSessions = {};

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));

// trying app.use(sessions) up here?
app.use(session({resave: true, saveUninitialized: true, secret: 'SOMERANDOMSECRETHERE', cookie: { maxAge: 60000 }}))

app.use(express.static(__dirname + '/public'));



app.get('/', 
function(req, res) {
  if (!(req.sessionID in currentLoggedInSessions)){
    res.redirect(302, '/login');
    // console.log('sessions', Object.keys(currentLoggedInSessions));
    // console.log('currentSession', req.sessionID);    
    console.log('tried to load "/"" ');    
  } else {
    res.render('index');
    // show the currentlyLoggedInSessions Obj
    // show the actual sessionID of the user
  }
});

app.get('/create', 
function(req, res) {
  if (!(req.sessionID in currentLoggedInSessions)){
    res.redirect(302, '/login');
  } else {
    res.render('index');
  }

});

app.get('/login', 
function(req, res) {
  res.render('login');
});

app.get('/signup', 
function(req, res) {
  res.render('signup');
});


app.get('/links', 
function(req, res) {  
  if (!(req.sessionID in currentLoggedInSessions)){
    res.redirect(302, '/login');
  } else {
    Links.reset().fetch().then(function(links) {
      res.send(200, links.models);
    });
  }

});

app.get('/users', 
function(req, res) {
  Users.reset().fetch().then(function(users) {
    res.send(200, users.models);
  });
});


app.get('/logout', 
function(req, res) {
  // remove their old sessionID from our global currentLoggedInSessions
  // destory their session
  delete currentLoggedInSessions[req.sessionID]; 
  req.session.destory(function(err){
    console.log('server recevied logout');
    res.redirect(302, '/login')
  });
});


app.post('/links', 
function(req, res) {



  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.post('/signup', 
function(req, res) {
  // put username and pw to db
  // redirect back login
  var reqUsername = req.body.username;
  var reqPassword = req.body.password;

  new User({ username: reqUsername }).fetch().then(function(found) {
    if (found) { // already exists, log in
      res.send(200, found.attributes);
    } else { // if not found, create a new User 
      bcrypt.hash(reqPassword, null, null, function(err, hash) {
        Users.create({
          username: reqUsername,
          password: hash
        }).then(function(newUser){
          res.redirect(302, '/');
        });  
      });
    }
  });  
});

app.post('/login', 
function(req, res) {
  // if their login is correct on our server database 

  var reqUsername = req.body.username;
  var reqPassword = req.body.password; 

  new User({ username: reqUsername}).fetch().then(function(found) {
    if (found) { // already exists, log in
      bcrypt.compare(req.body.password, found.attributes.password, function(err, result){
       if (result) {
        // if these match, then they have the right password?
        console.log("success, user password matches")
        console.log('Old ID: ', req.sessionID);
        req.session.regenerate(function(err){
          currentLoggedInSessions[req.sessionID] = new Date();
          console.log('New ID: ', req.sessionID);
          res.redirect(302, '/');
        });
        // res.redirect('/');
      } else { 
        console.log("fail, no password match");
        res.redirect(302, '/login');
      }
      });
    } else {
      console.log("fail, no such user in database");
      res.redirect(302, '/login');
    }
  });  

});



/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
