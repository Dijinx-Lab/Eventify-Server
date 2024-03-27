import databaseConfig from "../config/database_config.mjs";

let eventconn;

export default class EventDAO {
  static async injectDB(conn) {
    if (eventconn) {
      return;
    }
    try {
      eventconn = conn
        .db(databaseConfig.database.dbName)
        .collection(databaseConfig.collections.eventsDatabase);
    } catch (e) {
      console.error(`Unable to establish a collection handle: ${e}`);
    }
  }

  static async addEventToDB(pass) {
    try {
      const insertionResult = await eventconn.insertOne(pass);
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

  static async getAllEventFromDB() {
    try {
      const events = await eventconn
        .find({ deleted_on: null, listing_visibile: true })
        .toArray();
      return events;
    } catch (e) {
      console.error(`Unable to get categories: ${e}`);
      return null;
    }
  }

  static async getAllEventByUserFromDB(id) {
    try {
      const events = await eventconn
        .find({ user_id: id, deleted_on: null })
        .toArray();
      return events;
    } catch (e) {
      console.error(`Unable to get categories: ${e}`);
      return null;
    }
  }

  static async updateEventFieldByID(id, fieldsToUpdate) {
    try {
      const event = await eventconn.findOneAndUpdate(
        { _id: id },
        { $set: fieldsToUpdate },
        { new: true }
      );
      return event;
    } catch (e) {
      console.error(`Unable to update pass field: ${e}`);
      return null;
    }
  }

  static async getAllEventsByCityFromDB(city) {
    try {
      const regex = new RegExp(city, "i");

      const events = await eventconn
        .find({ city: regex, deleted_on: null, listing_visibile: true })
        .toArray();

      return events;
    } catch (e) {
      console.error(`Unable to get events: ${e}`);
      return null;
    }
  }

  static async getEventByIDFromDB(id) {
    try {
      const event = await eventconn.findOne({ _id: id, deleted_on: null });
      return event;
    } catch (e) {
      console.error(`Unable to get category by ID: ${e}`);
      return null;
    }
  }
}
