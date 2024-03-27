import EventService from "../services/event_service.mjs";
import TokenUtil from "../utility/token_util.mjs";

export default class EventController {
  static async apiCreateEvent(req, res, next) {
    try {
      const {
        listing_visibile,
        name,
        description,
        date_time,
        address,
        city,
        latitude,
        longitude,
        max_capacity,
        price_type,
        price_starts_from,
        price_goes_upto,
        images,
        pass_ids,
        category_id,
        contact,
      } = req.body;
      const token = TokenUtil.cleanToken(req.headers["authorization"]);
      const serviceResponse = await EventService.createEvent(
        token,
        listing_visibile,
        name,
        description,
        date_time,
        address,
        city,
        latitude,
        longitude,
        max_capacity,
        price_type,
        price_starts_from,
        price_goes_upto,
        images,
        pass_ids,
        category_id,
        contact
      );
      if (typeof serviceResponse === "string") {
        res
          .status(200)
          .json({ success: false, data: {}, message: serviceResponse });
      } else {
        res.status(200).json({
          success: true,
          data: serviceResponse,
          message: "",
        });
      }
    } catch (e) {
      res.status(500).json({ success: false, data: {}, message: e.message });
    }
  }

  static async apiListEvents(req, res, next) {
    try {
      const { filter } = req.query;
      const token = TokenUtil.cleanToken(req.headers["authorization"]);
      const serviceResponse = await EventService.listEvents(filter, token);

      if (typeof serviceResponse === "string") {
        res
          .status(200)
          .json({ success: false, data: {}, message: serviceResponse });
      } else {
        res.status(200).json({
          success: true,
          data: serviceResponse,
          message: "",
        });
      }
    } catch (e) {
      res.status(500).json({ success: false, data: {}, message: e.message });
    }
  }

  static async apiDeleteEvent(req, res, next) {
    try {
      const { id } = req.query;
      const token = TokenUtil.cleanToken(req.headers["authorization"]);
      const serviceResponse = await EventService.deleteEvent(id, token);
      if (typeof serviceResponse === "string") {
        res
          .status(200)
          .json({ success: false, data: {}, message: serviceResponse });
      } else {
        res.status(200).json({
          success: true,
          data: serviceResponse,
          message: "Event deleted successfully",
        });
      }
    } catch (e) {
      res.status(500).json({ success: false, data: {}, message: e.message });
    }
  }

  static async apiUpdateEvent(req, res, next) {
    try {
      const {
        listing_visibile,
        name,
        description,
        date_time,
        address,
        city,
        latitude,
        longitude,
        max_capacity,
        price_type,
        price_starts_from,
        price_goes_upto,
        images,
        pass_ids,
        category_id,
        contact,
      } = req.body;
      const { id } = req.query;
      const updateFields = Object.fromEntries(
        Object.entries({
          listing_visibile,
          name,
          description,
          date_time,
          address,
          city,
          latitude,
          longitude,
          max_capacity,
          price_type,
          price_starts_from,
          price_goes_upto,
          images,
          pass_ids,
          category_id,
          contact,
        }).filter(([_, value]) => value !== undefined && value !== null)
      );
      const serviceResponse = await EventService.updateEventFromAPI(
        id,
        updateFields
      );
      if (typeof serviceResponse === "string") {
        res
          .status(200)
          .json({ success: false, data: {}, message: serviceResponse });
      } else {
        res.status(200).json({
          success: true,
          data: serviceResponse,
          message: "",
        });
      }
    } catch (e) {
      res.status(500).json({ success: false, data: {}, message: e.message });
    }
  }
}
