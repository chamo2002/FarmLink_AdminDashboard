const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const app = express();
const port = 5000;

// Basic middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('frontend'));
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500'], // Allow Live Server origins
  credentials: true // Important for cookies to work cross-origin
}));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Simple authentication storage (temporary solution - not for production)
const activeUsers = {};

// MySQL connection setup
const db = mysql.createConnection({
  host: 'mysql-farmlinkdb.alwaysdata.net',
  user: '406199_farmlink',
  password: 'cD4LCNjt4pOl4ZU',
  database: 'farmlinkdb_host'
});

db.connect(err => {
  if (err) console.error('Failed to connect to MySQL:', err);
  else console.log('Connected to MySQL database');
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });


// ======== LOGIN ROUTES ========

// Serve login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/html/admin/login.html'));
});

// Process login with database validation
app.post('/login-action', (req, res) => {
  console.log('Login attempt:', req.body);
  const { username, password } = req.body;
  
  // Query the database for the user
  const query = 'SELECT * FROM admin WHERE username = ?';
  
  db.query(query, [username], (err, results) => {
    if (err) {
      console.error('Database error during login:', err);
      return res.redirect('http://127.0.0.1:5500/frontend/html/admin/login.html?error=Server+error');
    }
    
    // Check if user exists and password matches
    if (results.length > 0 && results[0].password === password) {
      // Create a simple auth token
      const token = Date.now().toString();
      activeUsers[token] = { 
        username,
        admin_id: results[0].admin_id,
        first_name: results[0].first_name,
        last_name: results[0].last_name
      };
      
      // Set token cookie with appropriate settings for cross-origin
      res.cookie('auth_token', token, { 
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'None',
        secure: true // Required for SameSite=None
      });
      
      // Redirect to admin page with the Live Server URL
      return res.redirect('http://127.0.0.1:5500/frontend/html/admin/admin.html');
    }
    
    // Failed login
    return res.redirect('http://127.0.0.1:5500/frontend/html/admin/login.html?error=Invalid+username+or+password');
  });
});
// Direct login (development only)
app.get('/quick-login', (req, res) => {
  const token = Date.now().toString();
  activeUsers[token] = { username: 'admin' };
  res.cookie('auth_token', token, { 
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'None',
    secure: true
  });
  res.redirect('http://127.0.0.1:5500/frontend/html/admin/admin.html');
});

// Simple auth check function
function isAuthenticated(req) {
  const token = req.cookies?.auth_token;
  return token && activeUsers[token];
}

// Logout
app.get('/logout', (req, res) => {
  const token = req.cookies?.auth_token;
  if (token) {
    delete activeUsers[token];
    res.clearCookie('auth_token');
  }
  res.redirect('http://127.0.0.1:5500/frontend/html/admin/login.html');
});

// ======== MAIN ROUTES ========

// Serve the dashboard page (root)
app.get('/admin', (req, res) => {
  // Simple direct serving
  res.sendFile(path.join(__dirname, 'frontend/html/admin/admin.html'));
});

// Route for View Staff page
app.get('/view-staff', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/html/admin/viewstaff.html'));
});

app.get('/viewstaff.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/html/admin/viewstaff.html'));
});

// Route for View Farmer page
app.get('/view-farmer', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/html/admin/viewfarmer.html'));
});

app.get('/viewfarmer.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/html/admin/viewfarmer.html'));
});

// Route for View Harvest page
app.get('/view-harvest', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/html/admin/viewharvest.html'));
});

app.get('/viewharvest.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/html/admin/viewharvest.html'));
});

// Route for View Shop page
app.get('/view-shop', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/html/admin/viewshop.html'));
});

app.get('/viewshop.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/html/admin/viewshop.html'));
});

// Route for View Buyers page
app.get('/view-buyers', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/html/admin/viewbuyer.html'));
});

app.get('/viewbuyer.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/html/admin/viewbuyer.html'));
});

// ======== API ROUTES ========

// Route to handle form submission
app.post('/create-staff', (req, res) => {
  console.log(req.body);
  const { first_name, last_name, contact_number, position, gender, date_of_joining, nic, email, username, password } = req.body;

  const query = `INSERT INTO staff (first_name, last_name, contact_number, position, gender, joined_date, nic, email, username, password)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(query, [first_name, last_name, contact_number, position, gender, date_of_joining, nic, email, username, password], (err, result) => {
    if (err) {
      console.error("Error occurred:", err);
      return res.status(500).send("Server error");
    }
    res.redirect('/viewstaff');
  });
});

// Route to view all staff
app.get('/viewstaff', (req, res) => {
  db.query('SELECT * FROM staff', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Server error');
    }
    res.sendFile(path.join(__dirname, 'frontend/html/admin/viewstaff.html'));
  });
});

// Add a separate API endpoint to get staff data
app.get('/api/staff', (req, res) => {
  db.query('SELECT * FROM staff', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Server error');
    }
    res.json(results);
  });
});

// Route to delete staff
app.post('/delete-staff', (req, res) => {
  const { staff_id } = req.body;

  db.query('DELETE FROM staff WHERE staff_id = ?', [staff_id], (err, result) => {
    if (err) {
      console.error("Error deleting staff:", err);
      return res.status(500).send("Server error");
    }
    res.redirect('/viewstaff');
  });
});

app.get('/get-staff', (req, res) => {
  db.query('SELECT * FROM staff', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Server error');
    }
    res.json(results);
  });
});

// Route to update staff information
app.post('/update-staff', (req, res) => {
  console.log("Update staff request received:", req.body);
  const {
    staff_id,
    first_name,
    last_name,
    contact_number,
    position,
    gender,
    joined_date,
    nic,
    email,
    username,
    password
  } = req.body;

  // Format the date to MySQL format (YYYY-MM-DD)
  let formattedDate = joined_date;
  if (joined_date && joined_date.includes('-')) {
    formattedDate = joined_date; // Already in YYYY-MM-DD format
  } else if (joined_date) {
    // Try to parse as date object
    const dateObj = new Date(joined_date);
    if (!isNaN(dateObj.getTime())) {
      formattedDate = dateObj.toISOString().split('T')[0];
    }
  }

  // Ensure empty strings are converted to valid values
  const cleanPosition = position === "undefined" || !position ? "" : position;
  const cleanNic = nic === "undefined" || !nic ? "" : nic;
  const cleanPassword = password === "undefined" || !password ? "" : password;

  const query = `UPDATE staff 
                 SET first_name = ?, last_name = ?, contact_number = ?, 
                     position = ?, gender = ?, joined_date = ?, 
                     nic = ?, email = ?, username = ?, password = ? 
                 WHERE staff_id = ?`;

  db.query(
    query,
    [
      first_name,
      last_name,
      contact_number,
      cleanPosition,
      gender,
      formattedDate,
      cleanNic,
      email,
      username,
      cleanPassword,
      staff_id
    ],
    (err, result) => {
      if (err) {
        console.error("Error updating staff:", err);
        return res.status(500).json({ error: "Server error", details: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Staff not found" });
      }

      console.log("Staff updated successfully, affected rows:", result.affectedRows);
      res.json({ success: true, message: "Staff updated successfully" });
    }
  );
});

// Route to get staff count for the dashboard
app.get('/staff-count', (req, res) => {
  db.query('SELECT COUNT(*) as count FROM staff', (err, result) => {
    if (err) {
      console.error("Error getting staff count:", err);
      return res.status(500).json({ error: "Server error" });
    }

    // Return the count as JSON
    res.json({ count: result[0].count });
  });
});

// Get farmer count
app.get('/farmer-count', (req, res) => {
  db.query('SELECT COUNT(*) as count FROM Farmer', (err, result) => {
    if (err) {
      console.error("Error getting farmer count:", err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json({ count: result[0].count });
  });
});

// Get buyer count
app.get('/buyer-count', (req, res) => {
  db.query('SELECT COUNT(*) as count FROM buyer', (err, result) => {
    if (err) {
      console.error("Error getting buyer count:", err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json({ count: result[0].count });
  });
});

// Get harvest count
app.get('/harvest-count', (req, res) => {
  db.query('SELECT COUNT(*) as count FROM Harvest', (err, result) => {
    if (err) {
      console.error("Error getting harvest count:", err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json({ count: result[0].count });
  });
});

// Get all farmers
app.get('/get-farmers', (req, res) => {
  db.query('SELECT * FROM Farmer', (err, results) => {
    if (err) {
      console.error("Error fetching farmers:", err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json(results);
  });
});

// Get all buyers
app.get('/get-buyers', (req, res) => {
  db.query('SELECT * FROM buyer', (err, results) => {
    if (err) {
      console.error("Error fetching buyers:", err);
      return res.status(500).json({ error: "Server error" });
    }
    res.json(results);
  });
});

// Get Fertilizers
app.get('/getFertilizers', (req, res) => {
  const query = 'SELECT * FROM fertilizer ORDER BY fertilizer_id DESC';
  db.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching fertilizers:', err);
      return res.status(500).json({ error: 'Error fetching fertilizers' });
    }
    res.json(result);
  });
});

// Get Rent Cards
app.get('/getRentCards', (req, res) => {
  const query = 'SELECT * FROM rent_cards ORDER BY card_id DESC';
  db.query(query, (err, result) => {
    if (err) {
      console.error('Error fetching rent cards:', err);
      return res.status(500).json({ error: 'Error fetching rent cards' });
    }

    // Process the results to handle BLOB images
    const processedResults = result.map(card => {
      // Create a copy of the card object
      const processedCard = { ...card };

      // If image is a Buffer (BLOB data), convert it to base64
      if (processedCard.image && Buffer.isBuffer(processedCard.image)) {
        processedCard.image = `data:image/jpeg;base64,${processedCard.image.toString('base64')}`;
      }

      return processedCard;
    });

    res.json(processedResults);
  });
});




// Start server
app.listen(port, () => {
  
  console.log(`Login page: http://localhost:${port}/login`);
  

});