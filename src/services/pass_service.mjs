import { ObjectId } from "mongodb";
import PassDAO from "../data/pass_dao.mjs";
import PatternUtil from "../utility/pattern_util.mjs";
import EventService from "./event_service.mjs";

export default class PassService {
  static async connectDatabase(client) {
    try {
      await PassDAO.injectDB(client);
    } catch (e) {
      console.error(`Unable to establish a collection handle: ${e}`);
    }
  }

  static async createPasses(passes) {
    try {
      const passIds = [];
      for (const pass of passes) {
        const { name, full_price, discount } = pass;
        const addedPassId = await this.addPassToDB(name, full_price, discount);
        passIds.push(addedPassId);
      }
      return { pass_ids: passIds };
    } catch (error) {
      return error.message;
    }
  }

  static async addPassToDB(name, fullPrice, discount) {
    try {
      const passDocument = {
        event_id: "",
        name: name,
        full_price: fullPrice,
        discount: discount ?? null,
        created_on: new Date(),
        deleted_on: null,
      };

      const addedPassId = await PassDAO.addPassToDB(passDocument);

      return addedPassId;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  static async createPass(eventId, name, fullPrice, discount) {
    try {
      if (discount) {
        const allKeysExist = [
          "discounted_price",
          "percentage",
          "last_date",
        ].every((key) => discount.hasOwnProperty(key));
        if (!allKeysExist) {
          return "Missing the required fields in the discount object, must add discounted_price, percentage and last_date";
        }
      }
      let event;
      const createdOn = new Date();
      const deletedOn = null;
      let eventObjId = "";

      if (eventId && eventId !== "") {
        eventObjId = new ObjectId(eventId);
        event = await EventService.getEventById(eventObjId);
        if (!event) {
          return "There is no such event with the specified ID";
        }
      }

      const passDocument = {
        event_id: eventObjId,
        name: name,
        full_price: fullPrice,
        discount: discount,
        created_on: createdOn,
        deleted_on: deletedOn,
      };

      const addedPassId = await PassDAO.addPassToDB(passDocument);

      if (eventId && eventId !== "") {
        let passIds = event.pass_ids;
        passIds.push(addedPassId);
        event.pass_ids = passIds;
        event = EventService.updateEvent(eventObjId, event);
      }

      const databasePass = await PassDAO.getPassByIDFromDB(addedPassId);

      let filteredPass = PatternUtil.renameKeys(databasePass, { _id: "id" });

      filteredPass = PatternUtil.filterParametersFromObject(filteredPass, [
        "event_id",
        "created_on",
        "deleted_on",
      ]);

      return { pass: filteredPass };
    } catch (e) {
      return e.message;
    }
  }

  static async updatePass(id, updateFields) {
    try {
      const passObjId = new ObjectId(id);
      let existingPass = await PassDAO.getPassByIDFromDB(passObjId);

      if (!existingPass) {
        return "You do not have a pass with the specified ID";
      }

      const processedUpdateFields = this.convertToDotNotation(updateFields);

      existingPass = await PassDAO.updatePassFieldByID(
        passObjId,
        processedUpdateFields
      );

      const updatedPass = await PassDAO.getPassByIDFromDB(passObjId);
      let filteredPass = PatternUtil.renameKeys(updatedPass, { _id: "id" });

      filteredPass = PatternUtil.filterParametersFromObject(filteredPass, [
        "event_id",
        "created_on",
        "deleted_on",
      ]);

      return { pass: filteredPass };
    } catch (e) {
      return e.message;
    }
  }

  static async deletePass(id) {
    try {
      const passObjId = new ObjectId(id);
      let existingPass = await PassDAO.getPassByIDFromDB(passObjId);

      if (!existingPass) {
        return "You do not have a pass with the specified ID";
      }

      if (existingPass.event_id !== "") {
        let event = await EventService.getEventById(existingPass.event_id);
        let passIds = event.pass_ids;
        event.pass_ids = passIds.filter((passId) => passId.toString() !== id);
        event = EventService.updateEvent(existingPass.event_id, event);
      }

      existingPass = await PassDAO.deletePassByIDFromDB(passObjId);

      return {};
    } catch (e) {
      return e.message;
    }
  }

  static async deletePasses(id) {
    try {
      const eventObjId = new ObjectId(id);
      const existingPass = await PassDAO.deletePassByEventIDFromDB(eventObjId);
      return {};
    } catch (e) {
      return e.message;
    }
  }

  static async softDeletePass(id) {
    try {
      const passObjId = new ObjectId(id);
      let existingPass = await PassDAO.getPassByIDFromDB(passObjId);

      if (!existingPass) {
        return "You do not have a pass with the specified ID";
      }
      const deletedOn = new Date();
      existingPass = await PassDAO.updatePassFieldByID(passObjId, {
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

  static async getPassesAndConnectEvent(passIds, eventId) {
    try {
      const updatedPasses = [];

      for (const passObjId of passIds) {
        let databasePass = await PassDAO.getPassByIDFromDB(passObjId);
        if (!databasePass.event_id !== "") {
          databasePass = await PassDAO.updatePassFieldByID(passObjId, {
            event_id: eventId,
          });
        }

        let filteredPass = PatternUtil.renameKeys(databasePass, { _id: "id" });
        filteredPass = PatternUtil.filterParametersFromObject(filteredPass, [
          "event_id",
          "created_on",
          "deleted_on",
        ]);

        updatedPasses.push(filteredPass);
      }

      return updatedPasses;
    } catch (e) {
      return e.message;
    }
  }

  static async getPassesByEventId(eventId) {
    try {
      let filteredPasses = [];

      const databasePasses = await PassDAO.getPassesByEventIDFromDB(eventId);

      if (databasePasses && databasePasses.length > 0) {
        filteredPasses = databasePasses.map((pass) => {
          let filteredPass = PatternUtil.renameKeys(pass, { _id: "id" });
          return PatternUtil.filterParametersFromObject(filteredPass, [
            "event_id",
            "created_on",
            "deleted_on",
          ]);
        });
      }

      return filteredPasses;
    } catch (e) {
      return e.message;
    }
  }
}
