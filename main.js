'use strict';

// you have to require the utils module and call adapter function
const utils        = require('@iobroker/adapter-core'); // Get common adapter utils
const Main         = require('pushbullet');
const adapterName  = require('./package.json').name.split('.').pop();

// you have to call the adapter function and pass a options object
// name has to be set and has to be equal to adapters folder name and main file name excluding extension
// adapter will be restarted automatically every time as the configuration changed, e.g system.adapter.example.0

let receiver;
let pusher;
let stream;
let tsHistory;
let myIden;
let adapter;

function startAdapter(options) {
    options = options || {};

    Object.assign(options, {name: adapterName});

    adapter = new utils.Adapter(options);

    // is called when databases are connected and adapter received configuration.
    // start here!
    adapter.on('ready', () => {
        adapter.extendObject('push.type', {
            type: 'state',
            common: {
                name: 'Type of Push',
                type: 'string',
                role: 'state',
                read: true,
                write: true
            },
            native: {}
        });
        adapter.extendObject('push.title', {
            type: 'state',
            common: {
                name: 'Title of Push',
                type: 'string',
                role: 'state',
                read: true,
                write: true
            },
            native: {}
        });
        adapter.extendObject('push.message', {
            type: 'state',
            common: {
                name: 'Message of Push',
                type: 'string',
                role: 'state',
                read: true,
                write: true
            },
            native: {}
        });
        adapter.extendObject('push.payload', {
            type: 'state',
            common: {
                name: 'Content of Push',
                type: 'string',
                role: 'state',
                read: true,
                write: true
            },
            native: {}
        });
        main();
    });

    // is called when adapter shuts down - callback has to be called under any circumstances!
    adapter.on('unload', callback => {
        try {
            stream.close();
            adapter.log.info('cleaned everything up...');
            callback();
        } catch (e) {
            callback();
        }
    });

    // is called if a subscribed state changes
    adapter.on('stateChange', (id, state) => {
        // Warning, state can be null if it was deleted
        adapter.log.debug(`stateChange ${id} ${JSON.stringify(state)}`);

        // you can use the ack flag to detect if it is status (true) or command (false)
        if (state && !state.ack) {
            adapter.log.info('ack is not set!');
        }
    });

    // Some message was sent to adapter instance over message box. Used by email, pushover, text2speech, ...
    adapter.on('message', obj => {
        adapter.log.debug('Message received');
        push(obj.message);
    });
}

function push(msg) {
    let index;
    let aryReceiver;

    adapter.log.debug('Push message');

    if (typeof msg !== 'object') {
        msg = {message: msg, type: 'note', title: '[ioBroker]'};
    }

    msg.title = msg.hasOwnProperty('title') ? msg.title : '[ioBroker]';

    if (typeof msg.receiver === 'undefined' || msg.receiver === null) {
        if (receiver.includes(',')) {
            aryReceiver = receiver.split(',')
        } else {
            aryReceiver = [receiver];
        }
    } else {
        if (msg.receiver.includes(',')) {
            aryReceiver = msg.receiver.split(',')
        } else {
            aryReceiver = [msg.receiver];
        }
    }

    adapter.log.info(msg.type);
    for (index = 0; index < aryReceiver.length; index++) {
        switch (msg.type) {
            case 'note':
                pusher.note(aryReceiver[index], msg.title, msg.message, (error, response) => {
                    if (error) {
                        adapter.log.warn('Pushbullet error: ' + error.message);
                    } else {
                        //adapter.log.info('Pushbullet: '+response.body);
                    }
                });
                break;
            case 'file':
                pusher.file(aryReceiver[index], msg.file, msg.title, (error, response) => {
                    if (error) {
                        adapter.log.warn('Pushbullet error: ' + error.message);
                    } else {
                        //adapter.log.info('Pushbullet: '+response.body);
                    }
                });
                break;
            case 'link':
                pusher.link(aryReceiver[index], msg.title, msg.link, (error, response) => {
                    if (error) {
                        adapter.log.warn('Pushbullet error: ' + error.message);
                    } else {
                        //adapter.log.info('Pushbullet: '+response.body);
                    }
                });
                break;
            default:
                pusher.note(aryReceiver[index], msg.title, msg.message, (error, response) => {
                    if (error) {
                        adapter.log.warn('Pushbullet error: ' + error.message);
                    } else {
                        //adapter.log.info('Pushbullet: '+response.body);
                    }
                });
                break;
        }
    }
}

function main() {
    receiver = adapter.config.receivermail;
    pusher = new Main(adapter.config.apikey);
    pusher.devices({}, (error, response) => {
        let found = false;
        for (let i = 0; i < response.devices.length; i++) {
            if (response.devices[i].nickname === 'ioBroker') {
                found = true
                myIden = response.devices[i].iden;
                break;
            }
        }

        if (!found) {
            pusher.createDevice('ioBroker', (error, response) =>
                myIden = response.iden);
        }
    });

    stream = pusher.stream();
    stream.connect();

    stream.on('error', error =>
        // stream error
        adapter.log.warn(`ERROR: ${error.message}`));

    stream.on('message', message => {
        // message received
        adapter.log.debug('Message received - ' + message.type);
        if (message.type === 'tickle') {
            handleTickle(message);
        } else if (message.type === 'push') {
            pushMsg(message.push);
        }
    });

    stream.on('connect', () => {
        // stream has connected
        adapter.log.debug('Pushbullet DEBUG - Stream connected');

        pusher.history({limit: 1}, (err, res) => {
            if (err) {
                tsHistory = 0;
            } else {
                try {
                    tsHistory = res.pushes[0].modified;
                } catch (ex) {
                    adapter.log.info('Unable to get history.');
                    tsHistory = 0;
                }
            }
        });
    });
}

function handleTickle(tickleMsg) {
    if (pusher && tickleMsg.subtype === 'push') {
        adapter.log.debug('Pushbullet DEBUG - handleTickle : ' + tickleMsg.subtype);
        pusher.history({modified_after: tsHistory}, (err, res) => {
            if (err) {
                adapter.log.info(err);
            }
            for (let i = 0; i < res.pushes.length; i++) {
                pushMsg(res.pushes[i]);
            }
            try {
                tsHistory = res.pushes[0].modified;
            } catch (ex) {
                adapter.log.info('Unable to get history.');
            }
        });
    }
}

function pushMsg(incoming) {
    if (incoming.target_device_iden != myIden) {
        adapter.log.debug('Receiver: ' + incoming.target_device_iden);
        adapter.log.debug('My ID: ' + myIden);
        return;
    }

    const msg = {
        pushtype: incoming.type,
        data: incoming
    };

    adapter.log.debug('pushMsg: ' + incoming.type);

    if (incoming.dismissed === true) {
        msg.pushtype = 'dismissal';
        msg.topic = 'Push dismissed';
        msg.payload = incoming.iden;
    } else if (incoming.active === false && incoming.type === undefined) {
        msg.pushtype = 'delete';
        msg.topic = 'Push deleted';
        msg.payload = incoming.iden;
    } else if (incoming.type === 'clip') {
        msg.topic = 'Clipboard content';
        msg.payload = incoming.body;
    } else if (incoming.type === 'note') {
        msg.topic = incoming.title;
        msg.payload = incoming.body;
    } else if (incoming.type === 'link') {
        msg.topic = incoming.title;
        msg.payload = incoming.url;
        msg.message = incoming.body;
    } else if (incoming.type === 'address') {
        msg.topic = incoming.name;
        msg.payload = incoming.address;
    } else if (incoming.type === 'list') {
        msg.topic = incoming.title;
        msg.payload = incoming.items;
    } else if (incoming.type === 'file') {
        msg.topic = incoming.file_name;
        msg.payload = incoming.file_url;
        msg.message = incoming.body;
    }
    // Android specific, untested
    else if (incoming.type === 'mirror') {
        msg.topic = incoming.title;
        msg.payload = incoming.body;
    } else if (incoming.type === 'dismissal') {
        msg.topic = 'dismissal';
        msg.topic = 'Push dismissed';
        msg.payload = incoming.iden;
    } else {
        //adapter.log.error('unknown push type: ' + incoming.type + ' content: ' + JSON.stringify(incoming));
    }

    if (msg.pushtype !== 'dismissal' && msg.pushtype !== 'delete') {
        adapter.setState('push.type', incoming.type, true);
        adapter.setState('push.title', msg.topic, true);
        adapter.setState('push.message', msg.message, true);
        adapter.setState('push.payload', msg.payload, true);

        pusher.deletePush(incoming.iden, (error, response) => {});
    }
}

// If started as allInOne mode => return function to create instance
// @ts-ignore
if (module.parent) {
    module.exports = startAdapter;
} else {
    // or start the instance directly
    startAdapter();
}
