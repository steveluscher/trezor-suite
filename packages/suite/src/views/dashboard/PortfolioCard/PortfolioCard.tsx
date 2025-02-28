import { memo, useMemo } from 'react';

import styled from 'styled-components';

import { Dropdown, Card, Tooltip, Column } from '@trezor/components';
import { spacings } from '@trezor/theme';
import { getTotalFiatBalance } from '@suite-common/wallet-utils';
import { selectCurrentFiatRates } from '@suite-common/wallet-core';
import { hasBitcoinOnlyFirmware } from '@trezor/device-utils';

import { GraphScaleDropdownItem, GraphSkeleton, Translation } from 'src/components/suite';
import { DashboardSection } from 'src/components/dashboard';
import { useDevice, useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';
import { useFastAccounts } from 'src/hooks/wallet';
import { goto } from 'src/actions/suite/routerActions';
import { setFlag } from 'src/actions/suite/suiteActions';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';

import { PortfolioCardHeader } from './PortfolioCardHeader';
import { PortfolioCardException } from './PortfolioCardException';
import { EmptyWallet } from './EmptyWallet';
import { DashboardGraph } from './DashboardGraph';

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledDropdown = styled(Dropdown)`
    display: flex;
    height: 38px;
`;

const SkeletonTransactionsGraphWrapper = styled.div`
    display: flex;
    flex-direction: column;
    padding: 20px 0;
    height: 320px;
`;

const Wrapper = styled.div`
    display: flex;
`;

export const PortfolioCard = memo(() => {
    const currentFiatRates = useSelector(selectCurrentFiatRates);
    const localCurrency = useSelector(selectLocalCurrency);
    const { discovery, getDiscoveryStatus, isDiscoveryRunning } = useDiscovery();
    const accounts = useFastAccounts();
    const { dashboardGraphHidden } = useSelector(s => s.suite.flags);
    const dispatch = useDispatch();
    const { device } = useDevice();

    const isDeviceEmpty = useMemo(() => accounts.every(a => a.empty), [accounts]);
    const fiatAmount = getTotalFiatBalance({
        deviceAccounts: accounts,
        localCurrency,
        rates: currentFiatRates,
    }).toString();

    const discoveryStatus = getDiscoveryStatus();

    // TODO: DashboardGraph will get mounted twice (thus triggering data processing twice)
    // 1. DashboardGraph gets mounted
    // 2. Discovery starts, DashboardGraph is unmounted, Loading mounts
    // 3. Discovery stops (no accounts added), Loading unmounted, new instance of DashboardGraph gets mounted

    let body = null;
    if (discoveryStatus && discoveryStatus.status === 'exception') {
        body = <PortfolioCardException exception={discoveryStatus} discovery={discovery} />;
    } else if (discoveryStatus && discoveryStatus.status === 'loading') {
        body = dashboardGraphHidden ? null : (
            <SkeletonTransactionsGraphWrapper>
                <Wrapper>
                    <GraphSkeleton data-testid="@dashboard/loading" />
                </Wrapper>
            </SkeletonTransactionsGraphWrapper>
        );
    } else if (isDeviceEmpty) {
        body = <EmptyWallet />;
    } else if (!dashboardGraphHidden) {
        body = <DashboardGraph accounts={accounts} />;
    }

    const isWalletEmpty = !discoveryStatus && isDeviceEmpty;
    const isWalletLoading = discoveryStatus?.status === 'loading';
    const isWalletError = discoveryStatus?.status === 'exception';
    const showGraphControls =
        !isWalletEmpty && !isWalletLoading && !isWalletError && !dashboardGraphHidden;

    const showMissingDataTooltip =
        showGraphControls &&
        !hasBitcoinOnlyFirmware(device) &&
        !!accounts.some(
            account =>
                account.history &&
                (account.tokens?.length || ['ripple', 'solana'].includes(account.networkType)),
        );

    const goToReceive = () => dispatch(goto('wallet-receive'));
    const heading = <Translation id="TR_MY_PORTFOLIO" />;

    return (
        <DashboardSection
            heading={
                showMissingDataTooltip ? (
                    <Tooltip hasIcon content={<Translation id="TR_GRAPH_MISSING_DATA" />}>
                        {heading}
                    </Tooltip>
                ) : (
                    heading
                )
            }
            actions={
                !isWalletEmpty && !isWalletLoading && !isWalletError ? (
                    <StyledDropdown
                        alignMenu="bottom-right"
                        items={[
                            {
                                key: 'group1',
                                label: 'Graph View',
                                options: [
                                    {
                                        label: <GraphScaleDropdownItem />,
                                        shouldCloseOnClick: false,
                                    },
                                    {
                                        icon: dashboardGraphHidden ? 'show' : 'hide',
                                        label: dashboardGraphHidden ? (
                                            <Translation id="TR_SHOW_GRAPH" />
                                        ) : (
                                            <Translation id="TR_HIDE_GRAPH" />
                                        ),
                                        shouldCloseOnClick: false,
                                        onClick: () =>
                                            dispatch(
                                                setFlag(
                                                    'dashboardGraphHidden',
                                                    !dashboardGraphHidden,
                                                ),
                                            ),
                                    },
                                ],
                            },
                        ]}
                    />
                ) : undefined
            }
        >
            <Card paddingType="none">
                {discoveryStatus && discoveryStatus.status === 'exception' ? null : (
                    <PortfolioCardHeader
                        showGraphControls={showGraphControls}
                        hideBorder={!body}
                        fiatAmount={fiatAmount}
                        localCurrency={localCurrency}
                        isWalletEmpty={isWalletEmpty}
                        isWalletLoading={isWalletLoading}
                        isWalletError={isWalletError}
                        isDiscoveryRunning={isDiscoveryRunning}
                        receiveClickHandler={goToReceive}
                    />
                )}

                {body && (
                    <Column
                        justifyContent="center"
                        alignItems="stretch"
                        minHeight={329}
                        flex="1"
                        margin={{ left: spacings.lg, right: spacings.lg }}
                    >
                        {body}
                    </Column>
                )}
            </Card>
        </DashboardSection>
    );
});
