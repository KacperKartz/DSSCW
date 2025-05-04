const express = require('express');
const { auth } = require('express-openid-connect');
const dotenv = require('dotenv');
const app = express();
var bodyParser = require('body-parser');
const fs = require('fs');
const { Client } = require('pg');
const { title } = require('process');
const { encrypt, decrypt, hashPassword, verifyPassword } = require('./encryption');


require('dotenv').config();
dotenv.config();

https = require('https');
var options = {
    key: fs.readFileSync('./https/privkey.pem'),
    cert: fs.readFileSync('./https/fullchain.pem'),
};

https.createServer(options, app).listen(443, () => {
    console.log(`Server running at https://localhost:443/`);
});








app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


const config = {
    authRequired: false,
    auth0Logout: true,
    baseURL: 'http://localhost:3000',
    clientID: process.env.CLIENT_ID,
    issuerBaseURL: process.env.ISSUER_BASE_URL,
    secret: process.env.SECRET
};
const client = new Client({
    host: process.env.DATABASE_IP,
    user: process.env.DATABASE_USER,
    port: process.env.DATABASE_PORT,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
})

app.use(auth(config));

// Middleware to make the `user` object available for all views
app.use(function (req, res, next) {
    res.locals.user = req.oidc.user;
    next();
});
  

// Landing page
app.get('/', (req, res) => {
    if(req.oidc && req.oidc.isAuthenticated()){
        res.sendFile(__dirname + '/public/html/index.html', (err) => {
            if (err){
                console.log(err);
            }
        })
        return;
    }

    res.sendFile(__dirname + '/public/html/login.html', (err) => {
        if (err){
            console.log(err);
        }
    })
});

// Landing page
app.get('/posts', (req, res) => {
    if (!req.oidc || !req.oidc.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized: Please log in to view posts.' });
    }

    res.sendFile(__dirname + '/public/html/posts.html', (err) => {
        if (err){
            console.log(err);
        }
    })
});

// Landing page
app.get('/my_posts', (req, res) => {
    if (!req.oidc || !req.oidc.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized: Please log in to view your posts.' });
    }


    res.sendFile(__dirname + '/public/html/my_posts.html', (err) => {
        if (err){
            console.log(err);
        }
    })
});

// Temporary api for user info, could be permanent. Saves us storing anything on the user side.
app.get('/api/user', (req, res) => {
    if (req.oidc && req.oidc.isAuthenticated()) {
        res.json(req.oidc.user);
    } else {
        res.status(401).json({ error: 'Not authenticated' });
    }
});

app.post('/query/getPosts', async(req, res) => {

    const result = await client.query('SELECT * FROM blgtbl');
    res.send(result.rows);

})

app.post('/query/getMyPosts', async(req, res) => {
    console.log(req.oidc.user.nickname);
    const user = req.oidc.user.nickname
    const result = await client.query("SELECT * FROM blgtbl WHERE blgauth = " + "'" + user + "'");
    res.send(result.rows);
})
// // Reset login_attempt.json when server restarts
// let login_attempt = {"username" : "null", "password" : "null"};
// let data = JSON.stringify(login_attempt);
// fs.writeFileSync(__dirname + '/public/json/login_attempt.json', data);

// // Store who is currently logged in
// let currentUser = null;

// // Login POST request
// app.post('/',function(req, res){

//     // Get username and password entered from user
//     var username = req.body.username_input;
//     var password = req.body.password_input;

//     // Currently only "username" is a valid username
//     if(username !== "username") {

//         // Update login_attempt with credentials used to log in
//         let login_attempt = {"username" : username, "password" : password};
//         let data = JSON.stringify(login_attempt);
//         fs.writeFileSync(__dirname + '/public/json/login_attempt.json', data);

//         // Redirect back to login page
//         res.sendFile(__dirname + '/public/html/login.html', (err) => {
//             if (err){
//                 console.log(err);
//             }
//         });
//     }

//     // Currently only "password" is a valid password
//     if(password !== "password") {

//         // Update login_attempt with credentials used to log in
//         let login_attempt = {"username" : username, "password" : password};
//         let data = JSON.stringify(login_attempt);
//         fs.writeFileSync(__dirname + '/public/json/login_attempt.json', data);

//         // Redirect back to login page
//         res.sendFile(__dirname + '/public/html/login.html', (err) => {
//             if (err){
//                 console.log(err);
//             }
//         });
//     }

//     // Valid username and password both entered together
//     if(username === "username" && password === "password") {
//         // Update login_attempt with credentials
//         let login_attempt = {"username" : username, "password" : password};
//         let data = JSON.stringify(login_attempt);
//         fs.writeFileSync(__dirname + '/public/json/login_attempt.json', data);

//         // Update current user upon successful login
//         currentUser = req.body.username_input;

//         // Redirect to home page
//         res.sendFile(__dirname + '/public/html/index.html', (err) => {
//             if (err){
//                 console.log(err);
//             }
//         })
//     }
// });

// Make a post POST request
app.post('/makepost', async(req, res) => {

    let curDate = new Date();
    curDate = curDate.toLocaleString("en-GB");
    try {
        if (!req.oidc || !req.oidc.isAuthenticated()) {
            return res.status(401).json({ error: 'Unauthorized: Please log in to make a post.' });
        }

        await client.query(`INSERT INTO blgtbl (usrid, blgtitle, blgcont, blgauth, blgdate) VALUES ('101', '${req.body.title_field}', '${ req.body.content_field}', '${res.locals.user.nickname}', '${curDate}')`);
    }
    catch (err)
    {
        console.error(err);
    };
    res.redirect('/my_posts')


    // // Read in current posts
    // const json = fs.readFileSync(__dirname + '/public/json/posts.json');
    // var posts = JSON.parse(json);

    // // Get the current date

    // // Find post with the highest ID
    // let maxId = 0;
    // for (let i = 0; i < posts.length; i++) {
    //     if (posts[i].postId > maxId) {
    //         maxId = posts[i].postId;
    //     }
    // }

    // // Initialise ID for a new post
    // let newId = 0;

    // // If postId is empty, user is making a new post
    // if(req.body.postId == "") {
    //     newId = maxId + 1;
    // } else { // If postID != empty, user is editing a post
    //     newId = req.body.postId;

    //     // Find post with the matching ID, delete it from posts so user can submit their new version
    //     let index = posts.findIndex(item => item.postId == newId);
    //     posts.splice(index, 1);
    // }

    // // Add post to posts.json
    // posts.push({"username": res.locals.user.nickname, "timestamp": curDate, "postId": newId, "title": req.body.title_field, "content": req.body.content_field});
    // fs.writeFileSync(__dirname + '/public/json/posts.json', JSON.stringify(posts));

    // // Redirect back to my_posts.html
    // res.sendFile(__dirname + "/public/html/my_posts.html");
 });

 // Delete a post POST request
 app.post('/deletepost', (req, res) => {

    if (!req.oidc || !req.oidc.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized: Please log in to delete a post.' });
    }

    // Read in current posts
    const json = fs.readFileSync(__dirname + '/public/json/posts.json');
    var posts = JSON.parse(json);

    // Find post with matching ID and delete it
    let index = posts.findIndex(item => item.postId == req.body.postId);
    posts.splice(index, 1);

    // Update posts.json
    fs.writeFileSync(__dirname + '/public/json/posts.json', JSON.stringify(posts));

    res.sendFile(__dirname + "/public/html/my_posts.html");
 });

app.listen(port, () => {
    console.log(`My app listening on port ${port}! ${config.baseURL}`)

    client.connect().then(console.log('Database Connected'));
});