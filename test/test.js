const { expect } = require("chai");
const config = require('../config');

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.BSC_RPC));
const { ethers } = require('hardhat');

const digit = ethers.constants.One.mul(10).pow(18);

const name = "MoonMakerProtocolV2";
const symbol = "MMPv2";
const lockTime = 30 * 24 * 60 * 60; 

describe("Token", function() {
  let deployer;
  let token;
  before(async function(){
    [deployer] = await ethers.getSigners();
    const Token = await ethers.getContractFactory(name, deployer);
    token = await Token.deploy();
    await token.deployed();
    console.log(`Test Token: ${token.address}`);
  });

  it("Check Initialized Parameters", async function() {
    expect((await token.name())).to.equal(name);
    expect((await token.symbol())).to.equal(symbol);
    expect((await token.decimals()).toString()).to.equal((18).toString());
    expect((await token.maxSupply()).toString()).to.equal(digit.mul(1e8).toString());
  });

  it("Check initialized owner and supply", async function() {
    expect((await token.balanceOf(deployer.address)).toString()).to.equal((await token.maxSupply()).toString());
  });

  // TODO: WIP Create testcase for slow-release features
  describe("Slow Release Features", function(){
    it("Check Initialize lockTime", async function(){
      expect((await token.lockTime()).toString()).to.equal(lockTime.toString());
    })
    it("Check change lockTime", async function(){
      const oldLockTime = await token.lockTime();
      // to 5 Minutes
      const newLockTime = 5 * 60;
      await token.setLockTime(newLockTime);
      expect((await token.lockTime()).toString()).to.equal(newLockTime.toString());
      // Reset lockTime to oldLockTime
      await token.setLockTime(oldLockTime);
    })
    it("Test Slow Release", async function(){
      const oldLockTime = await token.lockTime();
      const transferAmount = digit.mul(1e6)
      // to 5 Minutes
      const newLockTime = 5 * 60;
      await token.setLockTime(newLockTime);
      await token.connect(deployer).transferWithLock(deployer, transferAmount);

      await token.


      // Reset lockTime to oldLockTime
      await token.setLockTime(oldLockTime);
    });
  })

});
