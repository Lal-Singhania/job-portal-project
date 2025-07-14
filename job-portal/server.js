import express from "express";
import { fileURLToPath } from "url";
import db from "./config/dbclient.js";
import bcrypt from "bcrypt"
import session from "express-session";
import path from "path";
import passport from "passport";
import "./config/passport.js";
import authRoutes from "./routes/authroutes.js";
import dotenv from "dotenv";
import jobapplyRoutes from "./routes/jobapplyRoutes.js"

dotenv.config();


const __filename =fileURLToPath(import.meta.url);
const __dirname =path.dirname(__filename);

const app = express();
const port = 9000;


//set view engine
app.set("view engine", "ejs");
app.set("views", path.join (__dirname, "views"));

app.use(express.static(path.join(__dirname,"public")));

//middleware
app.use(express.urlencoded({ extended : true}));
app.use(express.json());
app.use(session({ 
    secret : 'your-secret', //use to sign the session Id
    resave : false, //don't save session again if nothing has changed 
    saveUninitialized: false, // don't create empty session 
    cookie: {maxAge: 30*24*60*60*1000}
}));

app.use(passport.initialize());
app.use(passport.session());
app.use("/auth",authRoutes);
app.use(jobapplyRoutes);

function isAuthenticated(req, res, next) {

  if (req.session.user || req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}


//routes
app.get("/dashboard", isAuthenticated, (req, res) => {
  const user = req.user          // Google
            || req.session.user; // Local

  const username = user.displayName || user.username || user.name || "Guest";
  const applied = req.query.applied==="1";
 return res.render("dashboard", { username, applied });
});



app.get ("/", (req,res) => {
    res.sendFile(path.join( __dirname +"/public/job-home.html"));
});

app.get("/register", (req,res)=>{
    res.render("register");
});

app.post('/register', async (req,res)=>{
    const {username ,email ,password} = req.body;
    try {
        const usercheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (usercheck.rows.length >0){
            return req.send("user already exist");
        }
        const hasspassword = await bcrypt.hash(password,10);
      
         await db.query('INSERT INTO users (username , email , password) VALUES ($1 ,$2, $3)', [ username, email, hasspassword ]);
        
         req.session.user = {username ,email};//save user info in session

         res.redirect("/dashboard");
    } catch (err){
        console.log(err);
        res.send('error registration user');
    }
});

app.get("/login", (req,res) =>{
    res.render("login");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("⏩ POST /login:", email);

  try {
    // ---------- 1️⃣ QUERY ----------
    const { rows } = await db.query(
      "SELECT id, username, email, password FROM users WHERE email = $1",
      [email]
    );
    console.log("   • PG rows length =", rows.length);

    if (rows.length === 0) {
      return res.send("User not found");
    }

    const user = rows[0];
    console.log("   • User row =", user);

    // ---------- 2️⃣ GOOGLE-ONLY ----------
    if (!user.password || user.password === "google_oauth") {
      return res.send(
        "This account was created with Google sign-in. Use “Login with Google”."
      );
    }

    // ---------- 3️⃣ BCRYPT ----------
    const match = await bcrypt.compare(password, user.password);
    console.log("   • bcrypt match =", match);

    if (!match) {
      return res.send("Incorrect password");
    }

    // ---------- 4️⃣ SUCCESS ----------
    req.session.user = {
      id:       user.id,
      username: user.username,
      email:    user.email,
    };
    return res.redirect("/dashboard");

  } catch (err) {
    console.error("💥 login error:", err);
    return res.status(500).send("Server error during login");
  }
});


app.get("/logout", (req, res) => {
  req.logout(() => {
    req.session.destroy(err => {
      if (err) return res.redirect("/dashboard");
      res.redirect("/");
    });
  });
});


app.get("/post-job", (req,res)=>{
    res.render("post-job");
});

app.post("/post-job", async (req,res)=>{
    console.log(req.body);
    const {title,company,description,skills,mode,location,criteria,experience,salary}=req.body;
    console.log("session:",req.session);
    const userId = req.user?.id || req.session.user?.id;
    console.log("userId", userId);

    if(!userId){
        return res.status(401).send("user not found");
    }
    try{
        await db.query(
            `INSERT INTO jobs 
                (userid,title,company,description,skills,mode,location,criteria ,experience,salary)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [userId,title,company,description,skills,mode,location,criteria,experience,salary]
        );
        console.log("job inserted");
       return res.redirect("/dashboard");
    } catch(err){
        console.error(err);
       return res.status(500).send("error posting job");
    }
});

app.get("/all-jobs", async (req,res)=>{
    
    try{
        const result=await db.query("SELECT * FROM jobs");
        res.render("all-jobs",{ jobs: result.rows});
    } catch(err){
        console.error(err);
        res.send("error fetching job");
    }
});

app.get("/all-jobs/:id", async(req,res)=>{
    const jobId = req.params.id;

    try{
        const result = await db.query(" SELECT * FROM jobs WHERE id = $1", [jobId]);

        if (result.rows.length===0){
            return res.send("job not found");
        }
        res.render("job-details",{job: result.rows[0]});
    } catch(err){
        console.log(err);
        res.send("error loading job details")
    }
});

app.get ("/pricing", (req,res) => {
    res.sendFile( __dirname +"/public/pricing.html");
});

app.get ("/index.html", (req,res) => {
    res.sendFile( __dirname +"/public/job-home.html");
});

app.listen (port , () =>{
    console.log (`sever is running ${port}`);
});