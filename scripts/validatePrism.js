const { ethers } = require("hardhat");
const { noSelectorClashes } = require("./utils/prism");

async function validatePrism() {
    let votingPowerPrism = await ethers.getContractFactory("VotingPowerPrism");
    let votingPowerImplementation = await ethers.getContractFactory("VotingPower");

    return noSelectorClashes(votingPowerPrism, votingPowerImplementation)
}

if (require.main === module) {
  validatePrism()
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
}

module.exports.validatePrism = validatePrism