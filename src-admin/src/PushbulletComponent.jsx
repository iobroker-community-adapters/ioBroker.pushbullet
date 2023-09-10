import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@mui/styles';

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
// import ConfigGeneric from '@iobroker/adapter-react-v5/ConfigGeneric';
// valid
import { ConfigGeneric, I18n } from '@iobroker/adapter-react-v5';

const styles = theme => ({
    table: {
        minWidth: 400
    },
    header: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    selected: {
        backgroundColor: theme.palette.mode === 'dark' ? '#006e23' : '#1ed25d',
    },
});

class PushbulletComponent extends ConfigGeneric {
    constructor(props) {
        super(props);
        this.state = {
            devices: [],
        };
    }

    componentDidMount() {
        super.componentDidMount();
        if (this.props.data.apikey) {
            this.readData();
        }
    }

    readData() {
        fetch(`https://api.pushbullet.com/v2/devices`, {
            headers: {
                Authorization: `Bearer ${this.props.data.apikey}`,
            },
        })
            .then(res => res.json())
            .then(json => {
                if (json.error) {
                    window.alert(`Cannot read devices: ${json.error.message}`);
                } else {
                    this.setState({ devices: json.devices || [] });
                }
            })
            .catch(e => window.alert(`Cannot read devices: ${e}`));
    }

    renderItem() {
        return <div style={{ width: '100%'}}>
            <h4>{I18n.t('custom_pushbullet_title')}</h4>
            <Button
                variant="contained"
                disabled={!this.props.data.apikey}
                onClick={() => this.readData()}
            >
                {I18n.t('custom_pushbullet_read_devices')}
            </Button>
            <TableContainer component={Paper} style={{ width: '100%' }}>
                <Table style={{ width: '100%' }} size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell></TableCell>
                            <TableCell>{I18n.t('custom_pushbullet_name')}</TableCell>
                            <TableCell>{I18n.t('custom_pushbullet_type')}</TableCell>
                            <TableCell>{I18n.t('custom_pushbullet_id')}</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {this.state.devices.map(device => <TableRow
                            key={device.iden}
                            sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                            className={this.props.data.receivermail === device.iden ? this.props.classes.selected : null}
                        >
                            <TableCell>
                                {this.props.data.receivermail !== device.iden && device.nickname !== 'ioBroker' ?
                                    <IconButton
                                        onClick={() => {
                                            const data = JSON.parse(JSON.stringify(this.props.data));
                                            data.receivermail = device.iden;
                                            this.props.onChange(data, device.iden)
                                        }}
                                    >
                                        <Check />
                                    </IconButton> : null}
                            </TableCell>
                            <TableCell component="th" scope="row">{device.type}</TableCell>
                            <TableCell>{device.nickname}</TableCell>
                            <TableCell>{device.iden}</TableCell>
                        </TableRow>)}
                    </TableBody>
                </Table>
            </TableContainer>
        </div>;
    }
}

PushbulletComponent.propTypes = {
    socket: PropTypes.object.isRequired,
    themeType: PropTypes.string,
    themeName: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    data: PropTypes.object.isRequired,
    attr: PropTypes.string,
    schema: PropTypes.object,
    onError: PropTypes.func,
    onChange: PropTypes.func,
};

export default withStyles(styles)(PushbulletComponent);