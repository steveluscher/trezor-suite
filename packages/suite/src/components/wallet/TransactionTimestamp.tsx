import styled from 'styled-components';

import { spacingsPx, typography } from '@trezor/theme';

import { FormattedDate } from 'src/components/suite';
import { WalletAccountTransaction } from 'src/types/wallet';

const TimestampLink = styled.div`
    display: block;
    font-variant-numeric: tabular-nums;
    color: ${({ theme }) => theme.textSubdued};
    ${typography.hint}
    white-space: nowrap;
    margin-top: ${spacingsPx.xxs};
`;

interface TransactionTimestampProps {
    showDate?: boolean;
    transaction: WalletAccountTransaction;
}

export const TransactionTimestamp = ({
    showDate = false,
    transaction,
}: TransactionTimestampProps) => {
    const { blockTime } = transaction;

    return (
        <TimestampLink>
            {blockTime && <FormattedDate value={new Date(blockTime * 1000)} time date={showDate} />}
        </TimestampLink>
    );
};
