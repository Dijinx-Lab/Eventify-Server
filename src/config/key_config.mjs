import { config } from "dotenv";

//mount the .env file
config();

const keyConfig = {
  // Keys configuration
  firebase: {
    keyLocation: process.env.FIREBASE_KEY,
  },
};

export default keyConfig;