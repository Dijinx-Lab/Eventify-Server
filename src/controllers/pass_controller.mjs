import PassService from "../services/pass_service.mjs";

export default class PassController {
  static async apiCreatePass(req, res, next) {
    try {
      const { event_id, name, full_price, discount } = req.body;

      const serviceResponse = await PassService.createPass(
        event_id,
        name,
        full_price,
        discount
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

  static async apiUpdatePass(req, res, next) {
    try {
      const { event_id, name, full_price, discount } = req.body;
      const { id } = req.query;
      const updateFields = Object.fromEntries(
        Object.entries({
          event_id,
          name,
          full_price,
          discount,
        }).filter(([_, value]) => value !== undefined && value !== null)
      );

      const serviceResponse = await PassService.updatePass(id, updateFields);

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

  static async apiDeletePass(req, res, next) {
    try {
      const { id } = req.query;
      const serviceResponse = await PassService.deletePass(id);
      if (typeof serviceResponse === "string") {
        res
          .status(200)
          .json({ success: false, data: {}, message: serviceResponse });
      } else {
        res.status(200).json({
          success: true,
          data: serviceResponse,
          message: "Pass deleted successfully",
        });
      }
    } catch (e) {
      res.status(500).json({ success: false, data: {}, message: e.message });
    }
  }
}
