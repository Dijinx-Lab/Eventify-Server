import databaseConfig from "../config/database_config.mjs";

let utilityconn;

export default class UtilityDAO {
  static async injectDB(conn) {
    if (utilityconn) {
      return;
    }
    try {
      utilityconn = conn
        .db(databaseConfig.database.dbName)
        .collection(databaseConfig.collections.utilitiesDatabase);
    } catch (e) {
      console.error(`Unable to establish a collection handle: ${e}`);
    }
  }

  static async addDocToDB(pass) {
    try {
      const insertionResult = await utilityconn.insertOne(pass);
      if (insertionResult && insertionResult.insertedId) {
        return insertionResult.insertedId;
      } else {
        return null;
      }
    } catch (e) {
      console.error(`Unable to add pass: ${e}`);
      return null;
    }
  }

  static async updateDocInDB(type, fieldsToUpdate) {
    try {
      const pass = await utilityconn.findOneAndUpdate(
        { type: type },
        { $set: fieldsToUpdate },
        { new: true }
      );
      return pass;
    } catch (e) {
      console.error(`Unable to update pass field: ${e}`);
      return null;
    }
  }

  static async getDocByType(type) {
    try {
      const event = await utilityconn.findOne({ type: type });
      return event;
    } catch (e) {
      console.error(`Unable to get category by ID: ${e}`);
      return null;
    }
  }
}
