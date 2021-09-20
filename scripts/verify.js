const config = require('../config');
const hre = require("hardhat");

const name = "MoonMakerProtocolV2";
async function main(){
    await hre.run('verify:verify', {
        contract: `contracts/${name}.sol:${name}`,
        address: config.contract.token
    });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });