import styled from 'styled-components';

import { variables } from '@trezor/components';
import { typography } from '@trezor/theme';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectBlockchainExplorerBySymbol } from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';
import { NotificationCard, Translation } from 'src/components/suite';

const TextWrapper = styled.div`
    display: flex;
    text-align: start;
    flex-direction: column;

    ${variables.SCREEN_QUERY.MOBILE} {
        gap: 2px;
    }
`;

const Heading = styled.span`
    font-weight: ${typography.highlight};
`;

const Description = styled.span`
    color: ${({ theme }) => theme.textSubdued};
`;

interface AnalyzeInExplorerBannerProps {
    txid: string;
    symbol: NetworkSymbol;
}

export const AnalyzeInExplorerBanner = ({ txid, symbol }: AnalyzeInExplorerBannerProps) => {
    const explorer = useSelector(state => selectBlockchainExplorerBySymbol(state, symbol));

    return (
        <NotificationCard
            variant="info"
            icon="cube"
            button={{
                href: `${explorer?.tx}${txid}${explorer.queryString ?? ''}`,
                children: <Translation id="TR_ANALYZE_IN_EXPLORER_OPEN" />,
                icon: 'arrowUpRight',
                iconAlignment: 'right',
                size: 'small',
            }}
        >
            <TextWrapper>
                <Heading>
                    <Translation id="TR_ANALYZE_IN_EXPLORER" />
                </Heading>
                <Description>
                    <Translation id="TR_ANALYZE_IN_EXPLORER_DESC" />
                </Description>
            </TextWrapper>
        </NotificationCard>
    );
};
