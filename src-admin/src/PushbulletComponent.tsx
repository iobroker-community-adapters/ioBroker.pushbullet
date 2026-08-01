import React from 'react';

import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    IconButton,
} from '@mui/material';
import { Check } from '@mui/icons-material';
// important to make from package and not from some children.
// invalid
// import ConfigGeneric from '@iobroker/json-config/ConfigGeneric';
// valid
import { ConfigGeneric, type ConfigGenericProps, type ConfigGenericState } from '@iobroker/json-config';
import { I18n } from '@iobroker/gui-components';

interface PushbulletDevice {
    iden: string;
    nickname?: string;
    type?: string;
}

interface PushbulletComponentState extends ConfigGenericState {
    devices: PushbulletDevice[];
}

export default class PushbulletComponent extends ConfigGeneric<ConfigGenericProps, PushbulletComponentState> {
    constructor(props: ConfigGenericProps) {
        super(props);
        this.state = {
            ...this.state,
            devices: [],
        };
    }

    async componentDidMount(): Promise<void> {
        await super.componentDidMount();
        if (this.props.data.apikey) {
            await this.readData();
        }
    }

    async readData(): Promise<void> {
        try {
            const response = await fetch('https://api.pushbullet.com/v2/devices', {
                headers: {
                    Authorization: `Bearer ${this.props.data.apikey as string}`,
                },
            });
            const json: { devices?: PushbulletDevice[]; error?: { message: string } } = await response.json();

            if (json.error) {
                window.alert(`Cannot read devices: ${json.error.message}`);
            } else {
                this.setState({ devices: json.devices || [] });
            }
        } catch (e) {
            window.alert(`Cannot read devices: ${e as Error}`);
        }
    }

    renderItem(): React.JSX.Element {
        return (
            <div style={{ width: '100%' }}>
                <h4>{I18n.t('custom_pushbullet_title')}</h4>
                <Button
                    variant="contained"
                    disabled={!this.props.data.apikey}
                    onClick={() => void this.readData()}
                >
                    {I18n.t('custom_pushbullet_read_devices')}
                </Button>
                <TableContainer
                    component={Paper}
                    style={{ width: '100%' }}
                >
                    <Table
                        style={{ width: '100%' }}
                        size="small"
                    >
                        <TableHead>
                            <TableRow>
                                <TableCell></TableCell>
                                <TableCell>{I18n.t('custom_pushbullet_name')}</TableCell>
                                <TableCell>{I18n.t('custom_pushbullet_type')}</TableCell>
                                <TableCell>{I18n.t('custom_pushbullet_id')}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {this.state.devices.map(device => (
                                <TableRow
                                    key={device.iden}
                                    sx={theme => ({
                                        '&:last-child td, &:last-child th': { border: 0 },
                                        backgroundColor:
                                            this.props.data.receivermail === device.iden
                                                ? theme.palette.mode === 'dark'
                                                    ? '#006e23'
                                                    : '#1ed25d'
                                                : undefined,
                                    })}
                                >
                                    <TableCell>
                                        {this.props.data.receivermail !== device.iden &&
                                        device.nickname !== 'ioBroker' ? (
                                            <IconButton
                                                onClick={() => {
                                                    const data: Record<string, any> = JSON.parse(
                                                        JSON.stringify(this.props.data),
                                                    );
                                                    data.receivermail = device.iden;
                                                    this.props.onChange(data, device.iden);
                                                }}
                                            >
                                                <Check />
                                            </IconButton>
                                        ) : null}
                                    </TableCell>
                                    <TableCell
                                        component="th"
                                        scope="row"
                                    >
                                        {device.type}
                                    </TableCell>
                                    <TableCell>{device.nickname}</TableCell>
                                    <TableCell>{device.iden}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        );
    }
}
