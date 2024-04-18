import UtilityService from "../services/utility_service.mjs";

export default class UtilityController {
  static async apiUpdateDoc(req, res, next) {
    try {
      const { text } = req.body;
      const { type } = req.query;

      const serviceResponse = await UtilityService.updateDoc(type, text);

      if (typeof serviceResponse === "string") {
        res
          .status(200)
          .json({ success: false, data: {}, message: serviceResponse });
      } else if (typeof serviceResponse === "number") {
        res.status(serviceResponse).json({
          success: false,
          data: {},
          message:
            "You'll need to verify your email to proceed, code is sent to your email",
        });
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

  static async apiGetDoc(req, res, next) {
    try {
      const { type } = req.query;
      const serviceResponse = await UtilityService.getDoc(type);
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
