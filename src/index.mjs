import app from "./server.mjs";
import { MongoClient } from "mongodb";
import appConfig from "./config/app_config.mjs";
import databaseConfig from "./config/database_config.mjs";
import UserService from "./services/user_service.mjs";
import PassService from "./services/pass_service.mjs";
import CategoryService from "./services/category_service.mjs";
import EventService from "./services/event_service.mjs";
import EmailUtility from "./utility/email_util.mjs";

const port = appConfig.server.port;
const username = encodeURIComponent(databaseConfig.database.username);
const password = encodeURIComponent(databaseConfig.database.password);
const uri = `mongodb://${username}:${password}@${databaseConfig.database.host}:${databaseConfig.database.port}/${databaseConfig.database.dbName}`;
const smtpConfig = {
  service: appConfig.smtp.service,
  auth: {
    user: appConfig.smtp.user,
    pass: appConfig.smtp.pwd,
  },
};

MongoClient.connect(uri, {
  maxPoolSize: 50,
  wtimeoutMS: 2500,
})
  .catch((err) => {
    console.error(err.stack);
    process.exit(1);
  })
  .then(async (client) => {
    await UserService.connectDatabase(client);
    await PassService.connectDatabase(client);
    await CategoryService.connectDatabase(client);
    await EventService.connectDatabase(client);
    await EmailUtility.initialize(smtpConfig);
    //FirebaseUtility.initializeApp();
    app.listen(port, () => {
      console.log(`http server running => ${port}`);
    });
  });
