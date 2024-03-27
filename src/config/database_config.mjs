import { config } from "dotenv";

//mount the .env file
config();

const databaseConfig = {
  // Database configuration
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dbName: process.env.DB_NAME,
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  },

  collections: {
    usersDatabase: process.env.USER_DB,
    eventsDatabase: process.env.EVENT_DB,
    passDatabase: process.env.PASS_DB,
    categoriesDatabase: process.env.CATEGORY_DB,
  },
};

export default databaseConfig;
