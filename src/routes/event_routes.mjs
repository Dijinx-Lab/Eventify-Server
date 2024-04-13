import express from "express";
import checkRequiredFieldsMiddleware from "../middlewares/check_required_fields_middleware.mjs";
import checkTokenMiddleware from "../middlewares/check_token_middleware.mjs";
import EventController from "../controllers/event_controller.mjs";

const router = express.Router();

const baseRoute = "/event";

//api routes
router
  .route(baseRoute + "/create")
  .post(
    checkRequiredFieldsMiddleware([
      "listing_visibile",
      "name",
      "description",
      "date_time",
      "address",
      "city",
      "latitude",
      "longitude",
      "max_capacity",
      "price_type",
      "price_starts_from",
      "price_goes_upto",
      "images",
      "pass_ids",
      "category_id",
      "contact",
    ]),
    checkTokenMiddleware,
    EventController.apiCreateEvent
  );

router
  .route(baseRoute + "/list")
  .get(
    checkRequiredFieldsMiddleware(["filter"]),
    EventController.apiListEvents
  );

router
  .route(baseRoute + "/delete")
  .delete(
    checkRequiredFieldsMiddleware(["id"]),
    checkTokenMiddleware,
    EventController.apiDeleteEvent
  );

router
  .route(baseRoute + "/update")
  .put(
    checkRequiredFieldsMiddleware(["id"]),
    checkTokenMiddleware,
    EventController.apiUpdateEvent
  );

router
  .route(baseRoute + "/approve")
  .post(checkRequiredFieldsMiddleware(["id"]), EventController.apiApproveEvent);

export default router;
