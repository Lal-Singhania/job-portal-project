import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { transporter } from "../config/mailer.js";
import db from "../config/dbclient.js";

const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "resumes/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const upload = multer({ storage: storage });


// GET route for job apply page
router.get("/job/:jobId/apply", async (req, res) => {
  const { jobId } = req.params;
  try {
    const job = await db.query("SELECT * FROM jobs WHERE id = $1", [jobId]);
    if (job.rows.length === 0) {
      return res.status(404).send("Job not found");
    }
    res.render("apply", { job: job.rows[0] });
  } catch (err) {
    console.error("Error fetching job:", err);
    res.status(500).send("Server error");
  }
});


// POST route to handle resume submission
router.post("/jobs/:jobId/apply", upload.single("resume"), async (req, res) => {
  const { jobId } = req.params;

  if (!req.file) {
    return res.redirect(`/job/${jobId}/apply?error=NoResumeAttached`);
  }

  const resumepath = req.file.path;

  try {
    const jobResult = await db.query("SELECT * FROM jobs WHERE id = $1", [jobId]);
    if (jobResult.rows.length === 0) {
      return res.redirect(`/job/${jobId}/apply?error=JobNotFound`);
    }
    const job = jobResult.rows[0];

    const userResult = await db.query("SELECT * FROM users WHERE id = $1", [job.userid]);
    if (userResult.rows.length === 0) {
      return res.redirect(`/job/${jobId}/apply?error=PosterNotFound`);
    }
    const poster = userResult.rows[0];

    // Send email with resume attached
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: poster.email,
      subject: `New Application for: ${job.title}`,
      text: `A candidate has applied to your job posting: ${job.title}. Resume attached.`,
      attachments: [
        {
          filename: req.file.originalname,
          path: resumepath,
        },
      ],
    });

    // Delete resume after sending
    fs.unlink(resumepath, (err) => {
      if (err) {
        console.error("Error deleting resume:", err);
      } else {
        console.log("Temporary resume file deleted.");
      }
    });

    // Redirect with success message
    res.redirect("/dashboard");
  } catch (err) {
    console.error("Error processing job application:", err);
    res.status(500).send("An error occurred while applying.");
  }
});

export default router;
