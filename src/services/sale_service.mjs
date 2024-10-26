import { ObjectId } from "mongodb";
import PatternUtil from "../utility/pattern_util.mjs";
import CategoryService from "./category_service.mjs";
import PassService from "./pass_service.mjs";
import UserService from "./user_service.mjs";
import FirebaseUtility from "../utility/fcm_utility.mjs";
import SaleDAO from "../data/sale_dao.mjs";

export default class SaleService {
  static async connectDatabase(client) {
    try {
      await SaleDAO.injectDB(client);
    } catch (e) {
      console.error(`Unable to establish a collection handle: ${e}`);
    }
  }

  static async createEvent(
    token,
    listing_visibile,
    name,
    description,
    start_date_time,
    end_date_time,
    link_to_stores,
    website,
    discount_description,
    images,
    brand
  ) {
    try {
      const user = await UserService.getUserFromToken(token);

      const updatedUser = await UserService.updateUser(user._id, {
        app_side_preference: "lister",
      });

      const createdOn = new Date();
      const deletedOn = null;
      let notificationSentOn = null;

      const stats = {
        viewed: [],
        interested: [],
        going: [],
        bookmarked: [],
      };

      const saleDocument = {
        user_id: user._id,
        listing_visibile: listing_visibile,
        name: name,
        description: description,
        start_date_time: start_date_time,
        end_date_time: end_date_time,
        link_to_stores: link_to_stores,
        website: website,
        discount_description: discount_description,
        images: images,
        brand: brand,
        stats: stats,
        alert_sent_on: null,
        approved_on: null,
        created_on: createdOn,
        deleted_on: deletedOn,
      };

      const addedSaleId = await SaleDAO.addSaleToDB(saleDocument);

      if (
        user.email === "pfatima1709@gmail.com" ||
        user.email === "mhamzap10@gmail.com" ||
        user.email === "malikqudoos183@gmail.com"
      ) {
        await this.approveEvent(addedSaleId.toString());
      }

      let databaseEvent = await SaleDAO.getSaleByIDFromDB(addedSaleId);
      databaseEvent = await this.getFormattedEvent(databaseEvent, user.user_id);

      return { sale: databaseEvent };
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
        events = await SaleDAO.getAllSalesFromDB();
      } else if (isForUser) {
        const user = await UserService.getUserFromToken(token);
        events = await SaleDAO.getAllSalesByUserFromDB(user._id);
      } else if (isForBookmarked) {
        if (user.bookmarked && user.bookmarked.length !== 0) {
          events = await Promise.all(
            user.bookmarked.map(async (id) => {
              return await SaleDAO.getSaleByIDFromDB(id);
            })
          );
        }
        events = events.filter(Boolean);
      } else if (isForAlerted) {
        if (user.alerted && user.alerted.length !== 0) {
          events = await Promise.all(
            user.alerted.map(async (id) => {
              return await SaleDAO.getSaleByIDFromDB(id);
            })
          );
          events = events.filter(Boolean);
        }
      } else if (isForUnapproved) {
        events = await SaleDAO.getUnapprovedSalesFromDB();
      } else {
        events = await SaleDAO.getAllSalesFromDB();
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

      return {
        sales: filteredEvents.filter(
          (event) => event !== null && event !== undefined
        ),
      };
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
          message = `Hi ${eventUser.first_name}, ${event.name} just got approved by our team. Your sale is now discoverable publicly on Event Bazaar`;
        } else {
          message = `Hi ${eventUser.first_name}, ${event.name} just got approved by our team. However your sale is not discoverable publicly on Event Bazaar, please turn its visibility on to do so`;
        }
        const res = await FirebaseUtility.sendNotification(
          eventUser.fcm_token,
          event._id.toString(),
          "open_lister_events",
          "Your sale is approved 🥳🥳",
          message
        );
      }
    } catch (e) {
      console.log(e);
    }
  }

  static async notifyUsers(eventUser, event) {
    try {
      const users = await UserService.getAllUsers();

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
          "New sale near you 🎉 🎉",
          `${eventUser.first_name} just posted a new sale ${event.name}. Click here to find out more about it`
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
    let preferences = null;
    let myEvent = false;
    if (
      event.images.length === 1 &&
      Object.keys(event.images[0]).length === 0
    ) {
      event.images = [];
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
    event.stats = this.getStatsNumbers(event.stats);
    let filteredEvent = PatternUtil.renameKeys(event, {
      _id: "id",
    });

    return filteredEvent;

    // return (filteredEvent = PatternUtil.filterParametersFromObject(
    //   filteredEvent,
    //   ["created_on", "deleted_on", "alert_sent_on", "user_id"]
    // ));
  }

  static async getSaleById(id) {
    try {
      const event = await SaleDAO.getSaleByIDFromDB(id);
      return event;
    } catch (e) {
      return e.message;
    }
  }

  static async replaceCompleteSale(event) {
    try {
      const existingEvent = await SaleDAO.updateSaleFieldByID(event._id, event);

      return {};
    } catch (e) {
      return e.message;
    }
  }

  static async updateEvent(id, updateFields) {
    try {
      let existingEvent = await SaleDAO.getSaleByIDFromDB(id);

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

      existingEvent = await SaleDAO.updateSaleFieldByID(
        id,
        processedUpdateFields
      );

      const updatedEvent = await SaleDAO.getSaleByIDFromDB(id);

      const formattedEvent = await this.getFormattedEvent(updatedEvent);
      return { sale: formattedEvent };
    } catch (e) {
      console.log(e.message);
      return e.message;
    }
  }

  static async updateSaleFromAPI(id, updateFields) {
    try {
      const eventObjId = new ObjectId(id);
      let existingEvent = await SaleDAO.getSaleByIDFromDB(eventObjId);

      if (!existingEvent) {
        return "You do not have a sale with the specified ID";
      }

      const processedUpdateFields = this.convertToDotNotation(updateFields);

      existingEvent = await SaleDAO.updateSaleFieldByID(
        eventObjId,
        processedUpdateFields
      );

      const updatedEvent = await SaleDAO.getSaleByIDFromDB(eventObjId);
      const filteredEvent = await this.getFormattedEvent(
        updatedEvent,
        updatedEvent.user_id
      );

      return { sale: filteredEvent };
    } catch (e) {
      return e.message;
    }
  }

  static async approveEvent(id) {
    try {
      const eventObjId = new ObjectId(id);
      let existingEvent = await SaleDAO.getSaleByIDFromDB(eventObjId);

      if (!existingEvent) {
        return "We do not have an sale with the specified ID";
      }
      if (existingEvent.approved_on) {
        return "This sale is already approved can't re-approve it";
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
        await SaleDAO.updateSaleFieldByID(eventObjId, {
          alert_sent_on: userbaseNotifiedOn,
        });
        this.notifyUsers(user, existingEvent);
      }
      await SaleDAO.updateSaleFieldByID(eventObjId, {
        approved_on: approvedOn,
      });
      existingEvent = await SaleDAO.getSaleByIDFromDB(eventObjId);
      return { sale: existingEvent };
    } catch (e) {
      return e.message;
    }
  }

  static async deleteEvent(id, token) {
    try {
      const eventObjId = new ObjectId(id);
      let existingEvent = await SaleDAO.getSaleByIDFromDB(eventObjId);

      if (!existingEvent) {
        return "There is no such sale with the specified ID";
      }
      const user = await UserService.getUserFromToken(token);

      const eventUserId = existingEvent.user_id.toString();
      const tokenUserId = user._id.toString();

      if (eventUserId !== tokenUserId) {
        return "You do not have any such sale with the specified ID";
      }

      const deletedOn = new Date();
      existingEvent = await SaleDAO.updateSaleFieldByID(eventObjId, {
        deleted_on: deletedOn,
      });

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
