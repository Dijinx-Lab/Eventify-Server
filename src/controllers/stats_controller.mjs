import TokenUtil from "../utility/token_util.mjs";
import StatsService from "../services/stats_service.mjs";

export default class StatsController {
  static async apiUpdateEventStats(req, res, next) {
    try {
      const { preference, bookmarked } = req.body;
      const { id, sale } = req.query;
      const token = TokenUtil.cleanToken(req.headers["authorization"]);
      const serviceResponse = await StatsService.updateStats(
        token,
        id,
        sale,
        preference,
        bookmarked
      );
      if (typeof serviceResponse === "string") {
        res
          .status(200)
          .json({ success: false, data: {}, message: serviceResponse });
      } else {
        res.status(200).json({
          success: true,
          data: serviceResponse,
          message: "Stats changes updated successfully",
        });
      }
    } catch (e) {
      res.status(500).json({ success: false, data: {}, message: e.message });
    }
  }

  static async getStatsUser(req, res, next) {
    try {
      const { id, filter, sale } = req.query;
      const serviceResponse = await StatsService.getStatsUser(id, filter, sale);
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
