export const fixtures = {
    valid: [
        {
            dec: 0,
            hex64: '0000000000000000',
            hexVI: '00',
            hexPD: '00',
        },
        {
            dec: 1,
            hex64: '0100000000000000',
            hexVI: '01',
            hexPD: '01',
        },
        {
            dec: 252,
            hex64: 'fc00000000000000',
            hexVI: 'fc',
            hexPD: '4cfc',
        },
        {
            dec: 253,
            hex64: 'fd00000000000000',
            hexVI: 'fdfd00',
            hexPD: '4cfd',
        },
        {
            dec: 254,
            hex64: 'fe00000000000000',
            hexVI: 'fdfe00',
            hexPD: '4cfe',
        },
        {
            dec: 255,
            hex64: 'ff00000000000000',
            hexVI: 'fdff00',
            hexPD: '4cff',
        },
        {
            dec: 65534,
            hex64: 'feff000000000000',
            hexVI: 'fdfeff',
            hexPD: '4dfeff',
        },
        {
            dec: 65535,
            hex64: 'ffff000000000000',
            hexVI: 'fdffff',
            hexPD: '4dffff',
        },
        {
            dec: 65536,
            hex64: '0000010000000000',
            hexVI: 'fe00000100',
            hexPD: '4e00000100',
        },
        {
            dec: 65537,
            hex64: '0100010000000000',
            hexVI: 'fe01000100',
            hexPD: '4e01000100',
        },
        {
            dec: 4294967295,
            hex64: 'ffffffff00000000',
            hexVI: 'feffffffff',
            hexPD: '4effffffff',
        },
        {
            dec: 4294967296,
            hex64: '0000000001000000',
            hexVI: 'ff0000000001000000',
        },
        {
            dec: 4294967297,
            hex64: '0100000001000000',
            hexVI: 'ff0100000001000000',
        },
        {
            dec: 9007199254740991,
            hex64: 'ffffffffffff1f00',
            hexVI: 'ffffffffffffff1f00',
        },
    ],
    invalid: {
        readUInt64LE: [
            {
                description: 'n === 2^53',
                exception: 'value out of range',
                hex64: '0000000000002000',
                hexVI: 'ff0000000000000020',
                dec: 9007199254740992,
            },
            {
                description: 'n > 2^53',
                exception: 'value out of range',
                hex64: '0100000000002000',
                hexVI: 'ff0100000000000020',
                // eslint-disable-next-line no-loss-of-precision
                dec: 9007199254740993,
            },
        ],
        readPushDataInt: [
            {
                description: 'OP_PUSHDATA1, no size',
                hexPD: '4c',
            },
            {
                description: 'OP_PUSHDATA2, no size',
                hexPD: '4d',
            },
            {
                description: 'OP_PUSHDATA4, no size',
                hexPD: '4e',
            },
        ],
    },
    negative: [
        {
            dec: -1,
            hex64: 'FFFFFFFFFFFFFFFF',
        },
        {
            dec: -255,
            hex64: '01FFFFFFFFFFFFFF',
        },
        {
            dec: -9223372036854775808,
            hex64: '0000000000000080',
        },
    ],
};
