const multisig = process.env.MULTISIG_ADDRESS;
const d = new Date();
const currentTimestamp = d.getTime() / 1000;
const oneYearInSecs = 365 * 24 * 60 * 60;
const nextMintAllowed = currentTimestamp + oneYearInSecs;

const ArchToken = artifacts.require("./ArchToken.sol");
const Vesting = artifacts.require("./Vesting.sol");
const VotingPower = artifacts.require("./VotingPower.sol");


module.exports = function (deployer) {
  deployer.deploy(ArchToken, multisig, multisig, multisig, nextMintAllowed, {
    gas: 8000000
  }).then(function () {
    return deployer.deploy(Vesting, ArchToken.address, {
      gas: 8000000
    }).then(function () {
      return deployer.deploy(VotingPower, ArchToken.address, Vesting.address, {
        gas: 8000000
      }).then(function () {
        return Vesting.setVotingPowerContract(VotingPower.address).then(function () {
          return Vesting.changeOwner(multisig);
        });
      });
    });
  });
};