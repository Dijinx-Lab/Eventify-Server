import SaleService from "../services/sale_service.mjs";
import TokenUtil from "../utility/token_util.mjs";

export default class SaleController {
  static async apiCreateEvent(req, res, next) {
    try {
      const {
        listing_visibile,
        name,
        description,
        start_date_time,
        end_date_time,
        link_to_stores,
        website,
        discount_description,
        images,
        contact,
      } = req.body;
      const token = TokenUtil.cleanToken(req.headers["authorization"]);
      const serviceResponse = await SaleService.createEvent(
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
      const serviceResponse = await SaleService.listEvents(filter, token);

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
      const serviceResponse = await SaleService.deleteEvent(id, token);
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
        start_date_time,
        end_date_time,
        link_to_stores,
        website,
        discount_description,
        images,
        contact,
      } = req.body;
      const { id } = req.query;
      const updateFields = Object.fromEntries(
        Object.entries({
          listing_visibile,
          name,
          description,
          start_date_time,
          end_date_time,
          link_to_stores,
          website,
          discount_description,
          images,
          contact,
        }).filter(([_, value]) => value !== undefined && value !== null)
      );
      const serviceResponse = await SaleService.updateSaleFromAPI(
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

  static async apiApproveEvent(req, res, next) {
    try {
      const { id } = req.query;

      const serviceResponse = await SaleService.approveEvent(id);
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
