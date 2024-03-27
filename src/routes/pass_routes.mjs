import express from "express";
import PassController from "../controllers/pass_controller.mjs";
import checkRequiredFieldsMiddleware from "../middlewares/check_required_fields_middleware.mjs";
import checkTokenMiddleware from "../middlewares/check_token_middleware.mjs";

const router = express.Router();

const baseRoute = "/pass";

//api routes
router
  .route(baseRoute + "/create")
  .post(
    checkRequiredFieldsMiddleware([
      "event_id",
      "name",
      "full_price",
      "discount",
    ]),
    checkTokenMiddleware,
    PassController.apiCreatePass
  );

router
  .route(baseRoute + "/update")
  .put(
    checkRequiredFieldsMiddleware(["id"]),
    checkTokenMiddleware,
    PassController.apiUpdatePass
  );

router
  .route(baseRoute + "/delete")
  .delete(
    checkRequiredFieldsMiddleware(["id"]),
    checkTokenMiddleware,
    PassController.apiDeletePass
  );

export default router;
