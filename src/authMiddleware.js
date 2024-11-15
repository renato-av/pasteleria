const authMiddleware = (req, res, next) => {
  console.log("Middleware de autenticación activado");
  if (req.session.userId) {
    console.log("Usuario autenticado");
    next();
  } else {
    console.log("Usuario no autenticado, redirigiendo a /admin/login");
    res.redirect("/admin/login");
  }
};

export default authMiddleware;
