import express from "express";
import passport from "passport";

const router = express.Router();

router.get("/google", (req,res,next)=>{
    console.log("HIT : /auth/google");
    next();
}, passport.authenticate("google",
    {scope:["profile","email"]}));

router.get("/google/callback",
    passport.authenticate("google",{
    failureRedirect: "/login"
    }),
    (req,res)=>{
        res.redirect("/dashboard");
    }
);

router.get("/login", (req,res)=>{
    req.logout(()=>{
        res.redirect("/");
    });
});

export default router;
