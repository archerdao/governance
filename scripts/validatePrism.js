const hre = require("hardhat");
const { noSelectorClashes } = require("./utils/prism");

async function validate() {
    let votingPowerPrism = await hre.ethers.getContractFactory("VotingPowerPrism");
    let votingPowerImplementation = await hre.ethers.getContractFactory("VotingPower");

    return noSelectorClashes(votingPowerPrism, votingPowerImplementation)
}

validate()
  .then((valid) => {
      if(valid) {
        console.log("No issues detected")
      }      
      process.exit(0)
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });