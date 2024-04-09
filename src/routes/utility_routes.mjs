import express from "express";
import checkRequiredFieldsMiddleware from "../middlewares/check_required_fields_middleware.mjs";
import UtilityController from "../controllers/utility_controller.mjs";

const router = express.Router();

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

export default router;
