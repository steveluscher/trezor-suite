import styled from 'styled-components';

import { Button, Link } from '@trezor/components';
import { DATA_URL } from '@trezor/urls';

import { Translation, Modal, Metadata } from 'src/components/suite';
import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { isWebUsb } from 'src/utils/suite/transport';
import { useOpenSuiteDesktop } from 'src/hooks/suite/useOpenSuiteDesktop';

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledButton = styled(Button)`
    path {
        fill: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
    }
`;

const Footer = styled.div`
    width: 100%;
    margin-top: 72px;
    display: flex;
    justify-content: space-between;
`;

const DownloadStandalone = ({ target }: { target: string }) => {
    return (
        <Modal.Description>
            Alternatively you may{' '}
            <Link variant="underline" href={target}>
                download
            </Link>{' '}
            a standalone Trezor Bridge binary
        </Modal.Description>
    );
};

// it actually changes to "Install suite desktop"
export const BridgeUnavailable = () => {
    const transport = useSelector(state => state.suite.transport);
    const dispatch = useDispatch();

    const preferredTarget = transport?.bridge?.packages?.find(i => i.preferred === true);
    const target = preferredTarget
        ? `${DATA_URL}${preferredTarget.url}`
        : 'https://github.com/trezor/data/tree/master/bridge/2.0.27';

    const handleOpenSuite = useOpenSuiteDesktop();

    const goToWallet = () => dispatch(goto('wallet-index'));

    // if bridge is running, user will never be directed to this page, but since this page is accessible directly over /bridge url
    // it makes sense to show some meaningful information here
    if (transport?.type) {
        const description = isWebUsb(transport)
            ? `Using WebUSB. No action required.`
            : `Trezor Bridge HTTP server is running.  Version: ${transport?.version}`;

        return (
            <Modal
                heading={<Translation id="TR_BRIDGE" />}
                description={description}
                data-testid="@modal/bridge"
            >
                <Metadata title="Bridge | Trezor Suite" />

                <DownloadStandalone target={target} />
                <Footer>
                    <StyledButton
                        icon="caretLeft"
                        variant="tertiary"
                        onClick={goToWallet}
                        data-testid="@bridge/goto/wallet-index"
                    >
                        <Translation id="TR_TAKE_ME_BACK_TO_WALLET" />
                    </StyledButton>

                    <Button onClick={handleOpenSuite}>
                        <Translation id="TR_OPEN_TREZOR_SUITE_DESKTOP" />
                    </Button>
                </Footer>
            </Modal>
        );
    }

    return (
        <Modal
            heading={<Translation id="TR_BRIDGE" />}
            description={<Translation id="TR_BRIDGE_NEEDED_DESCRIPTION" />}
            data-testid="@modal/bridge"
        >
            <Metadata title="Bridge | Trezor Suite" />
            <DownloadStandalone target={target} />

            <Footer>
                <Button onClick={handleOpenSuite}>
                    <Translation id="TR_OPEN_TREZOR_SUITE_DESKTOP" />
                </Button>
            </Footer>
        </Modal>
    );
};
