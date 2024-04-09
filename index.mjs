import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import userRoutes from "./src/routes/user_routes.mjs";
import passRoutes from "./src/routes/pass_routes.mjs";
import categoryRoutes from "./src/routes/category_routes.mjs";
import eventRoutes from "./src/routes/event_routes.mjs";
import statsRoutes from "./src/routes/stats_route.mjs";
import utilityRoutes from "./src/routes/utility_routes.mjs";
// import app from "./server.mjs";
import { MongoClient, ServerApiVersion } from "mongodb";
import appConfig from "./src/config/app_config.mjs";
import databaseConfig from "./src/config/database_config.mjs";
import UserService from "./src/services/user_service.mjs";
import PassService from "./src/services/pass_service.mjs";
import CategoryService from "./src/services/category_service.mjs";
import EventService from "./src/services/event_service.mjs";
import EmailUtility from "./src/utility/email_util.mjs";
import FirebaseUtility from "./src/utility/fcm_utility.mjs";
import UtilityService from "./src/services/utility_service.mjs";

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

const app = express();

app.use(cors());
app.use(bodyParser.json());

const baseUrl = "/api/v1/eventify";

app.use(baseUrl, userRoutes);
app.use(baseUrl, passRoutes);
app.use(baseUrl, categoryRoutes);
app.use(baseUrl, eventRoutes);
app.use(baseUrl, statsRoutes);
app.use(baseUrl, utilityRoutes);

app.use("/", (req, res) =>
  res.status(200).json({
    message: "Hello",
  })
);
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
