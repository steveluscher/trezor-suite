import { CryptoId } from 'invity-api';

import { onCancel as onCancelAction } from 'src/actions/suite/modalActions';
import { MODAL } from 'src/actions/suite/constants';
import { useDispatch } from 'src/hooks/suite';
import {
    PinMismatchModal,
    PassphraseDuplicateModal,
    CoinmarketTermsModal,
    ConfirmAddressModal,
    ConfirmXpubModal,
    TransactionReviewModal,
    ImportTransactionModal,
    AddAccountModal,
    QrScannerModal,
    BackgroundGalleryModal,
    TxDetailModal,
    ApplicationLogModal,
    WipeDeviceModal,
    MetadataProviderModal,
    AdvancedCoinSettingsModal,
    AddTokenModal,
    SafetyChecksModal,
    DisableTorModal,
    DisableTorStopCoinjoinModal,
    RequestEnableTorModal,
    TorLoadingModal,
    CancelCoinjoinModal,
    CriticalCoinjoinPhaseModal,
    CoinjoinSuccessModal,
    MoreRoundsNeededModal,
    UnecoCoinjoinModal,
    AuthenticateDeviceModal,
    AuthenticateDeviceFailModal,
    DeviceAuthenticityOptOutModal,
    StakeEthInANutshellModal,
    StakeModal,
    UnstakeModal,
    ClaimModal,
    CopyAddressModal,
    UnhideTokenModal,
    ConfirmUnverifiedAddressModal,
    ConfirmUnverifiedXpubModal,
    ConfirmUnverifiedProceedModal,
} from 'src/components/suite/modals';
import type { AcquiredDevice } from 'src/types/suite';

import type { ReduxModalProps } from '../ReduxModal';
import { EverstakeModal } from './UnstakeModal/EverstakeModal';
import { PassphraseMismatchModal } from './PassphraseMismatchModal';
import { FirmwareRevisionOptOutModal } from './FirmwareRevisionOptOutModal';

/** Modals opened as a result of user action */
export const UserContextModal = ({
    payload,
    renderer,
}: ReduxModalProps<typeof MODAL.CONTEXT_USER>) => {
    const dispatch = useDispatch();

    const onCancel = () => dispatch(onCancelAction());

    switch (payload.type) {
        case 'add-account':
            return (
                <AddAccountModal
                    device={payload.device as AcquiredDevice}
                    symbol={payload.symbol}
                    noRedirect={payload.noRedirect}
                    isCoinjoinDisabled={payload.isCoinjoinDisabled}
                    isBackClickDisabled={payload.isBackClickDisabled}
                    onCancel={onCancel}
                />
            );
        case 'unverified-address':
            return (
                <ConfirmUnverifiedAddressModal
                    addressPath={payload.addressPath}
                    value={payload.value}
                />
            );
        case 'unverified-xpub':
            return <ConfirmUnverifiedXpubModal />;
        case 'unverified-address-proceed':
            return <ConfirmUnverifiedProceedModal value={payload.value} />;
        case 'address':
            return <ConfirmAddressModal {...payload} onCancel={onCancel} />;
        case 'xpub':
            return <ConfirmXpubModal {...payload} onCancel={onCancel} />;
        case 'device-background-gallery':
            return <BackgroundGalleryModal onCancel={onCancel} />;
        case 'wipe-device':
            return <WipeDeviceModal onCancel={onCancel} />;
        case 'device-authenticity-opt-out':
            return <DeviceAuthenticityOptOutModal onCancel={onCancel} />;
        case 'firmware-revision-opt-out':
            return <FirmwareRevisionOptOutModal onCancel={onCancel} />;
        case 'qr-reader':
            return <QrScannerModal decision={payload.decision} onCancel={onCancel} />;
        case 'transaction-detail':
            return <TxDetailModal {...payload} onCancel={onCancel} />;
        case 'passphrase-duplicate':
            return (
                <PassphraseDuplicateModal device={payload.device} duplicate={payload.duplicate} />
            );
        case 'review-transaction':
            return <TransactionReviewModal {...payload} />;
        case 'coinmarket-buy-terms': {
            return (
                <CoinmarketTermsModal
                    onCancel={onCancel}
                    type="BUY"
                    decision={payload.decision}
                    provider={payload.provider}
                    cryptoCurrency={payload.cryptoCurrency as CryptoId}
                />
            );
        }
        case 'coinmarket-sell-terms':
            return (
                <CoinmarketTermsModal
                    onCancel={onCancel}
                    type="SELL"
                    decision={payload.decision}
                    provider={payload.provider}
                    cryptoCurrency={payload.cryptoCurrency as CryptoId}
                />
            );

        case 'coinmarket-exchange-terms':
            return (
                <CoinmarketTermsModal
                    onCancel={onCancel}
                    type="COINMARKET_SWAP"
                    decision={payload.decision}
                    provider={payload.provider}
                    toCryptoCurrency={payload.toCryptoCurrency as CryptoId}
                    fromCryptoCurrency={payload.fromCryptoCurrency as CryptoId}
                />
            );
        case 'coinmarket-exchange-dex-terms':
            return (
                <CoinmarketTermsModal
                    onCancel={onCancel}
                    type="COINMARKET_SWAP_DEX"
                    decision={payload.decision}
                    provider={payload.provider}
                    toCryptoCurrency={payload.toCryptoCurrency as CryptoId}
                    fromCryptoCurrency={payload.fromCryptoCurrency as CryptoId}
                />
            );
        case 'import-transaction':
            return <ImportTransactionModal {...payload} onCancel={onCancel} />;
        case 'pin-mismatch':
            return <PinMismatchModal renderer={renderer} />;
        case 'application-log':
            return <ApplicationLogModal onCancel={onCancel} />;
        case 'metadata-provider':
            return <MetadataProviderModal onCancel={onCancel} decision={payload.decision} />;
        case 'advanced-coin-settings':
            return <AdvancedCoinSettingsModal {...payload} onCancel={onCancel} />;
        case 'add-token':
            return <AddTokenModal {...payload} onCancel={onCancel} />;
        case 'safety-checks':
            return <SafetyChecksModal onCancel={onCancel} />;
        case 'disable-tor':
            return <DisableTorModal decision={payload.decision} onCancel={onCancel} />;
        case 'request-enable-tor':
            return <RequestEnableTorModal decision={payload.decision} onCancel={onCancel} />;
        case 'disable-tor-stop-coinjoin':
            return <DisableTorStopCoinjoinModal decision={payload.decision} onCancel={onCancel} />;
        case 'tor-loading':
            return <TorLoadingModal decision={payload.decision} onCancel={onCancel} />;
        case 'cancel-coinjoin':
            return <CancelCoinjoinModal onClose={onCancel} />;
        case 'critical-coinjoin-phase':
            return <CriticalCoinjoinPhaseModal relatedAccountKey={payload.relatedAccountKey} />;
        case 'coinjoin-success':
            return <CoinjoinSuccessModal relatedAccountKey={payload.relatedAccountKey} />;
        case 'more-rounds-needed':
            return <MoreRoundsNeededModal />;
        case 'uneco-coinjoin-warning':
            return <UnecoCoinjoinModal />;
        case 'authenticate-device':
            return <AuthenticateDeviceModal />;
        case 'authenticate-device-fail':
            return <AuthenticateDeviceFailModal />;
        case 'stake-eth-in-a-nutshell':
            return <StakeEthInANutshellModal onCancel={onCancel} />;
        case 'stake':
            return <StakeModal onCancel={onCancel} />;
        case 'unstake':
            return <UnstakeModal onCancel={onCancel} />;
        case 'claim':
            return <ClaimModal onCancel={onCancel} />;
        case 'everstake':
            return <EverstakeModal onCancel={onCancel} />;
        case 'copy-address':
            return (
                <CopyAddressModal
                    onCancel={onCancel}
                    address={payload.address}
                    addressType={payload.addressType}
                />
            );
        case 'unhide-token':
            return <UnhideTokenModal onCancel={onCancel} address={payload.address} />;
        case 'passphrase-mismatch-warning':
            return <PassphraseMismatchModal onCancel={onCancel} />;
        default:
            return null;
    }
};
