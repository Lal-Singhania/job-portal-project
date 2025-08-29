import passport from "passport";
import { Strategy } from "passport-google-oauth20";
import db from "./dbclient.js";

console.log("GOOGLE_CLIENT_ID from env:", process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET from env:", process.env.GOOGLE_CLIENT_SECRET);

passport.use(
  new Strategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refershToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        //check user exist or not
        const result = await db.query("SELECT * FROM users WHERE email= $1", [
          email,
        ]);

        let user;

        if (result.rows.length > 0) {
          user = result.rows[0];
        } else {
          //insert new google user
          const insertresult = await db.query(
            "INSERT INTO users (username,email,password) VALUES ( $1,$2,$3) RETURNING *",
            [profile.displayName, email, "google_oauth"]
          );
          user = insertresult.rows[0];
        }
        return done(null, user);
      } catch (error) {
        console.log("google auth error:", error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const result = await db.query("SELECT * FROM users WHERE id= $1", [id]);
    const user = result.rows[0];

    done(null, {
      id: user.id,
      email: user.email,
      username: user.username,
    });
  } catch (err) {
    done(err, null);
  }
});
