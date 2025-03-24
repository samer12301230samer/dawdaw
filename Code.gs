var DEFAULT_IMAGE_URL = "https://goo.gl/bMqzYS";
var header = {
  "header": {
    "title" : "Attendance Bot",
    "subtitle" : "Log your vacation time",
    "imageUrl" : DEFAULT_IMAGE_URL
  }
};

/**
 * Creates a card-formatted response.
 *
 * @param the message to send
 */
function createCardResponse(widgets) {
  return {
    "publicApiCards": [
      header,
      {
        "sections": [{
          "widgets": widgets
        }]
      }]
  };
}

var REASON_SICK = "Out sick";
var REASON_OTHER = "Out of office";

/**
 * Responds to a MESSAGE event triggered in Hangouts Chat.
 *
 * @param event the event object from Hangouts Chat
 */
function onMessage(event) {
  console.info(event);

  var reason = REASON_OTHER;
  var name = event.sender.displayName;
  var userMessage = event.message.text;

 // If the user said that they were "sick", adjust the image in the header
  // sent to them.
  if (userMessage.indexOf("sick") > -1) {
    header.header.imageUrl = "https://goo.gl/mnZ37b"; // Hospital material icon
    reason = REASON_SICK;
  } else if (userMessage.indexOf("vacation") > -1) {
    header.header.imageUrl = "https://goo.gl/EbgHuc"; // Spa material icon
  }

  var widgets = [{
            "textParagraph": {
              "text": "Hello, " + name + ".<br/>Are you taking time off today?"
            }
          }, {
            "buttons": [{
              "textButton": {
                "text": "Set vacation in Gmail",
                "onClick": {
                  "action": {
                    "actionMethodName": "turnOnAutoResponder",
                    "parameters": [{
                      "key": "reason",
                      "value": reason
                    }]
                  }
                }
              }
            }, {
              "textButton": {
                "text": "Block out day in Calendar",
                "onClick": {
                  "action": {
                    "actionMethodName": "blockOutCalendar",
                    "parameters": [{
                      "key": "reason",
                      "value": reason
                    }]
                  }
                }
              }
            }]
          }];

  return createCardResponse(widgets);
}

/**
 * Responds to an ADDED_TO_SPACE event in Hangouts Chat.
 *
 * @param event the event object from Hangouts Chat
 */
function onAddToSpace(event) {
  console.info(event);

  var message = "";

  if (event.space.type == "DM") {
    message = "Thank you for adding me to a DM, " +
      event.user.displayName + "!";
  } else {
    message = "Thank you for adding me to " +
      event.space.displayName;
  }

  return { "text": message };
}

/**
 * Responds to a REMOVED_FROM_SPACE event in Hangouts Chat.
 *
 * @param event the event object from Hangouts Chat
 */
function onRemoveFromSpace(event) {
  console.info(event);
  console.info("Bot removed from ", event.space.name);
}

/**
 * Responds to a CARD_CLICKED event triggered in Hangouts Chat.
 *
 * @param event the event object from Hangouts Chat
 */
function onCardClick(event) {
  console.info(event);

  var message = "";
  var reason = event.action.parameters[0].value;

  if (event.action.actionMethodName == "turnOnAutoResponder") {
    turnOnAutoResponder(reason);
    message = "Turned on vacation settings.";
  } else if (event.action.actionMethodName == "blockOutCalendar") {
    blockOutCalendar(reason);
    message = "Blocked out your calendar for the day.";
  } else {
    message = "I'm sorry; I'm not sure which button you clicked.";
  }

  return { "text": message };
}

var ONE_DAY_MILLIS = 24 * 60 * 60 * 1000;

/**
 * Turns on the user's vacation response for today in Gmail.
 */
function turnOnAutoResponder(reason) {
  var currentTime = (new Date()).getTime();

  Gmail.Users.Settings.updateVacation({
    "enableAutoReply": true,
    "responseSubject": reason,
    "responseBodyHtml": "I'm out of the office today; will be back on the next business day.<br><br><i>Created by Attendance Bot!</i>",
    "restrictToContacts": true,
    "restrictToDomain": true,
    "startTime": currentTime,
    "endTime": currentTime + ONE_DAY_MILLIS
  }, "me");
}

/**
 * Places an all-day meeting on the user's Calendar.
 */
function blockOutCalendar(reason) {
  CalendarApp.createEvent(reason, new Date(), new Date(Date.now() + ONE_DAY_MILLIS));
}