// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/EthereumSignTransaction.js

import { FeeMarketEIP1559TxData, LegacyTxData } from '@ethereumjs/tx';

import { MessagesSchema } from '@trezor/protobuf';
import { Assert } from '@trezor/schema-utils';

import { AbstractMethod } from '../../../core/AbstractMethod';
import { getFirmwareRange } from '../../common/paramsValidator';
import { getSlip44ByPath, validatePath } from '../../../utils/pathUtils';
import { getEthereumNetwork } from '../../../data/coinInfo';
import { getNetworkLabel } from '../../../utils/ethereumUtils';
import { deepTransform, stripHexPrefix } from '../../../utils/formatUtils';
import * as helper from '../ethereumSignTx';
import {
    getEthereumDefinitions,
    decodeEthereumDefinition,
    ethereumNetworkInfoFromDefinition,
} from '../ethereumDefinitions';
import type { EthereumTransaction, EthereumTransactionEIP1559 } from '../../../types/api/ethereum';
import {
    EthereumNetworkInfo,
    EthereumSignTransaction as EthereumSignTransactionSchema,
} from '../../../types';

type Params = {
    path: number[];
    network?: EthereumNetworkInfo;
    definitions?: MessagesSchema.EthereumDefinitions;
    chunkify: boolean;
} & (
    | {
          type: 'legacy';
          tx: EthereumTransaction;
      }
    | {
          type: 'eip1559';
          tx: EthereumTransactionEIP1559;
      }
);

const strip = deepTransform(value => {
    let stripped = stripHexPrefix(value);
    // pad left even
    if (stripped.length % 2 !== 0) {
        stripped = `0${stripped}`;
    }

    return stripped;
});

export default class EthereumSignTransaction extends AbstractMethod<
    'ethereumSignTransaction',
    Params
> {
    init() {
        this.requiredPermissions = ['read', 'write'];
        this.requiredDeviceCapabilities = ['Capability_Ethereum'];

        const { payload } = this;
        // validate incoming parameters
        Assert(EthereumSignTransactionSchema, payload);

        const path = validatePath(payload.path, 3);
        const network = getEthereumNetwork(path);
        const chunkify = typeof payload.chunkify === 'boolean' ? payload.chunkify : false;

        // incoming transaction should be in EthereumTx format
        // https://github.com/ethereumjs/ethereumjs-tx
        const tx = payload.transaction;
        const isEIP1559 =
            typeof tx.maxFeePerGas === 'string' && typeof tx.maxPriorityFeePerGas === 'string';

        // get firmware range depending on used transaction type
        // eip1559 is possible since 2.4.2
        this.firmwareRange = getFirmwareRange(
            isEIP1559 ? 'eip1559' : this.name,
            network,
            this.firmwareRange,
        );

        if (isEIP1559) {
            this.params = { path, network, type: 'eip1559', tx: strip(tx), chunkify };
        } else {
            this.params = { path, network, type: 'legacy', tx: strip(tx), chunkify };
        }

        // Since FW 2.4.3+ chainId will be required
        // TODO: this should be removed after next major/minor version (or after few months)
        // TODO: add "required: true" to chainId validation
        if (typeof tx.chainId !== 'number') {
            console.warn('TrezorConnect.ethereumSignTransaction: Missing chainId parameter!');
        }
    }

    async initAsync(): Promise<void> {
        // eth && token => yes
        // evm && token => yes
        // eth && !token => no
        // evm && !token => yes
        if (this.params.tx.chainId === 1 && !this.params.tx.data) {
            return;
        }
        const slip44 = getSlip44ByPath(this.params.path);
        const definitions = await getEthereumDefinitions({
            chainId: this.params.tx.chainId,
            slip44,
            contractAddress: this.params.tx.data ? this.params.tx.to : undefined,
        });
        this.params.definitions = definitions;

        const decoded = decodeEthereumDefinition(definitions);
        if (decoded.network) {
            this.params.network = ethereumNetworkInfoFromDefinition(decoded.network);
        }
    }

    get info() {
        return getNetworkLabel('Sign #NETWORK transaction', this.params.network);
    }

    async run() {
        const { type, tx, definitions, chunkify } = this.params;

        const isLegacy = type === 'legacy';

        const signature = isLegacy
            ? await helper.ethereumSignTx(
                  this.device.getCommands().typedCall.bind(this.device.getCommands()),
                  this.params.path,
                  tx.to,
                  tx.value,
                  tx.gasLimit,
                  tx.gasPrice,
                  tx.nonce,
                  tx.chainId,
                  chunkify,
                  tx.data,
                  tx.txType,
                  definitions,
              )
            : await helper.ethereumSignTxEIP1559(
                  this.device.getCommands().typedCall.bind(this.device.getCommands()),
                  this.params.path,
                  tx.to,
                  tx.value,
                  tx.gasLimit,
                  tx.maxFeePerGas,
                  tx.maxPriorityFeePerGas,
                  tx.nonce,
                  tx.chainId,
                  chunkify,
                  tx.data,
                  tx.accessList,
                  definitions,
              );

        const txData = {
            ...tx,
            ...signature,
            type: isLegacy ? 0 : 2, // 0 for legacy, 2 for EIP-1559
            gasPrice: isLegacy ? tx.gasPrice : null,
            maxFeePerGas: isLegacy ? tx.maxFeePerGas : tx.maxPriorityFeePerGas,
            maxPriorityFeePerGas: !isLegacy ? tx.maxPriorityFeePerGas : undefined,
        } as LegacyTxData | FeeMarketEIP1559TxData;

        const serializedTx = helper.serializeEthereumTx(txData, tx.chainId);

        return { ...signature, serializedTx };
    }
}
