import multer from "multer";
import path from "path";

const storage= multer.diskStorage({
    destination: "./uploads",
    filename: (rea,file,cb)=>{
        const ext =
        path.extname(file.originalname);
        cb(null, `${Date.now()}_${req.user?.id  || 
            req.session.user.id}${ext}`);
    }
});

const fileFilter = (_, file,cb)=>{
    const allowed = [".pdf",".doc", ".docx"];
    cb(null,
        allowed.includes(path.extname(file.originalname).toLowerCase())
    );
};

export default multer({ storage,
    fileFilter }).single("resume");