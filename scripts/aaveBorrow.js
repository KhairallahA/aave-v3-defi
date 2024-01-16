const { ethers, network } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")

const BORROW_MODE = 2 // Variable borrow mode. Stable was disabled. 
const AMOUNT_SUPPLY = ethers.utils.parseEther("20")

async function main() {
  const [ deployer ] = await ethers.getSigners()
  const pool = await getPool(deployer)
  const aaveTokenAddress = networkConfig[network.config.chainId].aaveToken
  console.log(`Suppling AAVE...`)
  await supply(AMOUNT_SUPPLY, aaveTokenAddress, deployer, pool)
  // Getting your borrowing stats
  const { availableBorrowsBase, totalDebtBase } = await getBorrowUserData(pool, deployer)
  const daiPrice = await getDaiPrice()
  const amountDaiToBorrow = availableBorrowsBase * 0.99 * (1/daiPrice)
  const amountDaiToBorrowWei = ethers.utils.parseEther(amountDaiToBorrow.toString())
  console.log(`You can borrow ${amountDaiToBorrow.toString()} DAI`)
  console.log("BORROWING!")
  await borrowDai(
    networkConfig[network.config.chainId].daiToken,
    pool,
    amountDaiToBorrowWei,
    deployer
  )
  await getBorrowUserData(pool, deployer)
  console.log("REPAING!")
  await repay(
    amountDaiToBorrowWei,
    networkConfig[network.config.chainId].daiToken,
    pool,
    deployer
  )
  await getBorrowUserData(pool, deployer)
}

async function supply(amount, tokenAddress, account, pool) {
  await approveERC20(tokenAddress, pool.address, amount, account)
  const supplyTx = await pool.supply(tokenAddress, amount, account.address, 0)
  await supplyTx.wait(1)
  console.log("Supplied!")
}

async function repay(amount, daiAddress, pool, account) {
  await approveERC20(daiAddress, pool.address, amount, account)
  const repayTx = await pool.repay(daiAddress, amount, BORROW_MODE, account.address)
  await repayTx.wait(1)
  console.log("Repaid!")
}

async function borrowDai(daiAddress, pool, amountDaiToBorrow, account) {
  const borrowTx = await pool.borrow(daiAddress, amountDaiToBorrow, BORROW_MODE, 0, account.address)
  await borrowTx.wait(1)
  console.log("You've borrowed!")
}

async function getDaiPrice() {
  const daiEthPriceFeed = await ethers.getContractAt(
    "AggregatorV3Interface",
    networkConfig[network.config.chainId].daiUsdPriceFeed
  )
  const price = (await daiEthPriceFeed.latestRoundData())[1]
  console.log(`The DAI/ETH price is ${price.toString()}`)
  return price
}

async function approveERC20(erc20Address, spenderAddress, amount, signer) {
  const erc20Token = await ethers.getContractAt(
    "IERC20",
    erc20Address,
    signer
  )
  const txResponse = await erc20Token.approve(spenderAddress, amount)
  await txResponse.wait(1)
  console.log("Approval!")
}

async function getPool(account) {
  const poolAddressesProvider = await ethers.getContractAt(
    "IPoolAddressesProvider",
    networkConfig[network.config.chainId].poolAddressesProvider,
    account
  )
  const poolAddress = await poolAddressesProvider.getPool()
  const pool = await ethers.getContractAt(
    "IPool",
    poolAddress,
    account
  )
  return pool
}

async function getBorrowUserData(pool, account) {
  const {
    totalCollateralBase,
    totalDebtBase,
    availableBorrowsBase
  } = await pool.getUserAccountData(account.address)
  console.log(`You have ${totalCollateralBase} worth of ETH deposited.`)
  console.log(`You have ${totalDebtBase} worth of ETH borrowed.`)
  console.log(`You can borrow ${availableBorrowsBase} worth of ETH.`)
  return { availableBorrowsBase, totalDebtBase }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })