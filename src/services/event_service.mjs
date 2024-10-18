import { ObjectId } from "mongodb";
import EventDAO from "../data/event_dao.mjs";
import PatternUtil from "../utility/pattern_util.mjs";
import CategoryService from "./category_service.mjs";
import PassService from "./pass_service.mjs";
import UserService from "./user_service.mjs";
import FirebaseUtility from "../utility/fcm_utility.mjs";

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
      let passObjIds = [];
      if (passIds.length !== 0) {
        passObjIds = passIds.map((passId) => {
          return new ObjectId(passId);
        });
      }

      const [user, category] = await Promise.all([
        UserService.getUserFromToken(token),
        CategoryService.getCategoryById(categoryObjId),
      ]);

      const updatedUser = await UserService.updateUser(user._id, {
        app_side_preference: "lister",
      });

      if (!category) {
        return "No such category exists with the specified ID";
      }
      const createdOn = new Date();
      const deletedOn = null;

      let notificationSentOn = null;
      // if (listingVisibile) {
      //   notificationSentOn = createdOn;
      // }
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
        alert_sent_on: null,
        approved_on: null,
        created_on: createdOn,
        deleted_on: deletedOn,
      };

      const addedEventId = await EventDAO.addEventToDB(eventDocument);

      if (
        user.email === "pfatima1709@gmail.com" ||
        user.email === "mhamzap10@gmail.com" ||
        user.email === "malikqudoos183@gmail.com"
      ) {
        await this.approveEvent(addedEventId.toString());
      }

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
      const isForAll = filter.toLowerCase() === "all";
      const isForUser = filter.toLowerCase() === "user";
      const isForBookmarked = filter.toLowerCase() === "bookmarked";
      const isForAlerted = filter.toLowerCase() === "alerted";
      const isForUnapproved = filter.toLowerCase() === "unapproved";
      if (!user && (isForAll || isForUser || isForBookmarked || isForAlerted)) {
        return "Malformed or unknown token in the header";
      }
      let events = [];
      if (isForAll) {
        events = await EventDAO.getAllEventFromDB();
      } else if (isForUser) {
        const user = await UserService.getUserFromToken(token);
        events = await EventDAO.getAllEventByUserFromDB(user._id);
      } else if (isForBookmarked) {
        if (user.bookmarked && user.bookmarked.length !== 0) {
          events = await Promise.all(
            user.bookmarked.map(async (id) => {
              return await EventDAO.getEventByIDFromDB(id);
            })
          );
        }
        events = events.filter(Boolean);
      } else if (isForAlerted) {
        if (user.alerted && user.alerted.length !== 0) {
          events = await Promise.all(
            user.alerted.map(async (id) => {
              return await EventDAO.getEventByIDFromDB(id);
            })
          );
          events = events.filter(Boolean);
        }
      } else if (isForUnapproved) {
        events = await EventDAO.getUnapprovedEventsFromDB();
      } else {
        events = await EventDAO.getAllEventsByCityFromDB(filter);
      }
      let filteredEvents = [];
      if (events && events.length > 0) {
        filteredEvents = await Promise.all(
          events.map((event) =>
            this.getFormattedEvent(
              event,
              filter.toLowerCase() === "unapproved" ? null : user._id
            )
          )
        );
      }

      return { events: filteredEvents };
    } catch (e) {
      console.log(e);
      return e.message;
    }
  }

  static async notifyUserOfApproval(eventUser, event) {
    try {
      if (eventUser.fcm_token !== null && eventUser.fcm_token !== "x") {
        let message = "";
        if (event.listing_visibile) {
          message = `Hi ${eventUser.first_name}, ${event.name} just got approved by our team. Your event is now discoverable publicly on Event Bazaar`;
        } else {
          message = `Hi ${eventUser.first_name}, ${event.name} just got approved by our team. However your event is not discoverable publicly on Event Bazaar, please turn its visibility on to do so`;
        }
        const res = await FirebaseUtility.sendNotification(
          eventUser.fcm_token,
          event._id.toString(),
          "open_lister_events",
          "Your event is approved 🥳🥳",
          message
        );
      }
    } catch (e) {
      console.log(e);
    }
  }

  static async notifyNearByUsers(eventUser, event) {
    try {
      const users = await UserService.getUserByCity(event.city);

      for (const user of users) {
        if (
          user.fcm_token === null ||
          user.fcm_token === "x" ||
          user._id.toString() === eventUser._id.toString()
        ) {
          continue;
        }

        const alerted = user.alerted;
        alerted.push(event._id);
        user.alerted = alerted;
        await UserService.updateUserByUser(user);
        const res = await FirebaseUtility.sendNotification(
          user.fcm_token,
          event._id.toString(),
          "open_alerts",
          "New event near you 🎉 🎉",
          `${eventUser.first_name} just posted a new event ${event.name}. Click here to find out more about it`
        );
      }
    } catch (e) {
      console.log(e);
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
    let myEvent = false;
    if (
      event.images.length === 1 &&
      Object.keys(event.images[0]).length === 0
    ) {
      event.images = null;
    }
    event.my_event = myEvent;
    if (userId) {
      if (event.user_id.toString() === userId.toString()) {
        myEvent = true;
      }
      event.my_event = myEvent;
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
      ["created_on", "deleted_on", "alert_sent_on", "user_id"]
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

      if (updateFields.pass_ids) {
        const passObjIds = updateFields.pass_ids.map((passId) => {
          return new ObjectId(passId);
        });
        updateFields.pass_ids = passObjIds;
      }

      const processedUpdateFields = this.convertToDotNotation(updateFields);

      existingEvent = await EventDAO.updateEventFieldByID(
        id,
        processedUpdateFields
      );

      const updatedEvent = await EventDAO.getEventByIDFromDB(id);

      const formattedEvent = await this.getFormattedEvent(updatedEvent);
      return { event: formattedEvent };
    } catch (e) {
      console.log(e.message);
      return e.message;
    }
  }

  static async replaceCompleteEvent(event) {
    try {
      const existingEvent = await EventDAO.updateEventFieldByID(
        event._id,
        event
      );

      return {};
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

      if (updateFields.pass_ids) {
        const passObjIds = updateFields.pass_ids.map((passId) => {
          return new ObjectId(passId);
        });
        existingEvent = await EventDAO.updateEventFieldByID(eventObjId, {
          pass_ids: passObjIds,
        });
        const databasePasses = await PassService.getPassesAndConnectEvent(
          passObjIds,
          eventObjId
        );
        delete updateFields.pass_ids;
      }
      if (updateFields.category_id) {
        const categoryObjId = new ObjectId(updateFields.category_id);
        existingEvent = await EventDAO.updateEventFieldByID(eventObjId, {
          category_id: categoryObjId,
        });
        delete updateFields.category_id;
      }

      const processedUpdateFields = this.convertToDotNotation(updateFields);

      existingEvent = await EventDAO.updateEventFieldByID(
        eventObjId,
        processedUpdateFields
      );

      const updatedEvent = await EventDAO.getEventByIDFromDB(eventObjId);
      const filteredEvent = await this.getFormattedEvent(
        updatedEvent,
        updatedEvent.user_id
      );

      return { event: filteredEvent };
    } catch (e) {
      return e.message;
    }
  }

  static async approveEvent(id) {
    try {
      const eventObjId = new ObjectId(id);
      let existingEvent = await EventDAO.getEventByIDFromDB(eventObjId);

      if (!existingEvent) {
        return "We do not have an event with the specified ID";
      }
      if (existingEvent.approved_on) {
        return "This event is already approved can't re-approve it";
      }
      let user = await UserService.getUserByID(existingEvent.user_id);
      if (!user) {
        return "We do not have an user with the specified ID";
      }

      const approvedOn = new Date();
      await this.notifyUserOfApproval(user, existingEvent);

      if (
        existingEvent.listing_visibile &&
        existingEvent.alert_sent_on === null
      ) {
        const userbaseNotifiedOn = new Date();
        await EventDAO.updateEventFieldByID(eventObjId, {
          alert_sent_on: userbaseNotifiedOn,
        });
        this.notifyNearByUsers(user, existingEvent);
      }
      await EventDAO.updateEventFieldByID(eventObjId, {
        approved_on: approvedOn,
      });
      existingEvent = await EventDAO.getEventByIDFromDB(eventObjId);
      return { event: existingEvent };
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

  static convertToDotNotation(updateFields) {
    const processedUpdateFields = {};
    for (const key in updateFields) {
      if (Object.prototype.hasOwnProperty.call(updateFields, key)) {
        if (
          typeof updateFields[key] === "object" &&
          updateFields[key] !== null
        ) {
          const nestedFields = this.convertToDotNotation(updateFields[key]);
          for (const nestedKey in nestedFields) {
            if (Object.prototype.hasOwnProperty.call(nestedFields, nestedKey)) {
              processedUpdateFields[`${key}.${nestedKey}`] =
                nestedFields[nestedKey];
            }
          }
        } else {
          processedUpdateFields[key] = updateFields[key];
        }
      }
    }
    return processedUpdateFields;
  }
}
