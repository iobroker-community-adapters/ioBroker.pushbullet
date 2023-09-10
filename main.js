const utils = require('@iobroker/adapter-core'); // Get common adapter utils
let PushBullet;
const adapterName = require('./package.json').name.split('.').pop();
import('pushbullet')
    .then(result => PushBullet = result.default);

// you have to call the adapter function and pass an option object
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
    adapter.on('ready', () => main());

    // is called when adapter shuts down - callback has to be called under any circumstances!
    adapter.on('unload', callback => {
        try {
            stream && stream.close();
            adapter.log.info('cleaned everything up...');
            callback();
        } catch (e) {
            callback();
        }
    });

    // Some message was sent to adapter instance over message box. Used by email, pushover, text2speech, ...
    adapter.on('message', async obj => {
        adapter.log.debug('Message received');
        await push(obj.message);
    });
}

async function push(msg) {
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
                try {
                    await pusher.note(aryReceiver[index], msg.title, msg.message);
                } catch (error) {
                    adapter.log.warn(`Pushbullet error: ${error.message}`);
                }
                break;
            case 'file':
                try {
                    await pusher.file(aryReceiver[index], msg.file, msg.title);
                } catch (error) {
                    adapter.log.warn(`Pushbullet error: ${error.message}`);
                }
                break;
            case 'link':
                try {
                    await pusher.link(aryReceiver[index], msg.title, msg.link);
                } catch (error) {
                    adapter.log.warn(`Pushbullet error: ${error.message}`);
                }
                break;
            default:
                try {
                    await pusher.note(aryReceiver[index], msg.title, msg.message);
                } catch (error) {
                    adapter.log.warn(`Pushbullet error: ${error.message}`);
                }
                break;
        }
    }
}

async function handleTickle(tickleMsg) {
    if (pusher && tickleMsg.subtype === 'push') {
        adapter.log.debug(`Pushbullet DEBUG - handleTickle : ${tickleMsg.subtype}`);
        try {
            const response = await pusher.history({ modified_after: tsHistory });
            const history = await response.json();

            for (let i = 0; i < history.pushes.length; i++) {
                await pushMsg(history.pushes[i]);
            }
            tsHistory = history.pushes.length ? history.pushes[0].modified : 0;
        } catch (err) {
            adapter.log.info('Unable to get history.');
            tsHistory = 0;
        }
    }
}

async function pushMsg(incoming) {
    if (incoming.target_device_iden && incoming.target_device_iden !== myIden) {
        adapter.log.debug(`Receiver: ${incoming.target_device_iden}`);
        adapter.log.debug(`My ID: ${myIden}`);
        return;
    }

    const msg = {
        pushtype: incoming.type,
        data: incoming,
    };

    adapter.log.debug(`pushMsg: ${incoming.type}`);

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
    } else if (incoming.type === 'mirror') {
        // Android specific, untested
        msg.topic = incoming.title;
        msg.payload = incoming.body;
    } else if (incoming.type === 'dismissal') {
        msg.topic = 'dismissal';
        msg.topic = 'Push dismissed';
        msg.payload = incoming.iden;
    } else {
        //adapter.log.error('unknown push type: ' + incoming.type + ' content: ' + JSON.stringify(incoming));
    }
    adapter.log.silly('Pushbullet DEBUG - ' + JSON.stringify(msg));

    if (msg.pushtype !== 'dismissal' && msg.pushtype !== 'delete') {
        adapter.log.silly('Pushbullet DEBUG Payload: ' + msg.payload);
        await adapter.setStateAsync('push.type', incoming.type, true);
        await adapter.setStateAsync('push.title', typeof msg.topic === 'object' ? JSON.stringify(msg.topic) : (msg.topic === undefined || msg.topic === null ? null : msg.topic.toString()), true);
        await adapter.setStateAsync('push.message', typeof msg.message === 'object' ? JSON.stringify(msg.message) : (msg.message === undefined || msg.message === null ? null : msg.message.toString()), true);
        await adapter.setStateAsync('push.payload', typeof msg.payload === 'object' ? JSON.stringify(msg.payload) : (msg.payload === undefined || msg.payload === null ? null : msg.payload.toString()), true);
        await adapter.setStateAsync('push.forAll', !incoming.target_device_iden, true);

        if (incoming.target_device_iden && !adapter.config.doNotDelete) {
            await pusher.deletePush(incoming.iden);
        }
    }
}

async function main(retry) {
    if (!retry && !PushBullet) {
        setTimeout(() => main(true), 1000);
        return;
    }
    if (!PushBullet) {
        adapter.log.error('Pushbullet package not available!');
        return;
    }
    receiver = adapter.config.receivermail;
    pusher = new PushBullet(adapter.config.apikey);
    try {
        const response = await pusher.devices({});
        const devices = (await response.json()).devices;
        let found = false;
        for (let i = 0; i < devices.length; i++) {
            if (devices[i].nickname === 'ioBroker') {
                found = true
                myIden = devices[i].iden;
                break;
            }
        }

        if (!found) {
            const resp = await pusher.createDevice({
                nickname: 'ioBroker'
            });
            const device = await resp.json();
            myIden = device.iden;
        }
    } catch (error) {
        adapter.log.error(`Pushbullet error: ${error.message}`);
        return;
    }

    if (adapter.config.password) {
        let response = await pusher.me();
        let user = await response.json();

        pusher.enableEncryption(adapter.config.password, user.iden);
    }

    stream = pusher.stream();
    stream.connect();

    stream.on('error', error =>
        // stream error
        adapter.log.warn(`ERROR: ${error.message}`));

    stream.on('message', async message => {
        // message received
        adapter.log.debug(`Message received - ${message.type}`);
        if (message.type === 'tickle') {
            await handleTickle(message);
        } else if (message.type === 'push') {
            await pushMsg(message.push);
        } else if (message.type === 'nop') {
            adapter.log.debug('Pushbullet DEBUG - keepalive');
        }
    });

    stream.on('connect', async () => {
        // stream has connected
        adapter.log.debug('Pushbullet DEBUG - Stream connected');

        try {
            const response = await pusher.history({ limit: 1 });
            const history = await response.json();
            tsHistory = history.pushes.length ? history.pushes[0].modified : 0;
        } catch (err) {
            adapter.log.info('Unable to get history.');
            tsHistory = 0;
        }
    });
}

// If started as allInOne mode => return function to create instance
// @ts-ignore
if (module.parent) {
    module.exports = startAdapter;
} else {
    // or start the instance directly
    startAdapter();
}
