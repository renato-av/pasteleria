import pg from "pg";
import pkg from "pg-connection-string";
import { config as dotenvConfig } from "dotenv";

dotenvConfig();
const { parse } = pkg;
const config = parse(process.env.DB_URL);
const { Pool } = pg;
// Deshabilitar SSL
config.ssl = {
  rejectUnauthorized: false,
};

const pool = new Pool(config);

pool.connect((err, client, done) => {
  if (err) {
    console.error("Error connecting to the database", err);
  } else {
    console.log("Connected to the database");
   
  }
  done();
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export default pool;
