require("dotenv").config();
const express = require("express");
const passport = require("passport");
const session = require("express-session");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const multer = require("multer");
const path = require("path");
const ensureAuth = require('./middleware/ensureAuth');
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ✅ Add this near the top of app.js
const fileRoutes = require('./routes/fileRoutes');

const app = express();
app.use("/uploads", express.static("public/uploads"));

const PORT = process.env.PORT || 3000;

// EJS setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));

// Session middleware
app.use(
  session({
    secret: "secretkey",
    resave: false,
    saveUninitialized: false,
  }),
);

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    },
  ),
);

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "public/uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Homepage
app.get("/", async (req, res) => {
  try {
    const files = await prisma.file.findMany();
    res.render("index", { user: req.user, files });
  } catch (err) {
    console.error("Error fetching files:", err);
    res.render("index", { user: req.user, files: [] });
  }
});

// Google Auth routes
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/");
  },
);

// Logout
app.get("/logout", (req, res) => {
  req.logout(() => res.redirect("/"));
});
app.get("/auth/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
});

// Upload form
app.get("/upload", ensureAuth, (req, res) => {
  res.sendFile(__dirname + "/views/uploadForm.html");
});

// File upload handler using Prisma
app.post("/upload", ensureAuth, upload.single("file"), async (req, res) => {
  try {
    await prisma.file.create({
      data: {
        filename: req.file.originalname,
        path: `/uploads/${req.file.filename}`, // ✅ fixed: backticks used
        mimetype: req.file.mimetype,
        size: req.file.size,
        user: { connect: { id: req.user.id } } // only if logged in
      },
    });

    res.redirect("/");
  } catch (err) {
    console.error("File upload error:", err);
    res.redirect("/");
  }
}); // ✅ THIS was missing
//  ↑ you missed this closing bracket for the POST route above

app.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) return next(err);
    req.session.destroy(); // optional
    res.redirect("/"); // go back to home or login
  });
});


app.use('/', fileRoutes);

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  const status = err.statusCode || 500;
  const message = err.message || 'Something went wrong!';

  res.status(status).json({
    success: false,
    message,
  });
});



if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`); // ✅ fixed: backticks used
  });
}

module.exports = app;
