import React from 'react';

import { TextProps } from '@suite-native/atoms';
import { useFormatters } from '@suite-common/formatters';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { isTestnet } from '@suite-common/wallet-utils';

import { FormatterProps } from '../types';
import { EmptyAmountSkeleton } from './EmptyAmountSkeleton';
import { EmptyAmountText } from './EmptyAmountText';
import { AmountText } from './AmountText';

type FiatAmountFormatterProps = FormatterProps<string | null> &
    TextProps & {
        network?: NetworkSymbol;
        isDiscreetText?: boolean;
        isForcedDiscreetMode?: boolean;
        isLoading?: boolean;
    };

export const FiatAmountFormatter = React.memo(
    ({
        network,
        value,
        isDiscreetText = true,
        isLoading = false,
        ...otherProps
    }: FiatAmountFormatterProps) => {
        const { FiatAmountFormatter: formatter } = useFormatters();

        if (!!network && isTestnet(network)) {
            return <EmptyAmountText />;
        }
        if (isLoading || value === null) {
            return <EmptyAmountSkeleton />;
        }

        const formattedValue = formatter.format(value);

        return (
            <AmountText value={formattedValue} isDiscreetText={isDiscreetText} {...otherProps} />
        );
    },
);
