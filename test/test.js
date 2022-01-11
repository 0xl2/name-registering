const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NameRegister contract test", () => {
    let owner, test1, test2;
    let nameRegister;

    before(async () => {
        [owner, test1, test2] = await ethers.getSigners();

        // deploy register contract
        const NameRegister = await ethers.getContractFactory("NameRegister");
        nameRegister = await NameRegister.deploy(tokenAddr);
        await nameRegister.deployed();

        console.log("Contract deployed address is: " + nameRegister.address);
    });

    it("Total test", async() => {
        
    });
});
