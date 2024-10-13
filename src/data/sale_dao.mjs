import databaseConfig from "../config/database_config.mjs";

let con;

export default class SaleDAO {
  static async injectDB(conn) {
    if (con) {
      return;
    }
    try {
      con = conn
        .db(databaseConfig.database.dbName)
        .collection(databaseConfig.collections.salesDatabase);
    } catch (e) {
      console.error(`Unable to establish a collection handle: ${e}`);
    }
  }

  static async addSaleToDB(sale) {
    try {
      const insertionResult = await con.insertOne(sale);
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

  static async getAllSalesFromDB() {
    try {
      const sales = await con
        .find({
          deleted_on: null,
          listing_visibile: true,
          approved_on: { $ne: null },
        })
        .toArray();
      return sales;
    } catch (e) {
      console.error(`Unable to get categories: ${e}`);
      return null;
    }
  }

  static async getUnapprovedSalesFromDB() {
    try {
      const sales = await con
        .find({ deleted_on: null, approved_on: null })
        .toArray();
      return sales;
    } catch (e) {
      console.error(`Unable to get categories: ${e}`);
      return null;
    }
  }

  static async getAllSalesByUserFromDB(id) {
    try {
      const sales = await con.find({ user_id: id, deleted_on: null }).toArray();
      return sales;
    } catch (e) {
      console.error(`Unable to get categories: ${e}`);
      return null;
    }
  }

  static async updateSaleFieldByID(id, fieldsToUpdate) {
    try {
      const sale = await con.findOneAndUpdate(
        { _id: id },
        { $set: fieldsToUpdate },
        { new: true }
      );
      return sale;
    } catch (e) {
      console.error(`Unable to update pass field: ${e}`);
      return null;
    }
  }

  static async getSaleByIDFromDB(id) {
    try {
      const sale = await con.findOne({
        _id: id,
        deleted_on: null,
      });
      return sale;
    } catch (e) {
      console.error(`Unable to get category by ID: ${e}`);
      return null;
    }
  }
}
