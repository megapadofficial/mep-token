const config = require('../config');
const { ethers } = require('hardhat');

const name = "MoonMakerProtocolV2";
async function main() {
    let data = [];
    const [deployer] = await ethers.getSigners();
    const Instance = await ethers.getContractFactory(name, deployer);
    let instance = await Instance.deploy();
    await instance.deployed();
    data.push({'Label': name, 'Address': instance.address});
    console.table(data);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
