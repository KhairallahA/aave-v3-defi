const networkConfig = {
    // Sepolia network
    11155111: {
        name: "sepolia",
        // This is the AaveV3 Pool Addresses Provider
        poolAddressesProvider: "0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A",
        // This is DAI/USD feed
        daiUsdPriceFeed: "0x14866185B1962B63C3Ea9E03Bc1da838bab34C19",
        // This is the DAI token
        daiToken: "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357",
        // aave token
        aaveToken: "0x88541670E55cC00bEEFD87eB59EDd1b7C511AC9a",
    },
}

const developmentChains = ["hardhat", "localhost"]

module.exports = {
    networkConfig,
    developmentChains
}