import { ObjectId } from "mongodb";
import EventDAO from "../data/event_dao.mjs";
import PatternUtil from "../utility/pattern_util.mjs";
import CategoryService from "./category_service.mjs";
import PassService from "./pass_service.mjs";
import UserService from "./user_service.mjs";

export default class EventService {
  static async connectDatabase(client) {
    try {
      await EventDAO.injectDB(client);
    } catch (e) {
      console.error(`Unable to establish a collection handle: ${e}`);
    }
  }

  static async createEvent(
    token,
    listingVisibile,
    name,
    description,
    dateTime,
    address,
    city,
    latitude,
    longitude,
    maxCapacity,
    priceType,
    priceStartsFrom,
    priceGoesUpto,
    images,
    passIds,
    categoryId,
    contact
  ) {
    try {
      const categoryObjId = new ObjectId(categoryId);
      const passObjIds = passIds.map((passId) => {
        return new ObjectId(passId);
      });
      console.log(passObjIds);
      const [user, category] = await Promise.all([
        UserService.getUserFromToken(token),
        CategoryService.getCategoryById(categoryObjId),
      ]);
      if (!category) {
        return "No such category exists with the specified ID";
      }
      const createdOn = new Date();
      const deletedOn = null;

      let notificationSentOn = null;
      if (listingVisibile) {
        notificationSentOn = createdOn;
      }
      const stats = {
        viewed: [],
        interested: [],
        going: [],
        bookmarked: [],
      };

      const eventDocument = {
        user_id: user._id,
        listing_visibile: listingVisibile,
        name: name,
        description: description,
        date_time: dateTime,
        address: address,
        city: city,
        latitude: latitude,
        longitude: longitude,
        max_capacity: maxCapacity,
        price_type: priceType,
        price_starts_from: priceStartsFrom,
        price_goes_upto: priceGoesUpto,
        images: images,
        pass_ids: passObjIds,
        category_id: categoryObjId,
        contact: contact,
        stats: stats,
        alert_sent_on: notificationSentOn,
        created_on: createdOn,
        deleted_on: deletedOn,
      };

      const addedEventId = await EventDAO.addEventToDB(eventDocument);

      let [databaseEvent, databasePasses] = await Promise.all([
        EventDAO.getEventByIDFromDB(addedEventId),
        PassService.getPassesAndConnectEvent(passObjIds, addedEventId),
      ]);
      databaseEvent.pass_ids = databasePasses;
      databaseEvent.category = category;
      databaseEvent.stats = this.getStatsNumbers(databaseEvent.stats);

      let filteredEvent = PatternUtil.renameKeys(databaseEvent, {
        _id: "id",
        pass_ids: "passes",
        category_id: "category",
      });

      filteredEvent = PatternUtil.filterParametersFromObject(filteredEvent, [
        "created_on",
        "deleted_on",
        "alert_sent_on",
        "listing_visibile",
        "user_id",
      ]);

      return { event: filteredEvent };
    } catch (e) {
      return e.message;
    }
  }

  static async listEvents(filter, token) {
    try {
      const user = await UserService.getUserFromToken(token);

      let events = [];
      if (filter.toLowerCase() === "all") {
        events = await EventDAO.getAllEventFromDB();
      } else if (filter.toLowerCase() === "user") {
        const user = UserService.getUserFromToken(token);
        events = await EventDAO.getAllEventByUserFromDB(user._id);
      } else {
        events = await EventDAO.getAllEventsByCityFromDB(filter);
      }

      let filteredEvents = [];
      if (events && events.length > 0) {
        filteredEvents = await Promise.all(
          events.map((event) => this.getFormattedEvent(event, user._id))
        );
      }

      return { events: filteredEvents };
    } catch (e) {
      return e.message;
    }
  }

  static getStatsNumbers(stats) {
    const numberedStats = {
      viewed: stats.viewed.length,
      interested: stats.interested.length,
      going: stats.going.length,
      bookmarked: stats.bookmarked.length,
    };
    return numberedStats;
  }

  static async getFormattedEvent(event, userId) {
    let [category, passes] = await Promise.all([
      CategoryService.getCategoryById(event.category_id),
      PassService.getPassesByEventId(event._id),
    ]);
    let preferences = null;
    if (userId) {
      let bookmarked = false;
      let preference = null;

      if (
        event.stats.interested
          .map((objId) => objId.toString())
          .includes(userId.toString())
      ) {
        preference = "interested";
      } else if (
        event.stats.going
          .map((objId) => objId.toString())
          .includes(userId.toString())
      ) {
        preference = "going";
      }
      if (
        event.stats.bookmarked
          .map((objId) => objId.toString())
          .includes(userId.toString())
      ) {
        bookmarked = true;
      }
      preferences = {
        bookmarked: bookmarked,
        preference: preference,
      };
    }
    event.preference = preferences;
    event.pass_ids = passes;
    event.category = category;
    event.stats = this.getStatsNumbers(event.stats);
    let filteredEvent = PatternUtil.renameKeys(event, {
      _id: "id",
      pass_ids: "passes",
      category_id: "category",
    });

    return (filteredEvent = PatternUtil.filterParametersFromObject(
      filteredEvent,
      [
        "created_on",
        "deleted_on",
        "alert_sent_on",
        "listing_visibile",
        "user_id",
      ]
    ));
  }

  static async getEventById(id) {
    try {
      const event = await EventDAO.getEventByIDFromDB(id);
      return event;
    } catch (e) {
      return e.message;
    }
  }

  static async updateEvent(id, updateFields) {
    try {
      let existingEvent = await EventDAO.getEventByIDFromDB(id);

      if (!existingEvent) {
        return "We do not have an event with the specified ID";
      }

      existingEvent = await EventDAO.updateEventFieldByID(id, updateFields);

      const updatedEvent = await EventDAO.getEventByIDFromDB(id);
      const formattedEvent = await this.getFormattedEvent(updatedEvent);
      return { event: formattedEvent };
    } catch (e) {
      console.log(e.message);
      return e.message;
    }
  }

  static async updateEventFromAPI(id, updateFields) {
    try {
      const eventObjId = new ObjectId(id);
      let existingEvent = await EventDAO.getEventByIDFromDB(eventObjId);

      if (!existingEvent) {
        return "You do not have an event with the specified ID";
      }

      const processedUpdateFields = this.convertToDotNotation(updateFields);

      existingEvent = await EventDAO.updateEventFieldByID(
        eventObjId,
        processedUpdateFields
      );

      const updatedEvent = await EventDAO.getEventByIDFromDB(eventObjId);
      const filteredEvent = await this.getFormattedEvent(updatedEvent);

      return { event: filteredEvent };
    } catch (e) {
      return e.message;
    }
  }

  static async deleteEvent(id, token) {
    try {
      const eventObjId = new ObjectId(id);
      let existingEvent = await EventDAO.getEventByIDFromDB(eventObjId);
      if (!existingEvent) {
        return "There is no such event with the specified ID";
      }
      const user = await UserService.getUserFromToken(token);

      const eventUserId = existingEvent.user_id.toString();
      const tokenUserId = user._id.toString();

      if (eventUserId !== tokenUserId) {
        return "You do not have any such event with the specified ID";
      }

      const deletedOn = new Date();
      existingEvent = await EventDAO.updateEventFieldByID(eventObjId, {
        deleted_on: deletedOn,
      });

      const passIds = existingEvent.pass_ids;
      if (passIds.length > 0) {
        await Promise.all(
          passIds.map(async (id) => {
            await PassService.softDeletePass(id);
          })
        );
      }

      return {};
    } catch (e) {
      return e.message;
    }
  }

  static convertToDotNotation(updateFields, prefix = "") {
    const processedUpdateFields = {};
    for (const key in updateFields) {
      if (Object.prototype.hasOwnProperty.call(updateFields, key)) {
        const value = updateFields[key];
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (Array.isArray(value)) {
          processedUpdateFields[newKey] = value.map((item, index) => {
            if (typeof item === "object" && item !== null) {
              return this.convertToDotNotation(item, `${newKey}.${index}`);
            } else {
              return item;
            }
          });
        } else if (typeof value === "object" && value !== null) {
          const nestedFields = this.convertToDotNotation(value, newKey);
          Object.assign(processedUpdateFields, nestedFields);
        } else {
          processedUpdateFields[newKey] = value;
        }
      }
    }
    return processedUpdateFields;
  }
}
