import nodemailer from "nodemailer";
import appConfig from "../config/app_config.mjs";

class EmailUtility {
  static initialize(smtpConfig) {
    if (!EmailUtility.transporter) {
      EmailUtility.transporter = nodemailer.createTransport(smtpConfig);
    }
  }

  static async sendMail(to, subject, body) {
    if (!EmailUtility.transporter) {
      throw new Error(
        "Transporter is not initialized. Call EmailUtility.initialize first."
      );
    }

    const mailOptions = {
      from: appConfig.smtp.user,
      to: to,
      subject: subject,
      html: body,
    };

    return await EmailUtility.transporter.sendMail(mailOptions);
  }
}

export default EmailUtility;
