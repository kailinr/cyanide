const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const utils = ethers.utils;

describe("------- Standard Token ----------  ", function () {
  let token, deployer;

  before(async () => {
    [deployer, user] = await ethers.getSigners();
  });

  it("should mint token", async () => {
    const Token = await hre.ethers.getContractFactory("StandardToken");
    token = await Token.deploy();
    await token.deployed();
    console.log("Deployed Token to:", token.address);
  });
});

describe("------- BackdoorToken ----------  ", function () {
  let token, deployer, user;
  before(async () => {
    [deployer, user] = await ethers.getSigners();
  });

  it("should mint token", async () => {
    const Token = await hre.ethers.getContractFactory("BackdoorToken");
    token = await Token.deploy();
    await token.deployed();
    console.log("Deployed to:", token.address);
  });
});

describe("------- CyanideToken ----------  ", function () {
  let token, deployer, user;

  before(async () => {
    [deployer, user] = await ethers.getSigners();
  });

  it("should mint token", async () => {
    const Token = await hre.ethers.getContractFactory("CyanideToken");
    token = await Token.deploy();
    await token.deployed();
    console.log("Deployed to:", token.address);
  });
});
