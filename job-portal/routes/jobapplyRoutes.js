import express from "express";
import {transporter} from "../config/mailer.js";
import db from "../config/dbclient.js";
import multer from "multer";
import path from "path";

const router = express.Router();

const storage= multer.diskStorage({
    destination: function(req,file,cb){
        cb(null, "uploads/");
    },
    filename: function(req,file,cb){
        const uniqueName = Date.now() + "-"+ file.originalname;
        cb(null, uniqueName);
    },
});

const upload= multer({storage: storage});

router.get("/job/:jobId/apply", async (req,res)=>{
    const {jobId} =req.params;
    
    const job = await db.query("SELECT * FROM jobs WHERE id=$1", [jobId]);
    if(!job.rows.length) return res.send("job not found");
    res.render("apply", {job: job.rows[0]});
});

router.post("/jobs/:jobId/apply", upload.single("resume"), async (req,res)=>{
    const {jobId} = req.params;
    const resumepath = req.file?.path;

    console.log("User applied for a job ID: ", jobId);
    console.log("Resume saved at: ", resumepath);

    res.send("Resume uploaded successfully");

    if(!resumepath) return res.send("please attach a Resume.");

     const job = await db.query("SELECT * FROM jobs WHERE id = $1",[jobId]);
     if(!job.rows.length) return res.send("job not found");

     const user = await db.query("SELECT * FROM users WHERE id = $1", [job.rows[0].userid]);
        if (!user.rows.length) return res.send("poster not found");

        //send e-mail
       await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: user.rows[0].email,
        subject: `New Application for job #${jobId}`,
        text: `Hi, an application has applied for your job. see resume attached.`,
        attachments: [{ filename: req.file.originalname, path: resumepath }],
    });

    res.send("Resume uploded and email sent successfully");
});

export default router;