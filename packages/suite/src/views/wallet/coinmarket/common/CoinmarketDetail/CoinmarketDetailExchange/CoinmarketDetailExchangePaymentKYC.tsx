import styled from 'styled-components';
import { ExchangeProviderInfo } from 'invity-api';

import { Button, variables, Link, Image } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

import { useDispatch } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';
import { Translation } from 'src/components/suite/Translation';
import { goto } from 'src/actions/suite/routerActions';
import { CoinmarketTransactionId } from 'src/views/wallet/coinmarket/common/CoinmarketTransactionId';

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    flex-direction: column;
`;

const Title = styled.div`
    margin-top: 25px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const Description = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    margin: 17px 0 10px;
    max-width: 310px;
    text-align: center;
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const LinkWrapper = styled(Link)`
    margin-top: ${spacingsPx.xxs};
    margin-bottom: ${spacingsPx.lg};
`;

interface PaymentKYCProps {
    transactionId?: string;
    supportUrl?: string;
    provider?: ExchangeProviderInfo;
    account: Account;
}

export const CoinmarketDetailExchangePaymentKYC = ({
    transactionId,
    supportUrl,
    provider,
    account,
}: PaymentKYCProps) => {
    const dispatch = useDispatch();

    const goToExchange = () =>
        dispatch(
            goto('wallet-coinmarket-exchange', {
                params: {
                    symbol: account.symbol,
                    accountIndex: account.index,
                    accountType: account.accountType,
                },
            }),
        );

    return (
        <Wrapper>
            <Image image="UNI_WARNING" />
            <Title>
                <Translation id="TR_EXCHANGE_DETAIL_KYC_TITLE" />
            </Title>
            <Description>
                <Translation id="TR_EXCHANGE_DETAIL_KYC_TEXT" />
            </Description>
            {transactionId && <CoinmarketTransactionId transactionId={transactionId} />}
            {supportUrl && (
                <LinkWrapper>
                    <Link href={supportUrl} target="_blank">
                        <Button variant="tertiary">
                            <Translation id="TR_EXCHANGE_DETAIL_KYC_SUPPORT" />
                        </Button>
                    </Link>
                </LinkWrapper>
            )}
            {provider?.kycUrl && (
                <Link href={provider?.kycUrl} target="_blank">
                    <Button variant="tertiary">
                        <Translation id="TR_EXCHANGE_DETAIL_KYC_INFO_LINK" />
                    </Button>
                </Link>
            )}
            <Button onClick={goToExchange}>
                <Translation id="TR_EXCHANGE_DETAIL_KYC_BUTTON" />
            </Button>
        </Wrapper>
    );
};
