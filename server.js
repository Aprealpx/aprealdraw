require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const session = require('express-session');

const app = express();

const uploadDir = path.join(__dirname, 'uploads');
const worksFile = path.join(__dirname, 'works.html');

app.use(express.urlencoded({ extended: true }));


// Ensure uploads directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

// Simple login page
app.get('/login', (req, res) => {
    res.send(`
        <form method="POST" action="/login">
            <h2>Admin Login</h2>
            <input type="password" name="password" placeholder="Password" required />
            <button type="submit">Login</button>
        </form>
    `);
});

// Handle login
app.post('/login', (req, res) => {
    const { password } = req.body;
    if (password === process.env.ADMIN_PASSWORD) { // change this password!
        req.session.isAdmin = true;
        res.redirect('/admin.html');
    } else {
        res.send('Incorrect password. <a href="/login">Try again</a>');
    }
});

// Protect admin page and serve it only if logged in
app.get('/admin.html', (req, res) => {
    if (req.session.isAdmin) {
        res.sendFile(path.join(__dirname, 'admin.html'));
    } else {
        res.redirect('/login');
    }
});

// Set up multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Handle image upload (only if logged in)
app.post('/upload', (req, res, next) => {
    if (req.session.isAdmin) {
        upload.single('artwork')(req, res, next);
    } else {
        res.status(403).send('Forbidden');
    }
}, (req, res) => {
    if (!req.file) {
        return res.send('No file uploaded.');
    }
   const imgTag = `\n    <img src="uploads/${req.file.filename}" alt="Artwork" style="max-width:300px; margin:10px; transition:transform 0.3s ease; position:relative; z-index:1;" onmouseover="this.style.transform='scale(1.5)'; this.style.zIndex='10'" onmouseout="this.style.transform='scale(1)'; this.style.zIndex='1'">\n`;
    let worksContent = fs.readFileSync(worksFile, 'utf8');
    worksContent = worksContent.replace(/(<\/section>)/i, imgTag + '$1');
    fs.writeFileSync(worksFile, worksContent);

    res.send('Artwork uploaded and added to works.html.<br><a href="works.html">View Works</a>');
});

// Serve static files (after admin protection)
app.use(express.static(__dirname));

// Handle logout
app.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/'); // Redirect to homepage after logout
    });
});



// Start server
app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});

// Handle 404 errors for undefined routes
app.use((req, res, next) => {
    res.status(404).send('404 Not Found');

});
