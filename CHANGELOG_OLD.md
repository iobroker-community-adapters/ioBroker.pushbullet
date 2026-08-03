# Older changes
## 1.0.1 (2023-09-10)
* (bluefox) Breaking change: Only node version 16+ supported
* (bluefox) Added JSON config and used the latest version of a pushbullet library
* (bluefox) Added encryption

## 0.1.0 (2021-10-15)
* (bluefox) Refactoring

## 0.0.11 (2015-10-11)
* (Jens1809) Man kann nun Pushnachrichten an bestimmte Geräte schicken indem man die GeräteID mit angibt.
* sendTo("pushbullet", {
  message: "message body",    //The Message you want to send
  title: "title",             //The Title of your message
  type: "note",                //Type Note
  receiver: "ID hier einsetzen" //GeräteID
  });

## 0.0.8 (2015-09-26)
* (Jens1809) Adapter empfängt nun Push Nachrichten und schreibt die Daten der Nachricht in die Objekte:
* - pushbullet.0.push.type
- pushbullet.0.push.title
- pushbullet.0.push.message
- pushbullet.0.push.payload

## 0.0.7 (2015-09-24)
* (Jens1809) Möglichkeit an ausgewählte Geräte zu senden ohne an den kompletten Account zu senden.

## 0.0.6 (2015-07-25)
* (Jens1809) Publish on NPM
