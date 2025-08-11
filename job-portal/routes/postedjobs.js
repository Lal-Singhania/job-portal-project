import express from "express";
import db from "../config/dbclient.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", isAuthenticated, async (req, res) => {
    try{
        const result = await db.query("SELECT * FROM jobs WHERE userid = $1", [req.user.id]);

        res.render("postedjobs", {
            jobs: result.rows,
            username: req.user.username
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

router.post("/delete-job/:id", isAuthenticated, async (req, res) => {
        try{
            await db.query("DELETE FROM jobs WHERE id = $1 AND userid = $2", [req.params.id, req.user.id]);//userId from session and job id from params
            res.redirect("/posted-jobs");
        }catch (err) {
            console.error(err);
            res.status(500).send("Server Error");
        }
});

export default router;