import app from "./server.mjs";
import { MongoClient, ServerApiVersion } from "mongodb";
import appConfig from "./config/app_config.mjs";
import databaseConfig from "./config/database_config.mjs";
import UserService from "./services/user_service.mjs";
import PassService from "./services/pass_service.mjs";
import CategoryService from "./services/category_service.mjs";
import EventService from "./services/event_service.mjs";
import EmailUtility from "./utility/email_util.mjs";
import FirebaseUtility from "./utility/fcm_utility.mjs";
import UtilityService from "./services/utility_service.mjs";

const port = appConfig.server.port;
const smtpConfig = {
  service: appConfig.smtp.service,
  auth: {
    user: appConfig.smtp.user,
    pass: appConfig.smtp.pwd,
  },
};

const username = encodeURIComponent(databaseConfig.database.username);
const password = encodeURIComponent(databaseConfig.database.password);
//const uri = `mongodb://${username}:${password}@${databaseConfig.database.host}:${databaseConfig.database.port}/${databaseConfig.database.dbName}`;
const uri = `mongodb+srv://${username}:${password}@eventbazaar.y8gsrgm.mongodb.net/?retryWrites=true&w=majority&appName=${databaseConfig.database.dbName}`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

client
  .connect()
  .catch((err) => {
    console.error(err.stack);
    process.exit(1);
  })
  .then(async (conClient) => {
    await UserService.connectDatabase(client);
    await PassService.connectDatabase(client);
    await CategoryService.connectDatabase(client);
    await EventService.connectDatabase(client);
    await UtilityService.connectDatabase(client);
    EmailUtility.initialize(smtpConfig);
    FirebaseUtility.initializeApp();
    app.listen(port, () => {
      console.log(`http server running => ${port}`);
    });
  });