import CategoryDAO from "../data/category_dao.mjs";
import PatternUtil from "../utility/pattern_util.mjs";
import { ObjectId } from "mongodb";

export default class CategoryService {
  static async connectDatabase(client) {
    try {
      await CategoryDAO.injectDB(client);
    } catch (e) {
      console.error(`Unable to establish a collection handle: ${e}`);
    }
  }

  static async createCategory(name, description) {
    try {
      const createdOn = new Date();
      const deletedOn = null;

      const categoryDocument = {
        name: name,
        description: description,
        created_on: createdOn,
        deleted_on: deletedOn,
      };

      const addedCategoryId = await CategoryDAO.addCategoryToDB(
        categoryDocument
      );

      const databaseCategory = await CategoryDAO.getCategoryByIDFromDB(
        addedCategoryId
      );

      let filteredCategory = PatternUtil.renameKeys(databaseCategory, {
        _id: "id",
      });

      filteredCategory = PatternUtil.filterParametersFromObject(
        filteredCategory,
        ["created_on", "deleted_on"]
      );

      return { category: filteredCategory };
    } catch (e) {
      return e.message;
    }
  }

  static async listCategories() {
    try {
      const categories = await CategoryDAO.getAllCategoryFromDB();

      let filteredCategories = categories.map((category) => {
        const filteredIdCat = PatternUtil.renameKeys(category, {
          _id: "id",
        });
        return PatternUtil.filterParametersFromObject(filteredIdCat, [
          "created_on",
          "deleted_on",
        ]);
      });

      return { categories: filteredCategories };
    } catch (e) {
      return e.message;
    }
  }

  static async getCategoryById(id) {
    try {
      const databaseCategory = await CategoryDAO.getCategoryByIDFromDB(id);

      let filteredCategory = PatternUtil.renameKeys(databaseCategory, {
        _id: "id",
      });

      filteredCategory = PatternUtil.filterParametersFromObject(
        filteredCategory,
        ["created_on", "deleted_on"]
      );

      return filteredCategory;
    } catch (e) {
      return null;
    }
  }
}
