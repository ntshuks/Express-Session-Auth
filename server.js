const express = require('express');
const app = express();
require('dotenv').config();
const bodyParser= require('body-parser');
const PORT = process.env.PORT || 5002;
const ejs = require('ejs');
const bcrypt = require('bcrypt');
const saltrounds = 10;
const mongoose = require('mongoose');
// Bring in user model
const User = require('./db.js');

app.set('view engine', 'ejs');

// Static file folder
app.use(express.static('public'));



//Body Parser to allow form data to be accessed
app.use(bodyParser.urlencoded({ extended: false }));

// DB connection
mongoose.connect(process.env.DB_URI)
.then(() => console.log('DB connected...'))
.catch ((err) => console.log(err));

// Routes
app.get('/', (req,res) => {
    res.render('index');
});

app.get('/register', (req,res) => {
    res.render('register');
});

app.get('/login', (req,res) => {
    res.render('login');
})

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
            res.render('register', {msg})
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

// function findUser(email) {
//     User.findOne({email: email})
//     .then ((user) => {
//         if(user) {}
//     })
//     console.log('user from function');
//     console.log(user);
//     return user;
//    } catch (error) {
//     // here assuming only error is that user is not found
//     const user = '';
//     return user;
//    }
// }

app.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`);
});