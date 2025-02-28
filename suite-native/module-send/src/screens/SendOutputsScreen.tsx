import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useEffect, useState } from 'react';
import { useWatch } from 'react-hook-form';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Keyboard } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { isFulfilled } from '@reduxjs/toolkit';

import {
    AccountsRootState,
    FeesRootState,
    SendRootState,
    composeSendFormTransactionFeeLevelsThunk,
    selectAccountByKey,
    selectNetworkFeeInfo,
    selectSendFormDraftByKey,
    sendFormActions,
    updateFeeInfoThunk,
} from '@suite-common/wallet-core';
import {
    SendStackParamList,
    SendStackRoutes,
    StackNavigationProps,
    StackProps,
} from '@suite-native/navigation';
import { getNetwork } from '@suite-common/wallet-config';
import { Box, Button } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useDebounce } from '@trezor/react-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useForm, Form } from '@suite-native/forms';
import { selectIsAmountInSats, SettingsSliceRootState } from '@suite-native/settings';
import { TokenAddress } from '@suite-common/wallet-types';
import { selectAccountTokenInfo, TokensRootState } from '@suite-native/tokens';

import { SendScreen } from '../components/SendScreen';
import { SendOutputFields } from '../components/SendOutputFields';
import { SendOutputsFormValues, sendOutputsFormValidationSchema } from '../sendOutputsFormSchema';
import { AccountBalanceScreenHeader } from '../components/SendScreenSubHeader';
import { calculateFeeLevelsMaxAmountThunk } from '../sendFormThunks';
import { constructFormDraft } from '../utils';
import { FeeLevelsMaxAmount } from '../types';
import { storeFeeLevels } from '../sendFormSlice';

const buttonWrapperStyle = prepareNativeStyle(utils => ({
    width: '100%',
    padding: utils.spacings.sp16,
}));

const getDefaultValues = ({
    tokenContract,
}: {
    tokenContract?: TokenAddress;
}): Readonly<SendOutputsFormValues> => {
    return {
        outputs: [
            {
                amount: '',
                address: '',
                fiat: '',
                token: tokenContract ?? null,
            },
        ],
    } as const;
};

export const SendOutputsScreen = ({
    route: { params },
}: StackProps<SendStackParamList, SendStackRoutes.SendOutputs>) => {
    const { accountKey, tokenContract } = params;
    const dispatch = useDispatch();
    const { applyStyle } = useNativeStyles();
    const debounce = useDebounce();
    const navigation =
        useNavigation<StackNavigationProps<SendStackParamList, SendStackRoutes.SendOutputs>>();

    const [feeLevelsMaxAmount, setFeeLevelsMaxAmount] = useState<FeeLevelsMaxAmount>();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const tokenInfo = useSelector((state: TokensRootState) =>
        selectAccountTokenInfo(state, accountKey, tokenContract),
    );

    const isAmountInSats = useSelector((state: SettingsSliceRootState) =>
        selectIsAmountInSats(state, account?.symbol),
    );
    const networkFeeInfo = useSelector((state: FeesRootState) =>
        selectNetworkFeeInfo(state, account?.symbol),
    );
    const sendFormDraft = useSelector((state: SendRootState) =>
        selectSendFormDraftByKey(state, accountKey, tokenContract),
    );

    const network = account ? getNetwork(account.symbol) : null;

    const form = useForm<SendOutputsFormValues>({
        validation: sendOutputsFormValidationSchema,
        context: {
            networkFeeInfo,
            networkSymbol: account?.symbol,
            availableBalance: tokenInfo?.balance ?? account?.availableBalance,
            isTokenFlow: !!tokenContract,
            isValueInSats: isAmountInSats,
            feeLevelsMaxAmount,
            decimals: tokenInfo?.decimals ?? network?.decimals,
        },
        defaultValues: getDefaultValues({ tokenContract }),
    });

    const {
        handleSubmit,
        control,
        getValues,
        setValue,
        trigger,
        formState: { isValid, isSubmitting },
    } = form;
    const watchedFormValues = useWatch({ control });
    const watchedAddress = useWatch({ name: 'outputs.0.address', control });

    const storeFormDraftIfValid = useCallback(() => {
        const normalFeeLevel = networkFeeInfo?.levels.find(level => level.label === 'normal');

        dispatch(
            sendFormActions.storeDraft({
                accountKey,
                tokenContract,
                formState: constructFormDraft({
                    formValues: getValues(),
                    tokenContract,
                    feeLevel: normalFeeLevel,
                }),
            }),
        );
    }, [accountKey, dispatch, getValues, tokenContract, networkFeeInfo]);

    const calculateNormalFeeMaxAmount = useCallback(async () => {
        const response = await dispatch(
            calculateFeeLevelsMaxAmountThunk({
                formState: constructFormDraft({ formValues: getValues() }),
                accountKey,
            }),
        );

        if (isFulfilled(response)) {
            setFeeLevelsMaxAmount(response.payload);
        }
    }, [getValues, accountKey, dispatch]);

    useEffect(() => {
        const prefillValuesFromStoredDraft = async () => {
            if (sendFormDraft?.outputs) {
                setValue('outputs', sendFormDraft.outputs);
                await calculateNormalFeeMaxAmount();
                trigger();
            }
        };

        prefillValuesFromStoredDraft();
        // this effect should be triggered only for the first render to fill the form with the stored draft on entry.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Triggered for every change of watchedFormValues.
    useEffect(() => {
        if (isValid) debounce(storeFormDraftIfValid);
    }, [storeFormDraftIfValid, watchedFormValues, debounce, isValid]);

    useEffect(() => {
        // The max amount is equal to the total token balance for tokens. (fee is paid in mainnet currency)
        if (!tokenContract) calculateNormalFeeMaxAmount();
    }, [watchedAddress, calculateNormalFeeMaxAmount, networkFeeInfo, tokenContract]);

    // TODO: Fetch periodically. So if the user stays on the screen for a long time, the fee info is updated in the background.
    useEffect(() => {
        if (account) dispatch(updateFeeInfoThunk(account.symbol));
    }, [account, dispatch]);

    if (!account || !networkFeeInfo) return null;

    const handleNavigateToReviewScreen = handleSubmit(async values => {
        // Keyboard has to be dismissed here before navigating, so it's animation is not interfering with the animations on the FeesScreen.
        Keyboard.dismiss();

        if (!network) return;

        const response = await dispatch(
            composeSendFormTransactionFeeLevelsThunk({
                formState: constructFormDraft({ formValues: values, tokenContract }),
                composeContext: {
                    account,
                    network,
                    feeInfo: networkFeeInfo,
                },
            }),
        );

        if (isFulfilled(response)) {
            dispatch(storeFeeLevels({ feeLevels: response.payload }));
            navigation.navigate(SendStackRoutes.SendFees, {
                accountKey,
                tokenContract,
            });

            return;
        }
    });

    return (
        <SendScreen
            screenHeader={
                <AccountBalanceScreenHeader accountKey={accountKey} tokenContract={tokenContract} />
            }
            footer={
                isValid && (
                    <Animated.View
                        entering={SlideInDown}
                        exiting={SlideOutDown}
                        style={applyStyle(buttonWrapperStyle)}
                    >
                        <Button
                            accessibilityRole="button"
                            accessibilityLabel="validate send form"
                            testID="@send/form-submit-button"
                            onPress={handleNavigateToReviewScreen}
                            isDisabled={isSubmitting}
                        >
                            <Translation id="generic.buttons.continue" />
                        </Button>
                    </Animated.View>
                )
            }
        >
            <Box marginVertical="sp32">
                <Form form={form}>
                    <SendOutputFields accountKey={accountKey} />
                </Form>
            </Box>
        </SendScreen>
    );
};
