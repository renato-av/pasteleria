import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import { readFile } from "fs/promises";
import dotenv from "dotenv";
dotenv.config();
// const __dirname = path.dirname(fileURLToPath(import.meta.url));

// // Ruta al archivo serviceAccountKey.json
// const serviceAccountPath = path.join(
//   __dirname,
//   "../config/serviceAccountKey.json"
// );

// const serviceAccount = JSON.parse(await readFile(serviceAccountPath, "utf8"));
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
  universe_domain: "googleapis.com",
};
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://mayas-pastries.appspot.com", // Reemplaza con el nombre de tu bucket de Firebase Storage
});

const bucket = admin.storage().bucket();
export { bucket };
