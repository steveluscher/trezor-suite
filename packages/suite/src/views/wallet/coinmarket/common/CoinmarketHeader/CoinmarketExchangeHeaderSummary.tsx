import { useTheme } from 'styled-components';
import { CryptoId } from 'invity-api';

import { H3, Icon, Row, Text } from '@trezor/components';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { spacings } from '@trezor/theme';

import { CoinmarketTradeExchangeType } from 'src/types/coinmarket/coinmarket';
import { useSelector } from 'src/hooks/suite';
import { FiatValue, FormattedCryptoAmount, Translation } from 'src/components/suite';
import { CoinmarketCryptoAmount } from 'src/views/wallet/coinmarket/common/CoinmarketCryptoAmount';
import { useCoinmarketFormContext } from 'src/hooks/wallet/coinmarket/form/useCoinmarketCommonForm';

interface CoinmarketExchangeHeaderSummaryProps {
    sendAmount: string | number | undefined;
    sendCurrency: CryptoId | string | undefined;
    receiveCurrency: CryptoId | undefined;
}

export const CoinmarketExchangeHeaderSummary = ({
    sendAmount,
    sendCurrency,
    receiveCurrency,
}: CoinmarketExchangeHeaderSummaryProps) => {
    const theme = useTheme();
    const context = useCoinmarketFormContext<CoinmarketTradeExchangeType>();
    const { account } = context;
    const { symbol } = account;
    const fee = useSelector(state => state.wallet.coinmarket.composedTransactionInfo.composed?.fee);
    const feeAmount = formatNetworkAmount(fee || '0', symbol);

    return (
        <Row
            alignItems="center"
            justifyContent="space-between"
            gap={spacings.md}
            flexWrap="wrap"
            width="100%"
        >
            <Row alignItems="center" gap={spacings.sm} flexWrap="wrap">
                {sendCurrency && (
                    <H3>
                        <CoinmarketCryptoAmount
                            amount={sendAmount}
                            cryptoId={sendCurrency as CryptoId}
                            displayLogo
                        />
                    </H3>
                )}
                <Icon variant="tertiary" name="arrowRightLong" />
                {receiveCurrency && (
                    <H3>
                        <CoinmarketCryptoAmount cryptoId={receiveCurrency} displayLogo />
                    </H3>
                )}
            </Row>
            <Text typographyStyle="hint" color={theme.textSubdued}>
                <Translation
                    id="TR_EXCHANGE_FEES_INFO"
                    values={{
                        feeAmount: (
                            <FormattedCryptoAmount
                                disableHiddenPlaceholder
                                value={feeAmount}
                                symbol={symbol}
                            />
                        ),
                        feeAmountFiat: (
                            <FiatValue
                                disableHiddenPlaceholder
                                amount={feeAmount}
                                symbol={symbol}
                            />
                        ),
                    }}
                />
            </Text>
        </Row>
    );
};
