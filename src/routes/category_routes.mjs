import express from "express";
import checkRequiredFieldsMiddleware from "../middlewares/check_required_fields_middleware.mjs";
import checkTokenMiddleware from "../middlewares/check_token_middleware.mjs";
import CategoryController from "../controllers/category_controller.mjs";

const router = express.Router();

const baseRoute = "/category";

//api routes
router.route(baseRoute + "/create").post(
  checkRequiredFieldsMiddleware(["name", "description"]),
  CategoryController.apiCreateCategory
);

router.route(baseRoute + "/list").get(CategoryController.apiListCategories);

export default router;
