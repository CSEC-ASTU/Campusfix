const express = require('express');
const useragent = require('express-useragent');
const session = require('express-session');

const path = require('path');
const nodemailer = require('nodemailer');
const multer = require('multer');
const axios = require('axios');
const dotenv = require('dotenv')
dotenv.config();
const passport = require("./auth");  // <-- import auth.js

const app = express();
const PORT = process.env.PORT || 3000;

const emailaddress = process.env.EMAIL_USER;
  const transporter = nodemailer.createTransport({
     host: "mail.getCampusFix.com",
  port: 587,
  secure: false,
    auth: {
      user: emailaddress, //  email address
      pass: process.env.EMAIL_PASS
    }
  });

 


const bcrypt = require('bcrypt');
const db = require('./db'); // this is db.js


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(useragent.express());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use(express.static('public'));
app.use('/store', express.static('store'));



const http = require('http');
const server = http.createServer(app);

const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000", // Change to your frontend URL if different
    methods: ["GET", "POST"]
  }
});





app.use(session({
  secret: process.env.SESSION_SECRET || "CampusFix_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set true if HTTPS
}));

app.use(passport.initialize());
app.use(passport.session());







// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});


app.get('/how-to-use', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/Howtouse.html'));
});

app.get('/ai-support', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/ai-support.html'));
});
app.get('/adminLogin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/adminlogin.html'));
});

app.get('/studlogin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/studentlogin.html'));
});




function isStudentLoggedIn(req, res, next) {
  if (req.session && req.session.studentId) {
    // Student is logged in, allow access
    next();
  } else {
    // Not logged in, redirect to login
    res.redirect('/StudLogin'); // or your login page route
  }
}




app.get('/studentdashboard', isStudentLoggedIn, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/studentdashboard.html'));
});




// Get reports for logged-in student
app.get('/myReports', (req, res) => {
    if (!req.session.studentId) {
        return res.json({ success: false, message: 'Unauthorized' });
    }

    const sql = `
        SELECT id, issueType, location, description, photo, status, created_at
        FROM issues
        WHERE studentId = ?
        ORDER BY created_at DESC
    `;

    db.query(sql, [req.session.studentId], (err, results) => {
        if (err) {
            console.error(err);
            return res.json({ success: false, message: 'Server error' });
        }

        res.json({ success: true, reports: results });
    });
});


// Confirm an issue as solved
app.post('/confirmIssue', (req, res) => {
    const { issueId } = req.body;

    if (!req.session.studentId) {
        return res.json({ success: false, message: 'Unauthorized' });
    }

    const sql = `
        UPDATE issues
        SET status = 'Completed'
        WHERE id = ? AND studentId = ?
    `;

    db.query(sql, [issueId, req.session.studentId], (err, result) => {
        if (err) {
            console.error(err);
            return res.json({ success: false, message: 'Server error' });
        }
        res.json({ success: true, message: 'Issue confirmed as completed!' });
    });
});


app.get('/getStudentInfo', (req, res) => {
    if (!req.session.studentId || !req.session.studentName) {
        return res.json({ success: false, message: 'Unauthorized' });
    }

    res.json({
        success: true,
        studentName: req.session.studentName
    });
});










// Register for Admin(Head of Dormitory)









app.post('/adminRegister', async (req, res) => {
    const { first_name, last_name, username, password, token } = req.body;

    // Check required fields
    if (!first_name || !last_name || !username || !password || !token) {
        return res.json({ success: false, message: 'All fields are required.' });
    }

    // Check security token
    if (token !== '1234') {
        return res.json({ success: false, message: 'Invalid security token.' });
    }

    // Check if admin already exists
    db.query('SELECT * FROM admins WHERE username = ?', [username], async (err, results) => {
        if (err) return res.json({ success: false, message: 'Server error.' });

        if (results.length > 0) {
            return res.json({ success: false, message: 'Admin already exists.' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert admin
        db.query(
            'INSERT INTO admins (first_name, last_name, username, password) VALUES (?, ?, ?, ?)',
            [first_name, last_name, username, hashedPassword],
            (err) => {
                if (err) return res.json({ success: false, message: 'Server error.' });

                return res.json({ success: true, message: 'Admin registered successfully!' });
            }
        );
    });
});

// ======================
// ADMIN LOGIN
// ======================
app.post('/adminLogin', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.json({ success: false, message: 'All fields are required.' });
    }

    db.query('SELECT * FROM admins WHERE username = ?', [username], async (err, results) => {
        if (err) return res.json({ success: false, message: 'Server error.' });
        if (results.length === 0) return res.json({ success: false, message: 'Invalid username or password.' });

        const admin = results[0];
        const match = await bcrypt.compare(password, admin.password);

        if (!match) return res.json({ success: false, message: 'Invalid username or password.' });

        // Save session
        req.session.adminId = admin.id;
        req.session.adminName = admin.first_name;

        return res.json({ success: true, message: 'Login successful!' });
    });
});

// ======================
// PROTECTED ADMIN DASHBOARD
// ======================
app.get('/admin-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admindashboard.html'));
});



//End of Auth of Admin(Head of Dormitory)




//Auth of Students Start Here



// Student Registration POST
app.post('/StudRegister', async (req, res) => {
  const { first_name, last_name, email, Stud_Id, password } = req.body;

  // 1️⃣ Validate required fields
  if (!first_name || !last_name || !email || !Stud_Id || !password) {
    return res.json({
      success: false,
      message: 'All fields are required'
    });
  }

  try {
    // 2️⃣ Check if student already exists
    const existingStudents = await new Promise((resolve, reject) => {
      db.query(
        'SELECT * FROM students WHERE email = ? OR Stud_Id = ?',
        [email, Stud_Id],
        (err, results) => {
          if (err) return reject(err);
          resolve(results);
        }
      );
    });

    if (existingStudents.length > 0) {
      return res.json({
        success: false,
        message: 'Student already registered'
      });
    }

    // 3️⃣ Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4️⃣ Insert new student
    await new Promise((resolve, reject) => {
      db.query(
        `INSERT INTO students (first_name, last_name, email, Stud_Id, password)
         VALUES (?, ?, ?, ?, ?)`,
        [first_name, last_name, email, Stud_Id, hashedPassword],
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    // 5️⃣ Respond success
    res.json({
      success: true,
      message: 'Registration successful'
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.json({
      success: false,
      message: 'Server error'
    });
  }
});








// Student Login POST
app.post('/Studlogin', (req, res) => {
  const { Stud_Id, password } = req.body;

  if (!Stud_Id || !password) {
    return res.json({
      success: false,
      message: 'Student ID and password are required'
    });
  }

  db.query(
    'SELECT * FROM students WHERE Stud_Id = ?',
    [Stud_Id],
    async (err, results) => {
      if (err) {
        console.error(err);
        return res.json({ success: false, message: 'Server error' });
      }

      if (results.length === 0) {
        return res.json({ success: false, message: 'Invalid ID or password' });
      }

      const student = results[0];

      // Compare password
      const match = await bcrypt.compare(password, student.password);
      if (!match) {
        return res.json({ success: false, message: 'Invalid ID or password' });
      }

      // Set session
      req.session.studentId = student.id;
      req.session.studentName = student.first_name;

      res.json({
        success: true,
        message: 'Login successful'
      });
    }
  );
});







app.post('/studentlogout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.clearCookie('connect.sid'); // clear the session cookie
    res.json({ success: true, message: 'Logged out successfully' });
  });
});


//End of Student Auth




// Start of Technical Auth Here







// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/'); // folder to store uploaded images
    },
    filename: function(req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${file.fieldname}${ext}`);
    }
});
const upload = multer({ storage });

app.post('/submitIssue', upload.single('photo'), (req, res) => {
    // Check if student is logged in
    if (!req.session.studentId || !req.session.studentName) {
        return res.json({ success: false, message: 'Unauthorized. Please login.' });
    }

    const { issueType, location, description } = req.body;
    const photo = req.file ? req.file.filename : null;

    // Validate required fields
    if (!issueType || !location || !description) {
        return res.json({ success: false, message: 'Please fill in all required fields.' });
    }

    // Insert into database with status "Pending"
    const sql = `
        INSERT INTO issues (studentId, studentName, issueType, location, description, photo, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [req.session.studentId, req.session.studentName, issueType, location, description, photo, 'Pending'],
        (err, result) => {
            if (err) {
                console.error(err);
                return res.json({ success: false, message: 'Server error while saving issue.' });
            }
            res.json({ success: true, message: 'Issue reported successfully!' });
        }
    );
});



















































app.post('/auth/Technicalslogin', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM technicians WHERE username=?', [username]);
    const user = rows[0];
    if (!user) return res.status(401).json({ ok: false, message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ ok: false, message: 'Invalid credentials' });

    req.session.user = { id: user.id, username: user.username, name: user.name, email: user.email };
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false });
  }
});

app.post('/auth/Technicallogout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login'); // '/' serves login.html in your current setup
  });
});






  function isAdminLoggedIn(req, res, next) {
  if (req.session && req.session.id) {
    // Admin is logged in
    next();
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized: Please login' });
  }
}

// Return logged-in admin info
app.get('/admin-info', (req, res) => {
    if (!req.session.adminId) {
        return res.status(401).json({ success: false });
    }

    res.json({
        success: true,
        adminName: req.session.adminName
    });
});






app.get('/api/technicians', (req, res) => {
    const sql = 'SELECT * FROM technicians ORDER BY created_at DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.json({ success: false });
        }
        res.json({ success: true, technicians: results });
    });
});



app.post('/api/technicians', (req, res) => {
    const { name, email, phone, role } = req.body;

    if (!name || !email) {
        return res.json({ success: false, message: 'Name and Email are required' });
    }

    const sql = `
        INSERT INTO technicians (name, email, phone, role)
        VALUES (?, ?, ?, ?)
    `;

    db.query(sql, [name, email, phone, role], (err, result) => {
        if (err) {
            console.error(err);
            return res.json({ success: false, message: 'Email already exists' });
        }

        res.json({
            success: true,
            technician: {
                id: result.insertId,
                name,
                email,
                phone,
                role,
                status: 'Active'
            }
        });
    });
});


app.delete('/api/technicians/:id', (req, res) => {
    const sql = 'DELETE FROM technicians WHERE id = ?';
    db.query(sql, [req.params.id], err => {
        if (err) {
            console.error(err);
            return res.json({ success: false });
        }
        res.json({ success: true });
    });
});




// Fetch all issues (for admin dashboard)
function isAdminLoggedIn(req, res, next) {
    if (req.session && req.session.adminId) {
        next();
    } else {
        res.status(401).json({ success: false, message: 'Unauthorized' });
    }
}

app.get('/admin/issues', isAdminLoggedIn, (req, res) => {
    const sql = `
        SELECT id, studentName, issueType, location, description, photo, status, created_at
        FROM issues
        ORDER BY created_at DESC
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error(err);
            return res.json({ success: false, message: 'Server error' });
        }
        res.json({ success: true, reports: results });
    });
});




app.get('/admin/techs/count', isAdminLoggedIn, (req, res) => {
    const sql = 'SELECT COUNT(*) AS total FROM technicians';
    db.query(sql, (err, result) => {
        if (err) return res.json({ success: false });
        res.json({ success: true, total: result[0].total });
    });
});


app.get('/admin/issues/count', isAdminLoggedIn, (req, res) => {
    const sql = 'SELECT COUNT(*) AS active FROM issues'; // fixed

    db.query(sql, (err, result) => {
        if (err) {
            console.error(err);
            return res.json({ success: false, message: 'Server error' });
        }

        res.json({ success: true, active: result[0].active });
    });
});



app.get('/admin/issues/pending', isAdminLoggedIn, (req, res) => {
    const sql = 'SELECT COUNT(*) AS pending FROM issues WHERE status="Pending"';
    db.query(sql, (err, result) => {
        if (err) return res.json({ success: false });
        res.json({ success: true, pending: result[0].pending });
    });
});


app.get('/admin/messages/count', isAdminLoggedIn, (req, res) => {
    const sql = 'SELECT COUNT(*) AS total FROM messages';
    db.query(sql, (err, result) => {
        if (err) return res.json({ success: false });
        res.json({ success: true, total: result[0].total });
    });
});









app.get('/message', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/message.html'));
});









































// ✅ Create Technical
app.post('/api/technicals/create', isAdminLoggedIn, async (req, res) => {
  const { name, username, email, password, role } = req.body;

  if (!name || !username || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      `INSERT INTO technicals 
       (name, username, email, password_hash, created_at, role)
       VALUES (?, ?, ?, ?, NOW(), ?)`,
      [name.trim(), username.trim(), email.trim(), hashedPassword, role.trim()],
      async (err) => {
        if (err) {
          console.error(err);
          let message = 'Failed to create Technical';
          if (err.code === 'ER_DUP_ENTRY') {
            message = 'Email or username already exists';
          }
          return res.status(500).json({ success: false, message });
        }

        // 📧 Send welcome email
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        await transporter.sendMail({
          from: `"CampusFix Admin" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: `Welcome to CampusFix as ${role} 🎉`,
          html: `
            <div style="font-family:Arial; line-height:1.6">
              <h2>Welcome, ${name} 👋</h2>
              <p>You are registered as <b>${role}</b> on <b>ASTUYE</b>.</p>
              <ul>
                <li><b>Username:</b> ${username}</li>
                <li><b>Password:</b> ${password}</li>
              </ul>
              <p style="color:red"><b>Please change your password after login.</b></p>
              <p>— ASTUYE Team</p>
            </div>
          `
        });

        res.json({
          success: true,
          message: 'Technical created successfully and email sent'
        });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});




// ✅ Update Technical
app.put('/api/technicals/:id', async (req, res) => {
  const { id } = req.params;
  const { name, username, email, role, password } = req.body;

  let query = 'UPDATE technicals SET name=?, username=?, email=?, role=?';
  let params = [name, username, email, role];

  try {
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password_hash=?';
      params.push(hashedPassword);
    }

    query += ' WHERE id=?';
    params.push(id);

    db.query(query, params, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: 'Error updating Technical' });
      }

      res.json({ ok: true, message: 'Technical updated successfully' });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
});





// ✅ Delete Technical
app.delete('/api/technicals/:id', (req, res) => {
  const { id } = req.params;

  db.query(
    'DELETE FROM technicals WHERE id=?',
    [id],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: 'Error deleting Technical' });
      }

      res.json({ ok: true, message: 'Technical deleted successfully' });
    }
  );
});




// ✅ Get all Technicals
app.get('/api/technicals', (req, res) => {
  db.query(
    `SELECT id, name, username, email, role, created_at
     FROM technicals
     ORDER BY created_at DESC`,
    (err, rows) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: 'Error fetching Technicals' });
      }

      res.json({ success: true, technicals: rows });
    }
  );
});




// ================== SEND MESSAGE (REST) ==================
app.post('/api/messages/send', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });

  const { receiverId, content } = req.body;
  if (!receiverId || !content) return res.status(400).json({ error: 'Missing fields' });

  db.query(
    'INSERT INTO messages (sender_id, receiver_id, content, is_read, timestamp) VALUES (?, ?, ?, 0, NOW())',
    [req.session.user.id, receiverId, content],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      res.json({ success: true, message: 'Message sent.', id: result.insertId });
    }
  );
});



// ================== GET CHAT HISTORY ==================
app.get('/api/messages/:userId', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });

  const currentUserId = req.session.user.id;
  const otherUserId = req.params.userId;

  const sql = `
    SELECT id, sender_id, receiver_id, content, is_read, timestamp
    FROM messages
    WHERE (sender_id = ? AND receiver_id = ?)
       OR (sender_id = ? AND receiver_id = ?)
    ORDER BY timestamp ASC
  `;

  db.query(sql, [currentUserId, otherUserId, otherUserId, currentUserId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});


// ================== MARK MESSAGES AS READ ==================
app.post('/api/messages/mark-read/:senderId', async (req, res) => {
  try {
    if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });

    const receiverId = req.session.user.id;
    const senderId   = req.params.senderId;

    await promisePool.query(
      'UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0',
      [senderId, receiverId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('mark-read error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});



// ================== UNREAD COUNTS (WITH NAMES) ==================
app.get('/api/unread-messages', async (req, res) => {
  try {
    if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });

    const userId = req.session.user.id;

    const [rows] = await promisePool.query(`
      SELECT m.sender_id,
             COUNT(*) AS unreadCount,
             u.first_name,
             u.last_name,
             u.profile_image
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.receiver_id = ? AND m.is_read = 0
      GROUP BY m.sender_id, u.first_name, u.last_name, u.profile_image
    `, [userId]);

    res.json(rows);
    // Example: [{ sender_id: 5, unreadCount: 2, first_name: "Gez", last_name: "Man", profile_image: "avatar.png" }]
  } catch (err) {
    console.error('unread-messages error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});



// ================== SOCKET.IO HANDLERS ==================
const { promisePool } = require('./db');

io.on('connection', (socket) => {
 

  // Register the user’s ID for this socket
  socket.on('register', (userId) => {
    socket.userId = String(userId); // keep as string for consistency
    
  });

  // Handle incoming message
  socket.on('sendMessage', async ({ senderId, receiverId, content }) => {
    try {
      const [result] = await promisePool.query(
        'INSERT INTO messages (sender_id, receiver_id, content, is_read, timestamp) VALUES (?, ?, ?, 0, NOW())',
        [senderId, receiverId, content]
      );

      const savedMsg = {
        id: result.insertId,
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        is_read: 0,
        timestamp: new Date()
      };

      // Emit to sender and receiver
      for (const [, s] of io.sockets.sockets) {
        if (s.userId === String(receiverId) || s.userId === String(senderId)) {
          s.emit('message', savedMsg);
        }
      }

      // Emit notification to receiver only
      for (const [, s] of io.sockets.sockets) {
        if (s.userId === String(receiverId)) {
          s.emit('messageNotification', { from: senderId });
        }
      }

    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('disconnect', () => {
    
  });
});









































server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

