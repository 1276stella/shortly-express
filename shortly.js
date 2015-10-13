var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

// app.use(session({
//   secret: 'keyboard cat',
//   // resave: false,
//   // saveUninitialize: true,
//   cookies: { maxAge: 60000 }
// }));

// app.use(function(req, res, next) {
//   var sess = req.session
//   // console.log(req.session)
//   console.log('first ', req.sessionID)
// req.session.regenerate(function(err){
//   console.log('callback ', req.sessionID)

// });
//   console.log('last ', req.sessionID)

//   if (sess.views) {
//     sess.views++
//     res.setHeader('Content-Type', 'text/html')
//     res.write('<p>views: ' + sess.views + '</p>')
//     res.write('<p>expires in: ' + (sess.cookie.maxAge / 1000) + 's</p>')
//     res.end()
//   } else {
//     sess.views = 1
//     res.end('welcome to the session demo. refresh!')
//   }
// })



app.get('/', 
function(req, res) {
  if (!req.sessionID){
    res.redirect(302, '/login');
  } else {
    res.render('index');
  }
});

app.get('/create', 
function(req, res) {
  if (!req.sessionID){
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

// app.get('/links', 
// function(req, res) {
//   Links.reset().fetch().then(function(links) {
//     res.send(200, links.models);
//   });
// });

app.get('/links', 
function(req, res) {
  
  if (!req.sessionID){
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
  // redirect back to index
  // create a session
  var reqUsername = req.body.username;
  var reqPassword = req.body.password;

  new User({ username: reqUsername }).fetch().then(function(found) {
    if (found) { // already exists, log in
      res.send(200, found.attributes);
    } else { // if not found, create a new User
      var user = new User({
        username: reqUsername,
        password: reqPassword
      });
      user.save().then(function(newUser){
        Users.add(newUser);
        res.send(201);
      });    

      // validate the username
    }
  });  
});

app.post('/login', 
function(req, res) {
  // if their login is correct on our server database 
  if(true){
    // create a session 
    app.use(session({secret: 'special secret thing from their req object'}));
    console.log('ID: ', req.sessionID);
    res.redirect(302, '/'); 
  } else {
  // if fails, display "you failed to log in"
    res.redirect(302, '/login'); 
  }
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
