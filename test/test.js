const { expect } = require("chai");
const { ethers } = require("hardhat");

const delay = ms => new Promise(res => setTimeout(res, ms));

describe("NameRegister contract test", () => {
    let deployer, test1, test2, test3, test4;
    let nameRegister, testToken;

    before(async () => {
        [deployer, test1, test2, test3, test4] = await ethers.getSigners();

        const TestToken = await ethers.getContractFactory("TestToken");
        testToken = await TestToken.deploy(
            "Test",
            "TST",
            18,
            0
        );
        await testToken.deployed();

        console.log("Test token address is: " + testToken.address);

        // deploy register contract
        const NameRegister = await ethers.getContractFactory("NameRegister");
        nameRegister = await NameRegister.deploy(testToken.address);
        await nameRegister.deployed();

        console.log("Contract deployed address is: " + nameRegister.address);
    });

    it("Total test", async() => {
        // const secInDay = 86400;
        // for testing we set time as 10s
        const secInDay = 10;
        await nameRegister.connect(deployer).setLockTime(secInDay);

        // set lock amount
        const lockAmount = ethers.utils.parseUnits("10", "ether");
        await nameRegister.connect(deployer).setLockAmount(lockAmount);

        // mint token to users
        const mintAmount = ethers.utils.parseUnits("30", "ether");
        await testToken.connect(deployer).mint(test1.address, mintAmount);
        await testToken.connect(deployer).mint(test2.address, mintAmount);
        await testToken.connect(deployer).mint(test3.address, mintAmount);

        // only admin can set the locktime and lockamount
        await expect(
            nameRegister.connect(test1).setLockTime(secInDay)
        ).to.be.revertedWith("Ownable: caller is not the owner");

        // empty name error
        await expect(
            nameRegister.connect(test4).registerName(ethers.utils.formatBytes32String(''))
        ).to.be.revertedWith("Name is empty");

        // need to have token balance to register name
        await expect(
            nameRegister.connect(test4).registerName(ethers.utils.formatBytes32String('apple'))
        ).to.be.revertedWith("Insufficient balance to lock");

        // register name
        testToken.connect(test3).approve(nameRegister.address, lockAmount);
        await nameRegister.connect(test3).registerName(ethers.utils.formatBytes32String('apple'));

        // duplicated name
        await expect(
            nameRegister.connect(test2).registerName(ethers.utils.formatBytes32String("apple"))
        ).to.be.revertedWith("Already registered name");
        
        testToken.connect(test2).approve(nameRegister.address, lockAmount);
        await nameRegister.connect(test2).registerName(ethers.utils.formatBytes32String("pear"));

        await delay(secInDay * 200);

        // renew with wrong name
        await expect(
            nameRegister.connect(test3).renewName(ethers.utils.formatBytes32String("cake"))
        ).to.be.revertedWith("This is not registered name");

        // renew with other user
        await expect(
            nameRegister.connect(test3).renewName(ethers.utils.formatBytes32String("pear"))
        ).to.be.revertedWith("Not owner");


        // renew only apple
        await nameRegister.connect(test3).renewName(ethers.utils.formatBytes32String("apple"))

        await delay(secInDay * 1000);

        // cant register apple as it was renewed
        await expect(
            nameRegister.connect(test1).registerName(ethers.utils.formatBytes32String("apple"))
        ).to.be.revertedWith("Already registered name");

        // register as pear
        testToken.connect(test1).approve(nameRegister.address, lockAmount);
        await nameRegister.connect(test1).registerName(ethers.utils.formatBytes32String("pear"))

        // test2 can claim lockAmount
        await expect(
            nameRegister.connect(test2).withdrawToken(ethers.utils.parseUnits("11", "ether"))
        ).to.be.revertedWith("Insifficient withdrawable amount");
        
        // test2 can withdraw only the lockamount
        await nameRegister.connect(test2).withdrawToken(lockAmount);
    });
});
