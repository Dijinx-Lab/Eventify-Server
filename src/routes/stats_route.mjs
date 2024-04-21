import express from "express";
import checkTokenMiddleware from "../middlewares/check_token_middleware.mjs";
import checkRequiredFieldsMiddleware from "../middlewares/check_required_fields_middleware.mjs";
import StatsController from "../controllers/stats_controller.mjs";

const router = express.Router();

const baseRoute = "/stats";

//api routes
router
  .route(baseRoute + "/update")
  .put(
    checkRequiredFieldsMiddleware(["id"]),
    checkTokenMiddleware,
    StatsController.apiUpdateEventStats
  );

router
  .route(baseRoute + "/users")
  .get(
    checkRequiredFieldsMiddleware(["id", "filter"]),
    checkTokenMiddleware,
    StatsController.getStatsUser
  );

export default router;
