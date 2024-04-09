import UtilityDAO from "../data/utility_dao.mjs";
import PatternUtil from "../utility/pattern_util.mjs";

export default class UtilityService {
  static async connectDatabase(client) {
    try {
      await UtilityDAO.injectDB(client);
    } catch (e) {
      console.error(`Unable to establish a collection handle: ${e}`);
    }
  }

  static async updateDoc(type, text) {
    try {
      if (type !== "terms" && type !== "privacy") return "Invalid type";

      let doc = await UtilityDAO.getDocByType(type);
      if (doc) {
        doc.text = text;
        await UtilityDAO.updateDocInDB(type, doc);
      } else {
        const createdOn = new Date();
        const deletedOn = null;

        const document = {
          type: type,
          text: text,
          created_on: createdOn,
          deleted_on: deletedOn,
        };

        await UtilityDAO.addDocToDB(document);
      }
      doc = await UtilityDAO.getDocByType(type);

      doc = PatternUtil.filterParametersFromObject(doc, [
        "_id",
        "created_on",
        "deleted_on",
      ]);

      return { doc: doc };
    } catch (e) {
      return e.message;
    }
  }

  static async getDoc(type) {
    try {
      let databaseDoc = await UtilityDAO.getDocByType(type);

      if (!databaseDoc) return "Invalid type";

      databaseDoc = PatternUtil.filterParametersFromObject(databaseDoc, [
        "_id",
        "created_on",
        "deleted_on",
      ]);

      return { doc: databaseDoc };
    } catch (e) {
      return null;
    }
  }
}
