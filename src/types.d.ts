/** `adapter.config`, mirroring `native` in io-package.json and the fields of admin/jsonConfig.json */
export interface PushbulletAdapterConfig {
    /** Pushbullet access token, see https://www.pushbullet.com/account */
    apikey: string;
    /** Default receiver: e-mail address or device iden. Several receivers are separated by a comma */
    receivermail: string;
    /** End-to-End encryption password. An empty string disables encryption */
    password: string;
    /** Keep pushes addressed to this device on the server instead of deleting them after processing */
    doNotDelete: boolean;
}

/** Payload of a `sendTo` message, either the note text itself or a fully described push */
export type PushbulletMessage =
    | string
    | {
          type?: 'note' | 'file' | 'link';
          title?: string;
          /** Body of a note, or the description of a link */
          message?: string;
          /** Path of the file to send, for `type: 'file'` */
          file?: string;
          /** URL to send, for `type: 'link'` */
          link?: string;
          /** Overrides `receivermail` from the configuration. Several receivers are separated by a comma */
          receiver?: string;
      };
