require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("@nomiclabs/hardhat-web3");
const config = require('./config.js')

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    gasReporter: {
        enabled: true,
        currency: 'BNB',
        gasPrice: 21
    },
    networks: {
        testnet: {
            url: "https://data-seed-prebsc-1-s1.binance.org:8545",
            chainId: 97,
            gasPrice: "auto",
            blockGasLimit: "auto",
            accounts: [config.privateKey.owner]
        },
        bsc: {
            url: "https://bsc-dataseed1.binance.org",
            chainId: 56,
            gasPrice: "auto",
            blockGasLimit: "auto",
            accounts: [config.privateKey.owner]
        },
        hardhat: {
            mining: {
                auto: false,
                interval: 5000
            },
            blockGasLimit: 13000000,
            gasPrice: 20
        },
    },
    namedAccounts: {
        deployer: 0,
    },
    etherscan: {
        apiKey: config.bscAPIKEY
    },
    solidity: {
        compilers: [{
            version: "0.8.6",
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200
                }
            }
        }]
    },
    mocha: {
        timeout: 500000
    }
};
