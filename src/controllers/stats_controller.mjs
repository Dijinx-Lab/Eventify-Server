import TokenUtil from "../utility/token_util.mjs";
import StatsService from "../services/stats_service.mjs";

export default class StatsController {
  static async apiUpdateEventStats(req, res, next) {
    try {
      const { preference, bookmarked } = req.body;
      const { id } = req.query;
      const token = TokenUtil.cleanToken(req.headers["authorization"]);
      const serviceResponse = await StatsService.updateStats(
        token,
        id,
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
}
