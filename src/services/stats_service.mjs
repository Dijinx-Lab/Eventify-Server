import { ObjectId } from "mongodb";
import EventService from "./event_service.mjs";
import UserService from "./user_service.mjs";

export default class StatsService {
  static async updateStats(token, eventId, preference, bookmarked) {
    try {
      const eventObjId = new ObjectId(eventId);
      let [event, user] = await Promise.all([
        EventService.getEventById(eventObjId),
        UserService.getUserFromToken(token),
      ]);

      if (!event) {
        return "No such event exists with the specified ID";
      } else if (event._id.toString() === user._id.toString()) {
        return {};
      }

      event = await this.updateViews(event, user);
      event = await this.updateBookmarks(event, bookmarked, user);
      event = await this.updatePreference(event, user, preference);

      const updatedEvent = await EventService.replaceCompleteEvent(event);

      return {};
    } catch (e) {
      return e.message;
    }
  }

  static async updatePreference(event, user, preference) {
    try {
      if (preference === undefined || preference === null) return event;
      let interestedUsersInEvent = [];
      let goingUsersInEvent = [];

      if (event.stats.interested.length !== 0) {
        interestedUsersInEvent = event.stats.interested.map((objId) =>
          objId.toString()
        );
      }
      if (event.stats.going.length !== 0) {
        goingUsersInEvent = event.stats.going.map((objId) => objId.toString());
      }

      const userInterested = interestedUsersInEvent.includes(
        user._id.toString()
      );

      const userGoing = goingUsersInEvent.includes(user._id.toString());

      if (userInterested && preference.toLowerCase() === "interested") {
        return event;
      } else if (userGoing && preference.toLowerCase() === "going") {
        return event;
      }

      if (userInterested) {
        event.stats.interested = event.stats.interested.filter(
          (objId) => objId.toString() !== user._id.toString()
        );
      }
      if (userGoing) {
        event.stats.going = event.stats.going.filter(
          (objId) => objId.toString() !== user._id.toString()
        );
      }
      if (preference.toLowerCase() === "interested") {
        event.stats.interested.push(user._id);
      } else if (preference.toLowerCase() === "going") {
        event.stats.going.push(user._id);
      }
      return event;
    } catch (e) {
      console.log(e);
    }
  }

  static async updateViews(event, user) {
    try {
      let eventViewsFromUsers = [];

      if (event.stats.viewed.length !== 0) {
        eventViewsFromUsers = event.stats.viewed.map((objId) =>
          objId.toString()
        );
      }

      const isViewed = eventViewsFromUsers.includes(user._id.toString());

      if (isViewed) return event;

      event.stats.viewed.push(user._id);
      return event;
    } catch (e) {
      console.log(e);
    }
  }

  static async updateBookmarks(event, bookmark, user) {
    try {
      if (bookmark === undefined || bookmark === null) return event;

      let userBookmarkedEvents = [];
      let eventBookmarksFromUsers = [];

      if (user.bookmarked.length !== 0) {
        userBookmarkedEvents = user.bookmarked.map((objId) => objId.toString());
      }

      if (event.stats.bookmarked.length !== 0) {
        eventBookmarksFromUsers = event.stats.bookmarked.map((objId) =>
          objId.toString()
        );
      }

      const isBookmarked = eventBookmarksFromUsers.includes(
        user._id.toString()
      );

      if (isBookmarked) {
        user.bookmarked = user.bookmarked.filter(
          (objId) => objId.toString() !== event._id.toString()
        );
        event.stats.bookmarked = event.stats.bookmarked.filter(
          (objId) => objId.toString() !== user._id.toString()
        );
      } else {
        user.bookmarked.push(event._id);
        event.stats.bookmarked.push(user._id);
      }

      const updatedUser = await UserService.updateUser(user._id, {
        bookmarked: user.bookmarked,
      });

      return event;
    } catch (e) {
      console.log(e);
    }
  }
}
