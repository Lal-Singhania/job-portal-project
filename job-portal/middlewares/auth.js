export function isAuthenticated(req, res, next) {

   const passportAuth = (typeof req.isAuthenticated === "function") && req.isAuthenticated();

  if (req.session?.user || passportAuth) {
    return next();
  }
  res.redirect("/login");
}