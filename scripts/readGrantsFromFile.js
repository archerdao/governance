const fs = require('fs')
const { network } = require("hardhat");

function readGrantsFromFile() {
    return JSON.parse(fs.readFileSync(`./grants/${network.name}.json`, 'utf-8'))
}

module.exports.readGrantsFromFile = readGrantsFromFile
