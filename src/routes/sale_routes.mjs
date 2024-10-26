import express from "express";
import checkRequiredFieldsMiddleware from "../middlewares/check_required_fields_middleware.mjs";
import checkTokenMiddleware from "../middlewares/check_token_middleware.mjs";
import SaleController from "../controllers/sale_controller.mjs";

const router = express.Router();

const baseRoute = "/sale";

//api routes
router
  .route(baseRoute + "/create")
  .post(
    checkRequiredFieldsMiddleware([
      "listing_visibile",
      "name",
      "description",
      "start_date_time",
      "end_date_time",
      "link_to_stores",
      "website",
      "discount_description",
      "images",
      "brand",
    ]),
    checkTokenMiddleware,
    SaleController.apiCreateEvent
  );

router
  .route(baseRoute + "/list")
  .get(checkRequiredFieldsMiddleware(["filter"]), SaleController.apiListEvents);

router
  .route(baseRoute + "/delete")
  .delete(
    checkRequiredFieldsMiddleware(["id"]),
    checkTokenMiddleware,
    SaleController.apiDeleteEvent
  );

router
  .route(baseRoute + "/update")
  .put(
    checkRequiredFieldsMiddleware(["id"]),
    checkTokenMiddleware,
    SaleController.apiUpdateEvent
  );

router
  .route(baseRoute + "/approve")
  .post(checkRequiredFieldsMiddleware(["id"]), SaleController.apiApproveEvent);

export default router;
