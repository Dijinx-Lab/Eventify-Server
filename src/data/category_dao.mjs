import databaseConfig from "../config/database_config.mjs";

let catconn;

export default class CategoryDAO {
  static async injectDB(conn) {
    if (catconn) {
      return;
    }
    try {
      catconn = conn
        .db(databaseConfig.database.dbName)
        .collection(databaseConfig.collections.categoriesDatabase);
    } catch (e) {
      console.error(`Unable to establish a collection handle: ${e}`);
    }
  }

  static async addCategoryToDB(pass) {
    try {
      const insertionResult = await catconn.insertOne(pass);
      if (insertionResult && insertionResult.insertedId) {
        return insertionResult.insertedId;
      } else {
        return null;
      }
    } catch (e) {
      console.error(`Unable to add category: ${e}`);
      return null;
    }
  }

  static async getAllCategoryFromDB(id) {
    try {
      const category = await catconn.find({ deleted_on: null }).toArray();
      return category;
    } catch (e) {
      console.error(`Unable to get categories: ${e}`);
      return null;
    }
  }

  static async getCategoryByIDFromDB(id) {
    try {
      const category = await catconn.findOne({ _id: id, deleted_on: null });
      return category;
    } catch (e) {
      console.error(`Unable to get category by ID: ${e}`);
      return null;
    }
  }
}