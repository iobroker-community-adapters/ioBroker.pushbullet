/**
 *
 *      ioBroker Pushbullet Adapter
 *
 *      (c) 2017-2026 Jens1809 <cpthans@gmail.com>
 *
 *      MIT License
 *
 */
import { Adapter, type AdapterOptions } from '@iobroker/adapter-core';
import type {
    PushbulletDevicesResponse,
    PushbulletHistoryResponse,
    PushbulletPush,
    PushbulletStream,
    PushbulletStreamMessage,
    PushbulletUser,
    default as PushBullet,
} from 'pushbullet';
import type { PushbulletAdapterConfig, PushbulletMessage } from './types';

/** Name of the device this adapter registers at Pushbullet to address the ioBroker installation */
const OWN_DEVICE_NICKNAME = 'ioBroker';

/** Push mapped onto the states below `push.` */
interface MappedPush {
    pushtype?: string;
    topic?: string;
    payload?: string;
    message?: string;
}

class PushbulletAdapter extends Adapter {
    declare public config: PushbulletAdapterConfig;

    private pusher: PushBullet | null = null;
    private pushStream: PushbulletStream | null = null;
    /** Receivers from the configuration, used whenever a message does not name one itself */
    private receivers: string[] = [];
    /** Modification timestamp of the newest push already processed */
    private tsHistory = 0;
    /** iden of the `ioBroker` device at Pushbullet */
    private myIden: string | undefined;

    public constructor(options: Partial<AdapterOptions> = {}) {
        super({
            ...options,
            name: 'pushbullet',
            ready: () => this.main(),
            message: obj => this.onMessage(obj),
            unload: callback => this.onUnload(callback),
        });
    }

    private onUnload(callback: () => void): void {
        try {
            this.pushStream?.close();
            this.log.info('cleaned everything up...');
        } catch {
            // ignore - the adapter is going down anyway
        }
        callback();
    }

    private onMessage(obj: ioBroker.Message): void {
        this.log.debug('Message received');
        this.push(obj.message as PushbulletMessage).catch(error =>
            this.log.warn(`Cannot send push: ${error instanceof Error ? error.message : error}`),
        );
    }

    /** Split a receiver configuration - a single address or several ones separated by comma */
    private static splitReceivers(receivers: string): string[] {
        return receivers.split(',').map(receiver => receiver.trim());
    }

    /** Send a message as a push to all configured receivers */
    private async push(message: PushbulletMessage): Promise<void> {
        if (!this.pusher) {
            this.log.warn('Cannot send push: adapter is not connected to Pushbullet');
            return;
        }

        this.log.debug('Push message');

        const msg = typeof message === 'object' && message !== null ? message : { type: 'note' as const, message };
        const title = msg.title === undefined ? '[ioBroker]' : msg.title;
        // Only a missing receiver falls back to the configured one, an empty string is a broadcast
        const receivers =
            msg.receiver === undefined || msg.receiver === null
                ? this.receivers
                : PushbulletAdapter.splitReceivers(msg.receiver);

        this.log.debug(`Push type: ${msg.type || 'note'}`);

        for (const receiver of receivers) {
            try {
                if (msg.type === 'file') {
                    if (!msg.file) {
                        this.log.warn('Cannot send push: no file given');
                        return;
                    }
                    await this.pusher.file(receiver, msg.file, title);
                } else if (msg.type === 'link') {
                    if (!msg.link) {
                        this.log.warn('Cannot send push: no link given');
                        return;
                    }
                    await this.pusher.link(receiver, title, msg.link);
                } else {
                    await this.pusher.note(receiver, title, msg.message || '');
                }
            } catch (error) {
                this.log.warn(`Pushbullet error: ${error instanceof Error ? error.message : error}`);
            }
        }
    }

    /** A tickle only says that something changed - the new pushes have to be read from the history */
    private async handleTickle(tickleMsg: { subtype: string }): Promise<void> {
        if (!this.pusher || tickleMsg.subtype !== 'push') {
            return;
        }
        this.log.debug(`Pushbullet DEBUG - handleTickle : ${tickleMsg.subtype}`);

        try {
            const response = await this.pusher.history({ modified_after: this.tsHistory });
            const history: PushbulletHistoryResponse = await response.json();

            for (const push of history.pushes) {
                await this.pushMsg(push);
            }
            this.tsHistory = history.pushes.length ? history.pushes[0].modified || 0 : 0;
        } catch {
            this.log.info('Unable to get history.');
            this.tsHistory = 0;
        }
    }

    /** States are strings, so objects are serialized and empty values are written as `null` */
    private static toStateValue(value: unknown): string | null {
        if (value === undefined || value === null) {
            return null;
        }
        return typeof value === 'string' ? value : JSON.stringify(value);
    }

    /** Map an incoming push onto the `push.*` states */
    private async pushMsg(incoming: PushbulletPush): Promise<void> {
        if (incoming.target_device_iden && incoming.target_device_iden !== this.myIden) {
            this.log.debug(`Receiver: ${incoming.target_device_iden}`);
            this.log.debug(`My ID: ${this.myIden}`);
            return;
        }

        const msg: MappedPush = { pushtype: incoming.type };

        this.log.debug(`pushMsg: ${incoming.type}`);

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
            // the list entries are objects, and `push.payload` is a string state
            msg.payload = JSON.stringify(incoming.items);
        } else if (incoming.type === 'file') {
            msg.topic = incoming.file_name;
            msg.payload = incoming.file_url;
            msg.message = incoming.body;
        } else if (incoming.type === 'mirror') {
            // Android specific, untested
            msg.topic = incoming.title;
            msg.payload = incoming.body;
        } else if (incoming.type === 'dismissal') {
            msg.topic = 'Push dismissed';
            msg.payload = incoming.iden;
        }

        this.log.silly(`Pushbullet DEBUG - ${JSON.stringify(msg)}`);

        if (msg.pushtype === 'dismissal' || msg.pushtype === 'delete') {
            return;
        }

        this.log.silly(`Pushbullet DEBUG Payload: ${PushbulletAdapter.toStateValue(msg.payload)}`);

        await this.setState('push.type', PushbulletAdapter.toStateValue(incoming.type), true);
        await this.setState('push.title', PushbulletAdapter.toStateValue(msg.topic), true);
        await this.setState('push.message', PushbulletAdapter.toStateValue(msg.message), true);
        await this.setState('push.payload', PushbulletAdapter.toStateValue(msg.payload), true);
        await this.setState('push.forAll', !incoming.target_device_iden, true);

        if (incoming.target_device_iden && !this.config.doNotDelete) {
            await this.pusher?.deletePush(incoming.iden);
        }
    }

    /** Look up the `ioBroker` device at Pushbullet and create it if it does not exist yet */
    private async ensureOwnDevice(pusher: PushBullet): Promise<void> {
        const response = await pusher.devices({});
        const { devices } = (await response.json()) as PushbulletDevicesResponse;

        const own = devices?.find(device => device.nickname === OWN_DEVICE_NICKNAME);
        if (own) {
            this.myIden = own.iden;
            return;
        }

        const createResponse = await pusher.createDevice({ nickname: OWN_DEVICE_NICKNAME });
        this.myIden = ((await createResponse.json()) as { iden: string }).iden;
    }

    private async main(): Promise<void> {
        // `pushbullet` is an ESM only package, so it cannot be required from this CommonJS module
        const { default: PushBulletClass } = await import('pushbullet');

        this.receivers = PushbulletAdapter.splitReceivers(this.config.receivermail);

        const pusher = new PushBulletClass(this.config.apikey);

        try {
            await this.ensureOwnDevice(pusher);
        } catch (error) {
            this.log.error(`Pushbullet error: ${error instanceof Error ? error.message : error}`);
            return;
        }

        if (this.config.password) {
            const response = await pusher.me();
            const user: PushbulletUser = await response.json();

            pusher.enableEncryption(this.config.password, user.iden);
        }

        this.pusher = pusher;

        const stream = pusher.stream();
        this.pushStream = stream;

        stream.on('error', (error: Error) => this.log.warn(`ERROR: ${error.message}`));

        stream.on('message', (message: PushbulletStreamMessage) => {
            this.log.debug(`Message received - ${message.type}`);

            if (message.type === 'tickle') {
                void this.handleTickle(message);
            } else if (message.type === 'push') {
                void this.pushMsg(message.push);
            } else if (message.type === 'nop') {
                this.log.debug('Pushbullet DEBUG - keepalive');
            }
        });

        stream.on('connect', () => {
            this.log.debug('Pushbullet DEBUG - Stream connected');

            pusher
                .history({ limit: 1 })
                .then(async response => {
                    const history: PushbulletHistoryResponse = await response.json();
                    this.tsHistory = history.pushes.length ? history.pushes[0].modified || 0 : 0;
                })
                .catch(() => {
                    this.log.info('Unable to get history.');
                    this.tsHistory = 0;
                });
        });

        stream.connect();
    }
}

// If started as allInOne mode => return function to create instance
if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options: Partial<AdapterOptions> | undefined) => new PushbulletAdapter(options);
} else {
    // otherwise start the instance directly
    (() => new PushbulletAdapter())();
}
