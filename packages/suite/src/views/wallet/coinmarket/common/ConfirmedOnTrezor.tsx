import React from 'react';

import styled from 'styled-components';

import { TrezorDevice } from '@suite-common/suite-types';
import { variables } from '@trezor/components';
import { RotateDeviceImage } from '@trezor/product-components';

import { Translation } from 'src/components/suite';

const Confirmed = styled.div`
    display: flex;
    height: 60px;
    font-size: ${variables.FONT_SIZE.BIG};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    background: ${({ theme }) => theme.legacy.BG_GREY};
    align-items: center;
    justify-content: center;
    margin-top: 27px;
    gap: 10px;
`;

// reason: set size of RotateDeviceImage
// eslint-disable-next-line local-rules/no-override-ds-component
const StyledRotateDeviceImage = styled(RotateDeviceImage)`
    height: 34px;
`;

interface ConfirmedOnTrezorProps {
    device?: TrezorDevice;
}

export const ConfirmedOnTrezor = ({ device }: ConfirmedOnTrezorProps) => {
    return (
        <Confirmed>
            <StyledRotateDeviceImage
                deviceModel={device?.features?.internal_model}
                deviceColor={device?.features?.unit_color}
                animationHeight="34px"
                animationWidth="34px"
            />

            <Translation id="TR_BUY_CONFIRMED_ON_TREZOR" />
        </Confirmed>
    );
};
