// import admin from "firebase-admin";
// import keyConfig from "../config/key_config.mjs";

// class FirebaseUtility {
//   static initializeApp() {
//     admin.initializeApp({
//       credential: admin.credential.cert(keyConfig.firebase.keyLocation),
//     });
//   }

//   static async sendNotification(token, id, action, title, message) {
//     try {
//       const messaging = admin.messaging();

//       const response = await messaging.send({
//         data: {
//           title: title,
//           message: message,
//           id: id,
//           action: action,
//         },
//         token: token,
//       });

//       return response;
//     } catch (error) {
//       console.error("Error sending notification:", error);
//       throw error;
//     }
//   }
// }

// export default FirebaseUtility;
