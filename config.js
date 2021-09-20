// require('dotenv').config();
const env = process.env.PROFILE || 'development';
if(env == 'production'){
    require('dotenv').config({path: '.env.prod'});
}
else{
    require('dotenv').config();
}

const { BigNumber } = require('bignumber.js')
const digit = new BigNumber(1e18)

module.exports = {
    bscAPIKEY: process.env.BSC_KEY,
    bsc_rpc: process.env.BSC_RPC,
    chainId: process.env.CHAIN_ID,
    privateKey: {
        owner: process.env.OWNER_PRIVATE_KEY,
    },
    address: {
        owner: process.env.OWNER_ADDRESS,
    },
    contract: {
        token: process.env.TOKEN_ADDRESS
    }
}