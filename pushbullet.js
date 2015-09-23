"use strict";

// you have to require the utils module and call adapter function
var utils =    require(__dirname + '/lib/utils'); // Get common adapter utils
var adapter = utils.adapter('pushbullet');
var PushBullet = require('pushbullet');

// you have to call the adapter function and pass a options object
// name has to be set and has to be equal to adapters folder name and main file name excluding extension
// adapter will be restarted automatically every time as the configuration changed, e.g system.adapter.example.0

var receiver;
var pusher;



// is called when adapter shuts down - callback has to be called under any circumstances!
adapter.on('unload', function (callback) {
    try {
        adapter.log.info('cleaned everything up...');
        callback();
    } catch (e) {
        callback();
    }
});

// is called if a subscribed object changes
adapter.on('objectChange', function (id, obj) {
    // Warning, obj can be null if it was deleted
    adapter.log.info('objectChange ' + id + ' ' + JSON.stringify(obj));
});

// is called if a subscribed state changes
adapter.on('stateChange', function (id, state) {
    // Warning, state can be null if it was deleted
    adapter.log.info('stateChange ' + id + ' ' + JSON.stringify(state));

    // you can use the ack flag to detect if it is status (true) or command (false)
    if (state && !state.ack) {
        adapter.log.info('ack is not set!');
    }
});

// Some message was sent to adapter instance over message box. Used by email, pushover, text2speech, ...
adapter.on('message', function (obj) {
    adapter.log.info("Nachricht erhalten.");
    push(obj.message);
});

function push(msg) {
	var index;
    adapter.log.info("Pushe Nachricht");

    if (typeof msg != "object") {
        msg = {message: msg, type: "note", title: "[ioBroker]"};
    }

    msg.title = msg.hasOwnProperty("title") ? msg.title : "[ioBroker]";

	if(receiver.search(",")>=0){
		receiver = receiver.split(",")
	} else {
		receiver = [receiver];
	}
	
    adapter.log.info(msg.type);
	for	(index = 0; index < receiver.length; index++) {
		switch(msg.type){
			case "note":
				pusher.note(receiver[index], msg.title, msg.message, function(error, response) {
					if (error) {
						adapter.log.info("Pushbullet Fehler: "+error.message);
					} else {
						//adapter.log.info("Pushbullet: "+response.body);
					}
				});
				break;
			case "file":
				pusher.file(receiver[index], msg.file, msg.title, function(error, response) {
					if (error) {
						adapter.log.info("Pushbullet Fehler: "+error.message);
					} else {
						//adapter.log.info("Pushbullet: "+response.body);
					}
				});
				break;
			case "link":
				pusher.link(receiver[index], msg.title, msg.link, function(error, response) {
					if (error) {
						adapter.log.info("Pushbullet Fehler: "+error.message);
					} else {
						//adapter.log.info("Pushbullet: "+response.body);
					}
				});
				break;
			default:
				pusher.note(receiver[index], msg.title, msg.message, function(error, response) {
					if (error) {
						adapter.log.info("Pushbullet Fehler: "+error.message);
					} else {
						//adapter.log.info("Pushbullet: "+response.body);
					}
				});
				break;
		}
	}
}

// is called when databases are connected and adapter received configuration.
// start here!
adapter.on('ready', function () {
    main();
});

function main() {
    receiver = adapter.config.receivermail;
    pusher = new PushBullet(adapter.config.apikey);
}
