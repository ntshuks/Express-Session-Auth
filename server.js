/*
This version will use express-sessions to manage user login status
*/

const express = require('express');
const app = express();
const session = require('express-session');
require('dotenv').config();
const bodyParser= require('body-parser');
const PORT = process.env.PORT || 5002;
const ejs = require('ejs');
const bcrypt = require('bcrypt');
const saltrounds = 10;
const User = require('./db.js');
const mongoose = require('mongoose');
const MongoDBStore = require('connect-mongodb-session')(session);
const store = new MongoDBStore({
    uri: process.env.STORE_URI,
    collection: 'mySessions'
});

console.log(process.env.STORE_URI);

store.on('error', (error) => {
    console.log(error);
});

app.set('view engine', 'ejs');

// Static file folder
app.use(express.static('public'));

//Body Parser to allow form data to be accessed
app.use(bodyParser.urlencoded({ extended: false }));

// Express Session middleware
app.use(session({
    secret: process.env.SECRET,
    name: 'UniqueSessionId',
    resave: false,
    store: store,
    saveUninitialized: false,
}));

// DB connection
mongoose.connect(process.env.DB_URI)
.then(() => console.log('DB connected...'))
.catch ((err) => console.log(err));

// Routes
app.get('/', (req,res) => {
    res.render('index');
});

app.get('/register', (req,res) => {
    if(req.session.loggedIn) {
        msg = "You are already logged in. Log out if you want to register with new email";
        res.render('secret', {msg});
    } else {
    res.render('register');
    }
});

app.get('/login', (req,res) => {
    if(req.session.loggedIn) {
        msg = "You are already logged in";
        res.render('secret', {msg});
    } else {
    res.render('login');
    }
});

app.get('/secret', (req,res) => {
    let msg;
    if(!req.session.loggedIn) {
        msg = "You need to be logged in to visit that page";
        res.render('login', {msg});
    } else {
        msg = "You are now in the secret area";
        res.render('secret', {msg});
    }
});

app.get('/logout', (req,res) => {
   // drop them onto starter page
   let msg;
   if(req.session.loggedIn) {
    req.session.destroy((err) =>{
      console.log(err);
      });
    msg = "You have now logged out";
    res.render('index', {msg});
   } else {
    // Same action, without the message since use wasn't logged in
    res.render('index');
   }
});

app.post('/register', (req,res) => {
    const email = req.body.email;
    const plainPassword = req.body.password;
    let msg;
    //check to see if emial already registered
    User.findOne({email: email})
    .then((user) => {
        if (user) {
            console.log(user);
            msg = `Email: ${email} already registered`;
            res.render('register', {msg});
        } else {
        //  create new user
        bcrypt.hash(plainPassword, saltrounds, (err,hash) => {
            if(err) throw err;
        User.create({ email: email, password: hash })
        .then(() => console.log("User created"))
        .then( (msg = "You are now registered. Please login"))
        .then(res.render('login', {msg}))
        .catch ((err) => console.log(err));    
           })
        }
    })
    .catch((err) => console.log(err)) 
     }); 

app.post('/login', (req,res) => {
    const email = req.body.email;
    const plainPassword = req.body.password;
    let msg;
    //check to see if emial is registered
    User.findOne({email: email})
        .then((user) => {
            if (!user) {
                console.log(user);
              //  msg = `Email: ${email} is not registered`;
                msg = 'Login Failed - incorrect credentials';
                res.render('login', {msg});
            } else{
            // compare passwords
            bcrypt.compare(plainPassword,user.password, (err, result) =>{
            if (err) throw err;
            console.log(`Passwords match? ${result}`);
            if (result) {
                req.session.loggedIn=true;
                console.log(req.session.loggedIn);
                msg = `User with email: ${email} successfully logged In`;
                res.redirect('/secret');
            } else {
              //  msg = "passwords don not match";
                msg = 'Login Failed - incorrect credentials';
                res.render('login', {msg});
            }
        })
        }      
        })
        .catch ((err) => console.log(err))
    });

app.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`);
});