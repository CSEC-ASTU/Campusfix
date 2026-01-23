// auth.js 
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const db = require("./db.js").promisePool;
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: "mail.getastuye.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});





// ----- Serialize / Deserialize -----
passport.serializeUser((user, done) => {
  done(null, user.id); // user.id must exist
});

passport.deserializeUser(async (id, done) => {
  const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
  done(null, rows[0] || null);
});


// Helper: find or create user
// Helper: find or create user
async function findOrCreateUser({ email, firstName, lastName, provider, providerId }) {
  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

  if (rows.length > 0) {
    return rows[0]; // existing user → no welcome email
  }

  // create new user
  const [result] = await db.query(
    `INSERT INTO users (first_name, last_name, email, phone, password, balance, notifications, email_verified, status, provider, provider_id)
     VALUES (?, ?, ?, NULL, NULL, 0, 0, TRUE, 'Active', ?, ?)`,
    [firstName, lastName, email, provider, providerId]
  );

  // send welcome email
  const mailOptions = {
    from: `"ASTUYE Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "🎉 Welcome to ASTUYE",
    html: `
      <div style="font-family: Arial, sans-serif; line-height:1.6; color:#333;">
        <h2 style="color:#2c3e50;">Welcome to ASTUYE, ${firstName || ''}!</h2>
        <p>We're excited to have you join our learning community 🚀</p>
        
        <p>With ASTUYE, you can:</p>
        <ul style="margin:15px 0;">
          <li>Access your personalized <strong>dashboard</strong></li>
          <li>Join <strong>courses, study groups, and events</strong></li>
          <li>Connect with other students & collaborate</li>
        </ul>

        <p style="margin:20px 0;">
          👉 <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard"
                style="background:#2c3e50; color:#fff; padding:12px 20px; text-decoration:none; border-radius:5px;">
            Go to Dashboard
          </a>
        </p>

        <p>If you have any questions, our support team is here to help.</p>

        <p style="margin-top:20px;">Best regards,<br><strong>ASTUYE Support Team</strong></p>
        <hr style="margin:20px 0; border:none; border-top:1px solid #ddd;">
        <small style="color:#888;">This is an automated message, please do not reply.</small>
      </div>
    `
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) console.error("Welcome email error:", error);
    
  });

  return { id: result.insertId, first_name: firstName, last_name: lastName, email };
}


// ----- Google Strategy -----
passport.use(new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.FRONTEND_URL}/auth/google/callback`
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error("No email from Google"), null);

      const user = await findOrCreateUser({
        email,
        firstName: profile.name?.givenName || "",
        lastName: profile.name?.familyName || "",
        provider: "google",
        providerId: profile.id
      });

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

module.exports = passport;
