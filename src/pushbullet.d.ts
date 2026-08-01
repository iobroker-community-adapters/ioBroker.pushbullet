// Type definitions for the `pushbullet` package, which ships none of its own.
// Only the parts used by this adapter are declared. The package is ESM only, so the adapter
// loads it with a dynamic `import()` - the emitted CommonJS keeps that import thanks to
// "module": "Node16".
declare module 'pushbullet' {
    import type { EventEmitter } from 'node:events';

    /** The library returns the raw `node-fetch` response, of which only `json()` is used here */
    export interface PushbulletResponse {
        ok: boolean;
        status: number;
        json: () => Promise<any>;
    }

    export interface PushbulletDevice {
        iden: string;
        nickname?: string;
        type?: string;
        active?: boolean;
    }

    export interface PushbulletDevicesResponse {
        devices?: PushbulletDevice[];
        error?: { message: string };
    }

    /** A single push as delivered by the stream or by the history end point */
    export interface PushbulletPush {
        iden: string;
        /** `note`, `link`, `file`, `list`, `address`, `clip`, `mirror` or `dismissal`, but Pushbullet may add more */
        type?: string;
        title?: string;
        body?: string;
        url?: string;
        name?: string;
        address?: string;
        /** Entries of a `list` push */
        items?: { checked?: boolean; text?: string }[];
        file_name?: string;
        file_url?: string;
        target_device_iden?: string;
        modified?: number;
        active?: boolean;
        dismissed?: boolean;
    }

    export interface PushbulletHistoryResponse {
        pushes: PushbulletPush[];
        cursor?: string;
    }

    export interface PushbulletUser {
        iden: string;
        email?: string;
        name?: string;
    }

    /** Message received over the websocket stream */
    export type PushbulletStreamMessage =
        | { type: 'nop' }
        | { type: 'tickle'; subtype: 'push' | 'device' }
        | { type: 'push'; push: PushbulletPush };

    export interface PushbulletStream extends EventEmitter {
        connect: () => void;
        close: () => void;
    }

    export default class PushBullet {
        constructor(apiKey: string);

        enableEncryption(encryptionPassword: string, userIden: string): void;

        stream(): PushbulletStream;

        me(): Promise<PushbulletResponse>;

        devices(options?: { limit?: number; cursor?: string }): Promise<PushbulletResponse>;

        createDevice(deviceOptions: {
            nickname: string;
            model?: string;
            manufacturer?: string;
        }): Promise<PushbulletResponse>;

        note(deviceParams: string, title: string, body: string): Promise<PushbulletResponse>;

        link(deviceParams: string, title: string, url: string, body?: string): Promise<PushbulletResponse>;

        file(deviceParams: string, filePath: string, body?: string): Promise<PushbulletResponse>;

        history(options?: { modified_after?: number; limit?: number; cursor?: string }): Promise<PushbulletResponse>;

        deletePush(pushIden: string): Promise<PushbulletResponse>;
    }
}
