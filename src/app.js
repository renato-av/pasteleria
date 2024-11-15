import express from "express";
import path from "path";
import session from "express-session";
import morgan from "morgan";

import principalRouter from "./routes/principal.router.js";
import adminRouter from "./routes/admin.router.js";
import { fileURLToPath } from "url";

const app = express();
app.use(
  session({
    secret: "tu_clave_secreta_aqui",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Cookie solo se envía sobre HTTPS si secure es true
  })
);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// settings
app.set("port", process.env.PORT || 3000);

app.set("views", path.join(__dirname, "views"));

app.set("view engine", "ejs");

// middlewares
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
// routes
app.use(principalRouter);
app.use(adminRouter);

// static files
app.use(express.static(path.join(__dirname, "public")));
// starting the server
export default app;
