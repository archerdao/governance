const fs = require('fs')
const { network } = require("hardhat");

function readGrantsFromFile() {
    const file = fs.readFileSync(`./grants/${network.name}.json`, 'utf-8')
    return JSON.parse(file)
}

module.exports.readGrantsFromFile = readGrantsFromFile
