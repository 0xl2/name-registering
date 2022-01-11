const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    const tokenAddr = "your_token_address_here";

    // deploy register contract
    const NameRegister = await ethers.getContractFactory("NameRegister");
    const nameRegister = await NameRegister.deploy(tokenAddr);
    await nameRegister.deployed();

    console.log("Contract address is: " + nameRegister.address);

    // set lock time as 1 day
    const secInDay = 86400;
    await nameRegister.connect(deployer).setLockTime(secInDay);

    // set lock amount
    const lockAmount = ethers.utils.parseUnits("10", "ether");
    await nameRegister.setLockAmount(deployer).setLockTime(lockAmount);
}

main()
.then(() => process.exit())
.catch((error) => {
    console.error(error);
    process.exit(1);
});
