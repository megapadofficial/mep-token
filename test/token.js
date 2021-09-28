const {
  BN,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');
const { expect } = require("chai");
const config = require('../config');

const Web3 = require('web3');
//const web3 = new Web3(new Web3.providers.HttpProvider(process.env.BSC_RPC));
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
const { ethers } = require('hardhat');

const digit = ethers.constants.One.mul(10).pow(18);

const contract = "MegapadToken";
const name = "Megapad";
const symbol = "MEP";
// Lock Time 1 minutes
const lockTime = 60; 

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function deployToken(){
    let [owner] = await ethers.getSigners();
    const Token = await ethers.getContractFactory(contract, owner);
    token = await Token.deploy();
    await token.deployed();
    return token
}

describe("Token", function() {
  let owner;
  let a1, a2;
  let tx, receipt;
  let token;
  before(async function(){
    [owner, a1, a2] = await ethers.getSigners();
    token = await deployToken();
    tx = await token.connect(owner).addPool(owner.address);
    await tx.wait();
    tx = await token.connect(owner).setLockTime(lockTime);
  });

  it("Check Initialized Parameters", async function() {
    expect((await token.name())).to.equal(name);
    expect((await token.symbol())).to.equal(symbol);
    expect((await token.decimals()).toString()).to.equal((18).toString());
    expect((await token.maxSupply()).toString()).to.equal(digit.mul(1e8).toString());
  });

  it("Check initialized owner and supply", async function() {
    expect((await token.balanceOf(owner.address)).toString()).to.equal((await token.maxSupply()).toString());
  });

  describe("Token Slow-Release (TransferWithLock, Claim)", function(){
    let startLockTimestamp;
    let lockAmount;
    let amount;
    before(async function(){
      [owner, a1, a2] = await ethers.getSigners();
      token = await deployToken();
      tx = await token.connect(owner).addPool(owner.address);
      await tx.wait();
      tx = await token.connect(owner).setLockTime(lockTime);
    });

    it("Check TransferLock", async function(){
      lockAmount = digit;
      tx = await token.transferWithLock(a1.address, lockAmount);
      receipt = await tx.wait();
      expectEvent.inLogs(receipt.events, 'Transfer', {from: owner.address, to: a1.address, value: lockAmount});
      startLockTimestamp = (await web3.eth.getBlock(receipt.blockHash)).timestamp;
    });

    it("Check Balance Lock", async function(){
      expect((await token.balanceLockOf(a1.address)).toString()).to.equal(lockAmount.toString());
    })
    
    it("Claim Reward (Partial)", async function(){
      // 10 Seconds
      await sleep(10000);
      tx = await token.connect(a1).claimUnlocked();
      receipt = await tx.wait();
      let ts = (await web3.eth.getBlock(receipt.blockHash)).timestamp;
      amount = lockAmount.mul(ts - startLockTimestamp).div(lockTime);
      // Get Wallet
      expect((await token.balanceOf(a1.address)).toString()).to.equal(amount.toString());
      // Should reset time and amount
      startLockTimestamp = ts;
      lockAmount = lockAmount.sub(amount);
    });

    it("Claim Reward (Partial) 2nd time (Should reaveraging)", async function(){
      // 10 Seconds
      await sleep(10000);
      tx = await token.connect(a1).claimUnlocked();
      receipt = await tx.wait();
      let ts = (await web3.eth.getBlock(receipt.blockHash)).timestamp;
      amount = amount.add(lockAmount.mul(ts - startLockTimestamp).div(lockTime));
      // Get Wallet
      expect((await token.balanceOf(a1.address)).toString()).to.equal(amount.toString());
      // Should reset time and amount
      startLockTimestamp = ts;
      lockAmount = lockAmount.sub(amount);
    });

    it("Claim remaining", async function(){
      await sleep(lockTime * 1000);
      tx = await token.connect(a1).claimUnlocked();
      receipt = await tx.wait();
      expect((await token.balanceOf(a1.address)).toString()).to.equal(digit.toString());
      expect((await token.balanceLockOf(a1.address)).toString()).to.equal((0).toString());
    });

  });

  describe("Token Slow-Release Multiple transfer", function(){
    let startLockTimestamp;
    let lockAmount;
    let amount;

    before(async function(){
      [owner, a1, a2] = await ethers.getSigners();
      token = await deployToken();
      tx = await token.connect(owner).addPool(owner.address);
      await tx.wait();
      tx = await token.connect(owner).setLockTime(lockTime);
    });

    it("Check TransferLock", async function(){
      lockAmount = digit;
      tx = await token.transferWithLock(a1.address, lockAmount);
      receipt = await tx.wait();
      expectEvent.inLogs(receipt.events, 'Transfer', {from: owner.address, to: a1.address, value: lockAmount});
      startLockTimestamp = (await web3.eth.getBlock(receipt.blockHash)).timestamp;
    });

    it("Check BalanceLock 1", async function(){
      expect((await token.balanceLockOf(a1.address)).toString()).to.equal(lockAmount.toString());
    })

    /**
     * Will claim and reaverage old+new to lockTime
     */
    it("Transfer again, Check claim amount", async function(){
      await sleep(10000);
      tx = await token.transferWithLock(a1.address, digit);
      receipt = await tx.wait();
      expectEvent.inLogs(receipt.events, 'Transfer', {from: owner.address, to: a1.address, value: digit});
      let ts = (await web3.eth.getBlock(receipt.blockHash)).timestamp;
      let amount = lockAmount.mul(ts - startLockTimestamp).div(lockTime);
      expect((await token.balanceOf(a1.address)).toString()).to.equal(amount.toString());
      startLockTimestamp = ts;
      lockAmount = lockAmount.add(digit).sub(amount);
    });

    it("Check BalanceLock 2", async function(){
      expect((await token.balanceLockOf(a1.address)).toString()).to.equal(lockAmount.toString());
    });

  });
});
