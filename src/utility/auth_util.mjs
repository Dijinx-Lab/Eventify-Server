import bcrypt from "bcryptjs";

const saltRounds = 10;

const AuthUtil = {
  // Method to hash a password
  hashPassword: async (plainTextPassword) => {
    try {
      const hashedPassword = await bcrypt.hash(plainTextPassword, saltRounds);
      return hashedPassword;
    } catch (error) {
      throw error;
    }
  },

  // Method to compare plain text password with hashed password
  comparePasswords: async (plainTextPassword, hashedPassword) => {
    try {
      const match = await bcrypt.compare(plainTextPassword, hashedPassword);
      return match;
    } catch (error) {
      throw error;
    }
  },
};

export default AuthUtil;
