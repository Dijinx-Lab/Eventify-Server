import { ObjectId } from "mongodb";
import EventService from "./event_service.mjs";
import UserService from "./user_service.mjs";

export default class StatsService {
  static async updateStats(token, eventId, preference, bookmarked) {
    try {
      const eventObjId = new ObjectId(eventId);
      const [event, user] = await Promise.all([
        EventService.getEventById(eventObjId),
        UserService.getUserFromToken(token),
      ]);

      if (!event) {
        return "No such event exists with the specified ID";
      }

      const userBookmarkedIds = user.bookmarked.map((objId) =>
        objId.toString()
      );
      const eventBookmarkedIds = event.stats.bookmarked.map((objId) =>
        objId.toString()
      );
      const userIsBookmarked = userBookmarkedIds.includes(
        eventObjId.toString()
      );
      const userIsInterested = event.stats.interested
        .map((objId) => objId.toString())
        .includes(user._id.toString());
      const userIsGoing = event.stats.going
        .map((objId) => objId.toString())
        .includes(user._id.toString());

      let updatedUser;
      let updatedEvent;

      if (
        !event.stats.viewed
          .map((objId) => objId.toString())
          .includes(user._id.toString())
      ) {
        event.stats.viewed.push(user._id);
        updatedEvent = await EventService.updateEvent(eventObjId, event);
      }

      if (bookmarked !== undefined) {
        if (bookmarked && !userIsBookmarked) {
          user.bookmarked.push(eventObjId);
          event.stats.bookmarked.push(user._id);
        } else if (!bookmarked && userIsBookmarked) {
          user.bookmarked = user.bookmarked.filter(
            (objId) => objId.toString() !== eventObjId.toString()
          );
          event.stats.bookmarked = event.stats.bookmarked.filter(
            (objId) => objId.toString() !== user._id.toString()
          );
        }
        updatedUser = await UserService.updateUser(user._id, {
          bookmarked: user.bookmarked,
        });
        updatedEvent = await EventService.updateEvent(eventObjId, event);
      }

      if (preference !== undefined) {
        let eventInterests = event.stats.interested;
        let eventGoings = event.stats.going;

        if (preference === "going" && !userIsGoing) {
          eventGoings.push(user._id);
          if (userIsInterested) {
            eventInterests = eventInterests.filter(
              (objId) => objId.toString() !== user._id.toString()
            );
          }
        } else if (preference !== "going" && !userIsInterested) {
          eventInterests.push(user._id);
          if (userIsGoing) {
            eventGoings = eventGoings.filter(
              (objId) => objId.toString() !== user._id.toString()
            );
          }
        }

        event.stats.interested = eventInterests;
        event.stats.going = eventGoings;

        updatedEvent = await EventService.updateEvent(eventObjId, event);
      }

      return {};
    } catch (e) {
      return e.message;
    }
  }
}
