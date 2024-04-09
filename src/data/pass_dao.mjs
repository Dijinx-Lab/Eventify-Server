import databaseConfig from "../config/database_config.mjs";

let passcon;

export default class PassDAO {
  static async injectDB(conn) {
    if (passcon) {
      return;
    }
    try {
      passcon = conn
        .db(databaseConfig.database.dbName)
        .collection(databaseConfig.collections.passDatabase);
    } catch (e) {
      console.error(`Unable to establish a collection handle: ${e}`);
    }
  }

  static async addPassToDB(pass) {
    try {
      const insertionResult = await passcon.insertOne(pass);
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

  static async getPassesByEventIDFromDB(id) {
    try {
      const pass = await passcon
        .find({ event_id: id, deleted_on: null })
        .toArray();
      return pass;
    } catch (e) {
      console.error(`Unable to get passes: ${e}`);
      return null;
    }
  }

  static async getPassByIDFromDB(id) {
    try {
      const pass = await passcon.findOne({ _id: id, deleted_on: null });
      return pass;
    } catch (e) {
      console.error(`Unable to get pass: ${e}`);
      return null;
    }
  }

  static async updatePassFieldByID(id, fieldsToUpdate) {
    try {
      const pass = await passcon.findOneAndUpdate(
        { _id: id },
        { $set: fieldsToUpdate },
        { new: true }
      );
      return pass;
    } catch (e) {
      console.error(`Unable to update pass field: ${e}`);
      return null;
    }
  }
  static async deletePassByIDFromDB(id) {
    try {
      const result = await passcon.deleteOne({ _id: id });

      if (result.deletedCount === 1) {
        return true;
      } else {
        return true;
      }
    } catch (e) {
      console.error(`Unable to delete pass by ID: ${e}`);
      return null;
    }
  }

  static async deletePassByEventIDFromDB(id) {
    try {
      const result = await passcon.deleteMany({ event_id: id });

      if (result.deletedCount === 1) {
        return true;
      } else {
        return true;
      }
    } catch (e) {
      console.error(`Unable to delete pass by ID: ${e}`);
      return null;
    }
  }
}
