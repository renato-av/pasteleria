import { Router } from "express";
import {
  renderLetter,
  renderAbout,
  renderFAQ,
  renderPrincipal,
  renderProductDetails,
} from "../controllers/principalController.js";

const router = Router();

router.get("/", renderPrincipal);
router.get("/about", renderAbout);
router.get("/letter", renderLetter);
router.get("/faq", renderFAQ);
router.get("/detail/:id", renderProductDetails);

export default router;
