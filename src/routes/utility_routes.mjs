import express from "express";
import checkRequiredFieldsMiddleware from "../middlewares/check_required_fields_middleware.mjs";
import UtilityController from "../controllers/utility_controller.mjs";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseRoute = "/utility";

//api routes
router
  .route(baseRoute + "/docs")
  .get(checkRequiredFieldsMiddleware(["type"]), UtilityController.apiGetDoc);

router
  .route(baseRoute + "/docs/update")
  .put(
    checkRequiredFieldsMiddleware(["type", "text"]),
    UtilityController.apiUpdateDoc
  );

router.get(baseRoute + "/privacy", (req, res) => {
  const filePath = path.join(__dirname, "assets", "privacy_policy.html");
  res.sendFile(filePath);
});

export default router;
