import UserService from "../services/user_service.mjs";
import TokenUtil from "../utility/token_util.mjs";

export default class UserController {
  static async apiCreateOrGetUserAccount(req, res, next) {
    try {
      const {
        first_name,
        last_name,
        email,
        age,
        country_code,
        phone,
        password,
        confirm_password,
        fcm_token,
      } = req.body;

      const serviceResponse = await UserService.createUserAccount(
        first_name,
        last_name,
        email,
        age,
        country_code,
        phone,
        password,
        confirm_password,
        fcm_token
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

  static async apiSignInUser(req, res, next) {
    try {
      const { email, phone, country_code, password, fcm_token } = req.body;

      const serviceResponse = await UserService.signInUser(
        email,
        phone,
        country_code,
        password,
        fcm_token
      );

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

  static async apiSsoUser(req, res, next) {
    try {
      const { email, name, apple_id, google_id, fcm_token } = req.body;

      const serviceResponse = await UserService.ssoUser(
        email,
        name,
        apple_id,
        google_id,
        fcm_token
      );

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

  static async apiGetUserDetail(req, res, next) {
    try {
      const token = TokenUtil.cleanToken(req.headers["authorization"]);
      const serviceResponse = await UserService.getUserDetails(token);
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

  static async apiSignOutUser(req, res, next) {
    try {
      const token = TokenUtil.cleanToken(req.headers["authorization"]);
      const serviceResponse = await UserService.signOutUser(token);
      if (typeof serviceResponse === "string") {
        res
          .status(200)
          .json({ success: false, data: {}, message: serviceResponse });
      } else {
        res.status(200).json({
          success: true,
          data: serviceResponse,
          message: "User signed out successfully",
        });
      }
    } catch (e) {
      res.status(500).json({ success: false, data: {}, message: e.message });
    }
  }

  static async apiVerifyCredential(req, res, next) {
    try {
      const { type, code, email } = req.body;

      const serviceResponse = await UserService.verifyCredentials(
        type,
        code,
        email
      );
      if (typeof serviceResponse === "string") {
        res
          .status(200)
          .json({ success: false, data: {}, message: serviceResponse });
      } else {
        res.status(200).json({
          success: true,
          data: serviceResponse,
          message: "Verified successfully",
        });
      }
    } catch (e) {
      res.status(500).json({ success: false, data: {}, message: e.message });
    }
  }

  static async apiSendVerification(req, res, next) {
    try {
      const { type, email } = req.body;
      const serviceResponse = await UserService.sendVerification(type, email);
      if (typeof serviceResponse === "string") {
        res
          .status(200)
          .json({ success: false, data: {}, message: serviceResponse });
      } else {
        res.status(200).json({
          success: true,
          data: serviceResponse,
          message: `A code has been sent to your ${email}, please check your inbox`,
        });
      }
    } catch (e) {
      res.status(500).json({ success: false, data: {}, message: e.message });
    }
  }

  static async apiUpdateUserProfile(req, res, next) {
    try {
      const {
        first_name,
        last_name,
        phone,
        country_code,
        last_city,
        fcm_token,
      } = req.body;
      const updateFields = Object.fromEntries(
        Object.entries({
          first_name,
          last_name,
          phone,
          country_code,
          last_city,
          fcm_token,
        }).filter(([_, value]) => value !== undefined && value !== null)
      );
      const token = TokenUtil.cleanToken(req.headers["authorization"]);
      const serviceResponse = await UserService.updateProfile(
        token,
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

  static async apiUpdateUserPassword(req, res, next) {
    try {
      const { old_password, password, confirm_password } = req.body;
      const token = TokenUtil.cleanToken(req.headers["authorization"]);
      const serviceResponse = await UserService.updatePassword(
        token,
        old_password,
        password,
        confirm_password
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

  static async apiForgotPassword(req, res, next) {
    try {
      const { email, password, confirm_password } = req.body;
      const serviceResponse = await UserService.forgotPassword(
        email,
        password,
        confirm_password
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
