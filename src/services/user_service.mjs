import UserDAO from "../data/user_dao.mjs";
import TokenUtil from "../utility/token_util.mjs";
import PatternUtil from "../utility/pattern_util.mjs";
import AuthUtil from "../utility/auth_util.mjs";
import EmailUtility from "../utility/email_util.mjs";

export default class UserService {
  static async connectDatabase(client) {
    try {
      await UserDAO.injectDB(client);
    } catch (e) {
      console.error(`Unable to establish a collection handle: ${e}`);
    }
  }

  static async checkCreateAccountValidations(
    firstName,
    lastName,
    email,
    countryCode,
    phone,
    password,
    confirmPassword
  ) {
    const passwordCheck = PatternUtil.checkPasswordLength(password);
    if (!passwordCheck) {
      return "Password's length should be greater than 8 characters";
    }
    const passwordsMatch = password === confirmPassword;
    if (!passwordsMatch) {
      return "Passwords do not match";
    }
    const emailCheck = PatternUtil.checkEmailPattern(email);
    if (!emailCheck) {
      return "Please enter a valid email address";
    }
    const phoneCheck = PatternUtil.checkPhoneNumber(phone);

    if (!phoneCheck) {
      return "Please enter a valid phone number";
    }
    const nameCheck =
      PatternUtil.checkAlphabeticName(firstName) &&
      PatternUtil.checkAlphabeticName(lastName);
    if (!nameCheck) {
      return "Your name can not contain any numbers and special characters";
    }
    let existingUser = await UserDAO.getUserByEmailFromDB(email);
    if (existingUser) {
      return "A user with this email already exists on Event Bazaar, please choose another or sign in instead";
    }
    existingUser = await UserDAO.getUserByPhoneFromDB(countryCode, phone);
    if (existingUser) {
      return "A user with this phone already exists on Event Bazaar, please choose another or sign in instead";
    }
    return null;
  }

  static async checkSignInAccountValidations(
    email,
    phone,
    countryCode,
    password
  ) {
    let errorString;
    let existingUser;

    if (email) {
      existingUser = await UserDAO.getUserByEmailFromDB(email);
      if (!existingUser) {
        errorString = "Either your email or password is incorrect";
      }
    } else if (phone) {
      existingUser = await UserDAO.getUserByPhoneFromDB(countryCode, phone);
      if (!existingUser) {
        errorString = "Either your phone number or password is incorrect";
      }
    } else {
      errorString = "Either phone or email is required to identify you";
    }

    if (!errorString) {
      if (!existingUser.password) {
        errorString =
          "An account with this email already exists with another sign-in method, please use that";
      } else {
        const passwordCheck = await AuthUtil.comparePasswords(
          password,
          existingUser.password
        );
        if (!passwordCheck) {
          if (phone) {
            errorString = "Either your phone number or password is incorrect";
          } else {
            errorString = "Either your email or password is incorrect";
          }
        }
      }
    }

    if (errorString) {
      return errorString;
    } else {
      return existingUser;
    }
  }

  static async checkPasswordChangeValidations(
    existingUser,
    oldPassword,
    password,
    confirmPassword
  ) {
    let errorString;
    if (oldPassword) {
      const passwordCheck = await AuthUtil.comparePasswords(
        oldPassword,
        existingUser.password
      );
      if (!passwordCheck) {
        errorString = "The provided previous password is incorrect";
      }
    }
    if (!errorString) {
      const passwordCheck = PatternUtil.checkPasswordLength(password);
      if (!passwordCheck) {
        return "New password's length should be greater than 8 characters";
      }
      const passwordsMatch = password === confirmPassword;
      if (!passwordsMatch) {
        return "New passwords do not match";
      }
    }

    if (errorString) {
      return errorString;
    } else {
      return existingUser;
    }
  }

  static async createUserAccount(
    firstName,
    lastName,
    email,
    age,
    countryCode,
    phone,
    password,
    confirmPassword,
    fcmToken
  ) {
    try {
      const validationCheck = await this.checkCreateAccountValidations(
        firstName,
        lastName,
        email,
        countryCode,
        phone,
        password,
        confirmPassword
      );

      if (typeof validationCheck === "string") {
        return validationCheck;
      }

      const createdOn = new Date();
      const deletedOn = null;
      const emailVerifiedOn = null;
      const phoneVerifiedOn = null;
      const otpCode = PatternUtil.generateRandomCode();
      const verification = {
        email: otpCode,
      };
      const hashedPassword = await AuthUtil.hashPassword(password);
      const authToken = TokenUtil.createToken({
        phone: phone,
        email: email,
        last_signin_on: createdOn,
      });

      const userDocument = {
        first_name: firstName,
        last_name: lastName,
        age: age,
        email: email,
        country_code: countryCode,
        last_city: null,
        phone: phone,
        fcm_token: fcmToken,
        role: "user",
        auth_token: authToken,
        password: hashedPassword,
        bookmarked: [],
        alerted: [],
        verification: verification,
        last_signin_on: createdOn,
        app_side_preference: "new",
        email_verified_on: emailVerifiedOn,
        phone_verified_on: phoneVerifiedOn,
        created_on: createdOn,
        deleted_on: deletedOn,
      };

      const addedUserId = await UserDAO.addUserToDB(userDocument);

      const databaseUser = await UserDAO.getUserByIDFromDB(addedUserId);

      const filteredUser = this.getFormattedUser(databaseUser);

      filteredUser.login_method = "email";
      const emailResponse = await EmailUtility.sendMail(
        email,
        "Verify Your Event Bazaar Account",
        `<h1>${otpCode}</h1>`
      );

      return { user: filteredUser };
    } catch (e) {
      return e.message;
    }
  }

  static async verifyCredentials(type, code, email) {
    try {
      let existingUser = await UserDAO.getUserByEmailFromDB(email);

      let verification = existingUser.verification;
      if (type === "email") {
        const emailOtp = verification.email;

        if (code != emailOtp) {
          return "Please enter a valid code, the provided one is incorrect";
        }
        const emailVerifiedOn = new Date();
        delete verification[email];
        const processedUpdateFields = {
          email_verified_on: emailVerifiedOn,
        };
        existingUser = await UserDAO.updateUserFieldByID(
          existingUser._id,
          processedUpdateFields
        );
        existingUser.login_method = "email";
      } else if (type === "password") {
        const passwordOtp = verification.password;
        if (code != passwordOtp) {
          return "Please enter a valid code, the provided one is incorrect";
        } else {
          return {};
        }
      } else {
        return "Mismatched type";
      }

      existingUser = await UserDAO.getUserByIDFromDB(existingUser._id);

      const filteredUser = this.getFormattedUser(existingUser);

      filteredUser.login_method = "email";

      return { user: filteredUser };
    } catch (e) {
      return e.message;
    }
  }

  static async sendVerification(type, email) {
    try {
      let existingUser = await UserDAO.getUserByEmailFromDB(email);
      if (!existingUser) {
        return "No such user exists with the specified email";
      }
      if (existingUser.google_id || existingUser.apple_id) {
        return "This account was created with social logins and does not have a password to reset";
      }

      const otpCode = PatternUtil.generateRandomCode();

      let verification;
      if (type == "email") {
        verification = {
          email: otpCode,
        };
      } else {
        verification = {
          password: otpCode,
        };
      }
      const processedUpdateFields = this.convertToDotNotation({
        verification: verification,
      });

      existingUser = await UserDAO.updateUserFieldByID(
        existingUser._id,
        processedUpdateFields
      );

      const emailResponse = await EmailUtility.sendMail(
        email,
        "Verify Your Event Bazaar Account",
        `<h1>${otpCode}</h1>`
      );

      return {};
    } catch (e) {
      return e.message;
    }
  }

  static async updateProfile(token, updateFields) {
    try {
      let databaseUser = await this.getUserFromToken(token);

      const processedUpdateFields = this.convertToDotNotation(updateFields);

      databaseUser = await UserDAO.updateUserFieldByID(
        databaseUser._id,
        processedUpdateFields
      );

      const updatedUser = await UserDAO.getUserByIDFromDB(databaseUser._id);
      const filteredUser = this.getFormattedUser(updatedUser);

      return { user: filteredUser };
    } catch (e) {
      return e.message;
    }
  }

  static async updateUserByUser(user) {
    try {
      const databaseUser = await UserDAO.updateUserFieldByID(user._id, user);

      return {};
    } catch (e) {
      return e.message;
    }
  }

  static async updatePassword(token, oldPassword, password, confirmPassword) {
    try {
      let databaseUser = await this.getUserFromToken(token);

      const validationCheck = await this.checkPasswordChangeValidations(
        databaseUser,
        oldPassword,
        password,
        confirmPassword
      );

      if (typeof validationCheck === "string") {
        return validationCheck;
      }

      const hashedPassword = await AuthUtil.hashPassword(password);

      const processedUpdateFields = this.convertToDotNotation({
        password: hashedPassword,
      });

      databaseUser = await UserDAO.updateUserFieldByID(
        databaseUser._id,
        processedUpdateFields
      );

      const updatedUser = await UserDAO.getUserByIDFromDB(databaseUser._id);
      const filteredUser = this.getFormattedUser(updatedUser);

      return { user: filteredUser };
    } catch (e) {
      return e.message;
    }
  }

  static async forgotPassword(email, password, confirmPassword) {
    try {
      let databaseUser = await UserDAO.getUserByEmailFromDB(email);

      const validationCheck = await this.checkPasswordChangeValidations(
        databaseUser,
        null,
        password,
        confirmPassword
      );

      if (typeof validationCheck === "string") {
        return validationCheck;
      }

      const hashedPassword = await AuthUtil.hashPassword(password);

      const processedUpdateFields = this.convertToDotNotation({
        password: hashedPassword,
      });

      databaseUser = await UserDAO.updateUserFieldByID(
        databaseUser._id,
        processedUpdateFields
      );

      const updatedUser = await UserDAO.getUserByIDFromDB(databaseUser._id);
      const filteredUser = this.getFormattedUser(updatedUser);

      return { user: filteredUser };
    } catch (e) {
      return e.message;
    }
  }

  static async signInUser(email, phone, countryCode, password, fcmToken) {
    try {
      const validationCheck = await this.checkSignInAccountValidations(
        email,
        phone,
        countryCode,
        password
      );

      if (typeof validationCheck === "string") {
        return validationCheck;
      }

      let existingUser = validationCheck;

      if (!phone && !existingUser.email_verified_on) {
        await this.sendVerification(email);
        return 403;
      }

      const signedInOn = new Date();

      let tokenString;

      if (phone) {
        tokenString = TokenUtil.createToken({
          phone: phone,
          last_signin_on: signedInOn,
        });
      } else {
        tokenString = TokenUtil.createToken({
          email: email,
          last_signin_on: signedInOn,
        });
      }

      existingUser = await UserDAO.updateUserFieldByID(existingUser._id, {
        auth_token: tokenString,
        last_signin_on: signedInOn,
        fcm_token: fcmToken,
      });

      const updatedUser = await UserDAO.getUserByIDFromDB(existingUser._id);
      const filteredUsers = this.getFormattedUser(updatedUser);

      filteredUsers.login_method = email ? "email" : "phone";

      return { user: filteredUsers };
    } catch (e) {
      return e.message;
    }
  }

  static async ssoUser(email, name, appleId, googleId, fcmToken) {
    try {
      let existingUser;
      if (appleId) {
        existingUser = await UserDAO.getUserByAppleIDFromDB(appleId);
      } else if (googleId) {
        existingUser = await UserDAO.getUserByGoogleIDFromDB(googleId);
      }

      if (existingUser) {
        existingUser = await this.socialSignIn(
          existingUser,
          email,
          name,
          appleId,
          googleId,
          fcmToken
        );
      } else {
        existingUser = await UserDAO.getUserByEmailFromDB(email);
        if (existingUser) {
          return "This email is connected to another login method, kindly use that to proceed";
        }
        existingUser = await this.socialSignUp(
          email,
          name,
          appleId,
          googleId,
          fcmToken
        );
      }

      const filteredUser = this.getFormattedUser(existingUser);
      filteredUser.login_method = googleId ? "google" : "apple";
      return { user: filteredUser };
    } catch (e) {
      return e.message;
    }
  }

  static async socialSignIn(
    existingUser,
    email,
    name,
    appleId,
    googleId,
    fcmToken
  ) {
    const signedInOn = new Date();

    const authToken = TokenUtil.createToken({
      sso_id: googleId ?? appleId,
      email: email ?? "",
      last_signin_on: signedInOn,
    });

    await UserDAO.updateUserFieldByID(existingUser._id, {
      auth_token: authToken,
      last_signin_on: signedInOn,
      fcm_token: fcmToken,
    });

    const updatedUser = await UserDAO.getUserByIDFromDB(existingUser._id);

    return updatedUser;
  }

  static async socialSignUp(email, name, appleId, googleId, fcmToken) {
    const createdOn = new Date();
    const deletedOn = null;
    const emailVerifiedOn = createdOn;
    const phoneVerifiedOn = null;
    const verification = {};

    const authToken = TokenUtil.createToken({
      sso_id: googleId ?? appleId,
      email: email ?? "",
      last_signin_on: createdOn,
    });

    const userDocument = {
      first_name: name,
      last_name: null,
      age: null,
      email: email,
      country_code: null,
      last_city: null,
      phone: null,
      fcm_token: fcmToken,
      role: "user",
      auth_token: authToken,
      password: null,
      bookmarked: [],
      alerted: [],
      google_id: googleId ?? null,
      apple_id: appleId ?? null,
      verification: verification,
      last_signin_on: createdOn,
      app_side_preference: "new",
      email_verified_on: emailVerifiedOn,
      phone_verified_on: phoneVerifiedOn,
      created_on: createdOn,
      deleted_on: deletedOn,
    };

    const addedUserId = await UserDAO.addUserToDB(userDocument);

    const addedUser = await UserDAO.getUserByIDFromDB(addedUserId);

    return addedUser;
  }

  static async getUserDetails(token) {
    try {
      let databaseUser = await this.getUserFromToken(token);
      if (!databaseUser) {
        return "User with this token does not exists";
      }

      const filteredUser = this.getFormattedUser(databaseUser);

      return { user: filteredUser };
    } catch (e) {
      return e.message;
    }
  }

  static async getUserByCity(city) {
    try {
      let databaseUsers = await UserDAO.getUserByCityFromDB(city);
      if (!databaseUsers) {
        return [];
      }

      return databaseUsers;
    } catch (e) {
      return e.message;
    }
  }

  static getFormattedUser(rawUser) {
    const filteredUser = PatternUtil.filterParametersFromObject(rawUser, [
      "_id",
      "fcm_token",
      "created_on",
      "deleted_on",
      "role",
      "password",
      "bookmarked",
      "alerted",
      "last_city",
      "verification",
      "email_verified_on",
      "phone_verified_on",
    ]);

    filteredUser.notifications_enabled =
      rawUser.fcm_token !== null && rawUser.fcm_token !== "x";
    return filteredUser;
  }

  static async signOutUser(token) {
    try {
      let databaseUser = await UserDAO.getUserByAuthTokenFromDB(token);
      if (!databaseUser) {
        return "No such user found";
      }
      databaseUser = await UserDAO.updateUserFieldByID(databaseUser._id, {
        auth_token: null,
        fcm_token: null,
      });

      return {};
    } catch (e) {
      return e.message;
    }
  }

  static async getUserFromToken(authToken) {
    try {
      let databaseUser = await UserDAO.getUserByAuthTokenFromDB(authToken);
      return databaseUser;
    } catch (e) {
      return e.message;
    }
  }

  static async getUserByID(userId) {
    try {
      let databaseUser = await UserDAO.getUserByIDFromDB(userId);
      return databaseUser;
    } catch (e) {
      return e.message;
    }
  }

  static async updateUser(id, updateFields) {
    try {
      let existingUser = await UserDAO.getUserByIDFromDB(id);

      if (!existingUser) {
        return "We do not have a user with the specified ID";
      }
      existingUser = await UserDAO.updateUserFieldByID(id, updateFields);

      const updatedUser = await UserDAO.getUserByIDFromDB(id);

      let filteredUser = PatternUtil.filterParametersFromObject(updatedUser, [
        "_id",
        "fcm_token",
        "created_on",
        "deleted_on",
        "role",
        "password",
        "bookmarks",
      ]);

      return { user: filteredUser };
    } catch (e) {
      return e.message;
    }
  }

  static convertToDotNotation(updateFields, prefix = "") {
    const processedUpdateFields = {};
    for (const key in updateFields) {
      if (Object.prototype.hasOwnProperty.call(updateFields, key)) {
        const value = updateFields[key];
        const newKey = prefix ? `${prefix}.${key}` : key;

        if (Array.isArray(value)) {
          processedUpdateFields[newKey] = value.map((item, index) => {
            if (typeof item === "object" && item !== null) {
              return this.convertToDotNotation(item, `${newKey}.${index}`);
            } else {
              return item;
            }
          });
        } else if (typeof value === "object" && value !== null) {
          const nestedFields = this.convertToDotNotation(value, newKey);
          Object.assign(processedUpdateFields, nestedFields);
        } else {
          processedUpdateFields[newKey] = value;
        }
      }
    }
    return processedUpdateFields;
  }
}
