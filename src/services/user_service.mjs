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
      return "A user with this email already exists on Eventify, please choose another or sign in instead";
    }
    existingUser = await UserDAO.getUserByPhoneFromDB(countryCode, phone);
    if (existingUser) {
      return "A user with this phone already exists on Eventify, please choose another or sign in instead";
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
    console.log(email);
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
        phone: phone,
        fcm_token: fcmToken,
        role: "user",
        auth_token: authToken,
        password: hashedPassword,
        bookmarked: [],
        verification: verification,
        last_signin_on: createdOn,
        email_verified_on: emailVerifiedOn,
        phone_verified_on: phoneVerifiedOn,
        created_on: createdOn,
        deleted_on: deletedOn,
      };

      const addedUserId = await UserDAO.addUserToDB(userDocument);

      const databaseUser = await UserDAO.getUserByIDFromDB(addedUserId);

      const filteredUser = this.getFormattedUser(databaseUser);

      // const emailResponse = await EmailUtility.sendMail(
      //   email,
      //   "Verify Your Eventify Account",
      //   `<h1>${otpCode}</h1>`
      // );

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
        console.log(processedUpdateFields);
        existingUser = await UserDAO.updateUserFieldByID(
          existingUser._id,
          processedUpdateFields
        );
        existingUser = await UserDAO.getUserByIDFromDB(existingUser._id);

        const filteredUser = this.getFormattedUser(existingUser);

        return { user: filteredUser };
      } else if (type === "phone") {
        const phoneOtp = verification.phone;
        if (code != phoneOtp) {
          return "Please enter a valid code, the provided one is incorrect";
        }
        const phoneVerifiedOn = new Date();
        delete verification[phone];
        const processedUpdateFields = this.convertToDotNotation({
          email_verified_on: phoneVerifiedOn,
          verification: verification,
        });
        existingUser = await UserDAO.updateUserFieldByID(
          existingUser._id,
          processedUpdateFields
        );
        existingUser = await UserDAO.getUserByIDFromDB(existingUser._id);

        const filteredUser = this.getFormattedUser(existingUser);

        return { user: filteredUser };
      } else {
        return "Mismatched type";
      }
    } catch (e) {
      return e.message;
    }
  }

  static async sendVerification(email) {
    try {
      let existingUser = await UserDAO.getUserByEmailFromDB(email);
      if (!existingUser) {
        return "No such user exists with the specified email";
      }

      const otpCode = PatternUtil.generateRandomCode();
      const verification = {
        email: otpCode,
      };
      const processedUpdateFields = this.convertToDotNotation({
        verification: verification,
      });

      existingUser = await UserDAO.updateUserFieldByID(
        existingUser._id,
        processedUpdateFields
      );

      // const emailResponse = await EmailUtility.sendMail(
      //   email,
      //   "Verify Your Eventify Account",
      //   `<h1>${otpCode}</h1>`
      // );

      return {};
    } catch (e) {
      return e.message;
    }
  }

  static async signInUser(email, phone, countryCode, password) {
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

      if (!existingUser.email_verified_on) {
        await this.sendVerification(email);
        return 403;
      }

      const signedInOn = new Date();

      const tokenString = TokenUtil.createToken({
        phone: phone,
        email: email,
        last_signin_on: signedInOn,
      });

      existingUser = await UserDAO.updateUserFieldByID(existingUser._id, {
        auth_token: tokenString,
        last_signin_on: signedInOn,
      });

      const updatedUser = await UserDAO.getUserByIDFromDB(existingUser._id);
      const filteredUsers = this.getFormattedUser(updatedUser);

      return { user: filteredUsers };
    } catch (e) {
      return e.message;
    }
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

  static getFormattedUser(rawUser) {
    const filteredUser = PatternUtil.filterParametersFromObject(rawUser, [
      "_id",
      "fcm_token",
      "created_on",
      "deleted_on",
      "role",
      "password",
      "bookmarks",
      "verification",
      "email_verified_on",
      "phone_verified_on",
    ]);

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
