import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import userRoutes from "./src/routes/user_routes.mjs";
import passRoutes from "./src/routes/pass_routes.mjs";
import categoryRoutes from "./src/routes/category_routes.mjs";
import eventRoutes from "./src/routes/event_routes.mjs";
import statsRoutes from "./src/routes/stats_route.mjs";
import utilityRoutes from "./src/routes/utility_routes.mjs";

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
// app.use("/", (req, res) =>
//   res.status(200).json({
//     message: "Event Bazaar server point",
//   })
// );
app.use("*", (req, res) =>
  res.status(404).json({
    success: false,
    data: {
      status: 404,
      error: "Not Found",
    },
    message:
      "The request made can not reach the server because either the URI is incorrect or the resource have been moved to another place. Please contact the system administrator for more information",
  })
);

export default app;
