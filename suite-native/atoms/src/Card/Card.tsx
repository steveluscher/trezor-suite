import { ReactNode } from 'react';
import { View } from 'react-native';

import { RequireAllOrNone } from 'type-fest';
import { G } from '@mobily/ts-belt';

import { NativeStyleObject, prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { Color } from '@trezor/theme';

import { AlertBox, AlertBoxProps } from '../AlertBox';

export type CardProps = {
    children: ReactNode;
    style?: NativeStyleObject;
    noPadding?: boolean;
    borderColor?: Color;
} & RequireAllOrNone<
    { alertVariant: AlertBoxProps['variant']; alertTitle: AlertBoxProps['title'] },
    'alertVariant' | 'alertTitle'
>;

const cardContainerStyle = prepareNativeStyle<{
    isAlertDisplayed: boolean;
    noPadding: boolean;
    borderColor?: Color;
}>((utils, { isAlertDisplayed, noPadding, borderColor }) => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderRadius: utils.borders.radii.r16,
    padding: noPadding ? 0 : utils.spacings.sp16,
    ...utils.boxShadows.small,

    extend: [
        {
            condition: isAlertDisplayed,
            style: {
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
            },
        },
        {
            condition: G.isNotNullable(borderColor),
            style: {
                borderColor: utils.colors[borderColor!],
                borderWidth: utils.borders.widths.small,
            },
        },
    ],
}));

const alertBoxWrapperStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.backgroundSurfaceElevation1,
    borderTopLeftRadius: utils.borders.radii.r16,
    borderTopRightRadius: utils.borders.radii.r16,
    paddingHorizontal: utils.spacings.sp4,
    paddingTop: utils.spacings.sp4,
}));

export const Card = ({
    children,
    style,
    alertVariant,
    alertTitle,
    borderColor,
    noPadding = false,
}: CardProps) => {
    const { applyStyle } = useNativeStyles();

    const isAlertDisplayed = !!alertVariant;

    return (
        <View>
            {isAlertDisplayed && (
                <View style={applyStyle(alertBoxWrapperStyle)}>
                    <AlertBox variant={alertVariant} title={alertTitle} borderRadius={12} />
                </View>
            )}
            {/* CAUTION: in case that alert is displayed, it is not possible to change styles of the top borders by the `style` prop. */}
            <View
                style={[
                    applyStyle(cardContainerStyle, { isAlertDisplayed, noPadding, borderColor }),
                    style,
                ]}
            >
                {children}
            </View>
        </View>
    );
};
