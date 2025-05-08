const express = require('express');
const { auth } = require('express-openid-connect');
const dotenv = require('dotenv');
const app = express();
const { Client } = require('pg');
const { title } = require('process');
const fs = require('fs');
const port = 3000;
const rateLimit = require('express-rate-limit');
const { encrypt, decrypt, hashPassword, verifyPassword } = require('./encryption');

require('dotenv').config();


dotenv.config()
var bodyParser = require('body-parser');
app.use(express.static(__dirname + '/public'));
const session = require('express-session');
port = 443;
https = require('https');
var options = {
    key: fs.readFileSync('./https/privkey.pem'),
    cert: fs.readFileSync('./https/fullchain.pem'),
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


const config = {
    authRequired: false,
    auth0Logout: true,
    baseURL: 'https://localhost:443',
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

// app.use(auth(config));
// // Middleware to make the `user` object available for all views
// app.use(function (req, res, next) {
//     res.locals.user = req.oidc.user;
//     next();
// });

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {maxAge: 60 * 60 * 1000}
}));


const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: 'Too many login attempts. Try again later.' }
});


// Landing page
// app.get('/', (req, res) => {
//     if(req.oidc && req.oidc.isAuthenticated()){
//         res.sendFile(__dirname + '/public/html/index.html', (err) => {
//             if (err){
//                 console.log(err);
//             }
//         })
//         return;
//     }
app.get('/', (req, res) => {
    if (req.session.user && req.session.user.email && req.session.user.authenticated === true) { /// Checks if theres a session.user and if there is an email (which can only be set if logged in)
        return res.sendFile(__dirname + '/public/html/index.html');
    }
    
    res.sendFile(__dirname + '/public/html/login.html', (err) => {
        if (err){
            console.log(err);
        }
    })
});

app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/public/html/register.html', (err) => {
        if (err){
            console.log(err);
        }
    })
});

/// Server side verification
const mfaCodeStore = {}; // key: email, value: code


// Grabs the email and password put in.
// Checks if its all good and sends back a message
// Theres a hardcoded email and password for testing purposes (maybe for the demo too?!?!?)
// Sets the session.user email to carry it through the rest of the app

app.get('/logout', async(req,res) => 
    {

        req.session.destroy(err => {
            if (err){
                console.log(err);
                return res.status(500).send("error logging out");
            }
            res.clearCookie('connect.sid');
            res.redirect('/');
        });
    }
)

app.post('/validateLogin',loginLimiter, async (req, res) => {
    const {email, password} = req.body;
    console.log(email, password);
    // Forces entered email to lowercase
    let emailLC = email.toLowerCase();

    // Makes sure all fields are filled
    if(!email || !password){
        return res.status(400).json({error: 'Please enter both email and password'});
    }
    // Makes sure an email is entered
    if(!email.includes('@') || !email.includes('.')){
        return res.status(400).json({error: 'Incorrect credentials'});
    }
    
    const query = `SELECT * FROM usrtbl WHERE usremail = $1`;
    client.query(query, [email], (err, result) => {

        if(err || !result.rows.length){
            // Dummy hash to simulate going through the verification || Dont think this does anything rn
            
            const dummyHash ='$2b$10$CwTycUXWue0Thq9StjUM0uJ8p6u7rQ8qUZFvkyFJe/39jwS/BI6iC';
            verifyPassword(password, dummyHash, dummyHash);
            return res.status(401).json({error: 'Incorrect credentials'});
        }
            /// Below are the actual checks
            
            const user = result.rows[0];
            // const isPasswordValid = verifyPassword(password, user.salt, user.hash);
            console.log("username: " + user.usrnme);
            console.log("password: " + user.usrpass);

            //this is a temp bypass for testing || While the encryption is not set up
            var isPasswordValid = false;
            if (password === user.usrpass) {isPasswordValid = true;}

            if(!isPasswordValid){
                return res.status(401).json({error: 'Incorrect credentials'});
            }else{
                const mfaCode = generateRandomSixDigitCode();
                const expirationTime = Date.now() + 1 * 60 * 1000;
                console.log(`expires at: ${new Date(expirationTime).toLocaleString()}`);
                mfaCodeStore[email] =  { code: mfaCode, expiresAt: expirationTime };
                console.log(mfaCode);
                req.session.user = {
                    username: user.usrnme,
                    email: emailLC,
                    authenticated: false
                };
                // console.log("this is the req.session.user "+ req.session.user.email)
                return res.status(200).json({message: 'Login successful'});
            }
        });
    
    /// For the sake of testing || Hard coded version



        // if(email === "username@test.com" && password === "password"){
        //     const mfaCode = generateRandomSixDigitCode();
        //     mfaCodeStore[email] = mfaCode;
        //     console.log(mfaCodeStore);
        //     console.log(mfaCode);

        //     req.session.user = {
        //         email: email,
        //         authenticated: false
        //     };
            
        //     return res.status(200).json({message: 'Login successful', email});;
        // }
        
        //// use the stuff below for when we have database integration        
        
        
        
    });
app.post('/mfa', async (req, res) => {

    if (!req.session.user || !req.session.user.email) {
        return res.status(401).json({ error: 'Session expired or unauthorized' });
    }

    
    const { mfaUserCode } = req.body;
    const email = req.session.user.email;
    const mfaEntry = mfaCodeStore[email];

    if (!email || !mfaUserCode) {
        return res.status(400).json({ error: 'Missing email or MFA code' });
    }

    if (!mfaEntry) {
        return res.status(401).json({ error: 'MFA code expired or not found' });
    }
    console.log(mfaCodeStore);
    console.log(email, mfaUserCode);

    const { code: expectedCode, expiresAt } = mfaEntry;

    if (Date.now() > expiresAt) {
        delete mfaCodeStore[email];
        return res.status(401).json({ error: 'MFA code expired' });
    }

    if(expectedCode && mfaUserCode === expectedCode){
        delete mfaCodeStore[email];
        req.session.user.authenticated = true;
        return res.status(200).json({ message: 'MFA successful', username: req.session.user.username }); 
        
    }else{
        return res.status(401).json({error: 'Incorrect MFA code'});
    }

})
    
function generateRandomSixDigitCode() {

    return Math.floor(100000 + Math.random() * 900000).toString();
}


// MFA page route
app.get('/mfaPage', (req, res) => {
    if(req.session.user && req.session.user.email){
        res.sendFile(__dirname + '/public/html/mfa.html', (err) => {
            if (err){
                console.log(err);
            }
        })
    }else{
        res.redirect('/')

    }
})

app.post('/registerSubmit',  async (req, res) => {

    const {username, email, password} = req.body;
    // console.log(username, email, password); // This is for testing
    // sets the email
    let emailLC = email.toLowerCase();

    // These are not being used rn
    // const hashedPassword = hashPassword(password);
    // const encryptedPassword = encrypt(hashedPassword.hash);
    // const encryptedSalt = encrypt(hashedPassword.salt);
    // Basic checks to see if all required data has been provided
    try{
        if(!email || !password){
            return res.status(400).json({error: 'Please enter both email and password'});
        }
    
        if(!email.includes('@') || !email.includes('.')){
            return res.status(400).json({error: 'Please enter a suitable email'});
        }
        

        if(password.length < 8){
            return res.status(400).json({error: 'Password must be at least 8 characters long'});
        }

        // Makes sure that this user does not already exist
        const checkQuery = `SELECT * FROM usrtbl WHERE usremail = '${emailLC}'`;
        const existCheck = await client.query(checkQuery);

        let taken = false;
		for (i = 0; i < existCheck.rows.length; i++) {
			if (existCheck.rows[i].usremail === emailLC) { taken = true; console.log("User Exists"); break; }
		}

        if (!taken)
        {
            // Adds the new user to the database
            const createUsr = (`INSERT INTO usrtbl (usrnme, usrpass, usremail) VALUES ('${username}','${password}','${emailLC}')`)
            client.query(createUsr);
            return res.status(200).json({message: 'User Registered'})
        }
        else
        {
            return res.status(400).json({error: 'User already exists'}) // This is a bad message
        }

    } catch (err) {
        console.log(err);
    };

    res.redirect('/')


})

// MFA validation
// Just grabs the users email and mfa code
// Checks if the code matches the expected code which they got through email (aka console)
// If it does, sets authenticated to true and in frontend they get redirected (yay)





// Landing page
app.get('/posts', (req, res) => {
    if (!req.session.user || req.session.user.isAuthenticated == false) {
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
    if (!req.session.user || req.session.user.isAuthenticated == false) {
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
    if (req.session.user && req.session.user.authenticated === true) {
        return res.json({username:req.session.user.username});
    }
    res.status(401).json({ error: 'Not authenticated' });
});


app.post('/query/getPosts', async(req, res) => {

    const result = await client.query('SELECT * FROM blgtbl');
    res.send(result.rows);

})

app.post('/query/getMyPosts', async(req, res) => {
    // console.log(req.oidc.user.nickname);
    const user = req.session.user.username;
    const result = await client.query("SELECT * FROM blgtbl WHERE blgauth = $1", [user]);
    res.send(result.rows);
})
// // Reset login_attempt.json when server restarts
let login_attempt = {"username" : "null", "password" : "null"};
let data = JSON.stringify(login_attempt);
fs.writeFileSync(__dirname + '/public/json/login_attempt.json', data);

// Store who is currently logged in
let currentUser = null;

// Login POST request
// app.post('/',function(req, res){

//     // Get username and password entered from user
//     var username = req.body.username_input;
//     var password = req.body.password_input;
//     console.log(username, password);

//     // Currently only "username" is a valid username
//     if(username !== "username@test.com") {

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
//         isAuthenticated = true;

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
        if (!req.session.user || req.session.user.isAuthenticated == false) {
            return res.status(401).json({ error: 'Unauthorized: Please log in to make a post.' });
        }

        await client.query(`INSERT INTO blgtbl (usrid, blgtitle, blgcont, blgauth, blgdate) VALUES ('101', '${req.body.title_field}', '${ req.body.content_field}', '${res.session.user.username}', '${curDate}')`);
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

    if (!req.session.user || req.session.user.isAuthenticated == false) {
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

 https.createServer(options, app).listen(443, () => {
    console.log(`Server running at https://localhost:443/`);
    client.connect().then(() => {
        console.log('db: Database Connected');
        
        // Create tables here if they don't exist (bigtbl didnt exist for me)
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS blgtbl (
                id SERIAL PRIMARY KEY,
                usrid INT,
                blgtitle VARCHAR(255),
                blgcont TEXT,
                blgauth VARCHAR(255),
                blgdate TIMESTAMP
            );
        `;
        
        client.query(createTableQuery, (err, res) => {
            if (err) {
                console.error('db: bigtbl not available, error creating table', err);
            } else {
                console.log('db: bigtbl available');
            }
        });
    }).catch((err) => {
        console.error('db: Error connecting to the database, is it online? Error:', err);
    });
});
