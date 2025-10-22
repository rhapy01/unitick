/*
  Usage:
    npx hardhat run scripts/whitelist_vendor.js --network baseSepolia --address 0xYourVendorAddress --contract 0xYourUnilaBookAddress

  Notes:
  - Requires PRIVATE_KEYS in .env (hex without 0x or a standard private key prefixed with 0x, depending on your setup).
  - If --contract is omitted, falls back to NEXT_PUBLIC_TICKET_CONTRACT_ADDRESS, then to default from codebase.
*/

const hre = require("hardhat")
const path = require("path")
const fs = require("fs")

async function main() {
  const vendorAddress = (process.env.VENDOR_ADDRESS || "").trim()
  let contractAddress = (process.env.CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_TICKET_CONTRACT_ADDRESS || "0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08").trim()

  if (!vendorAddress || !/^0x[a-fA-F0-9]{40}$/.test(vendorAddress)) {
    throw new Error("Please set VENDOR_ADDRESS=0x... in environment or .env")
  }

  // Load ABI from artifacts
  const artifactPath = path.resolve(__dirname, "../artifacts/contracts/UnilaBook.sol/UnilaBook.json")
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact not found at ${artifactPath}. Run a build first.`)
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"))

  // Default contract fallback from codebase addresses.ts (kept in sync manually)
  if (!contractAddress) {
    contractAddress = "0xcB0c644F4A040F0a2026043fA57121ac6Cac8f08"
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
    throw new Error("Please provide a valid --contract 0x... UnilaBook contract address or set NEXT_PUBLIC_TICKET_CONTRACT_ADDRESS")
  }

  const [signer] = await hre.ethers.getSigners()
  const network = await hre.ethers.provider.getNetwork()

  console.log("Network:", network.name, network.chainId)
  console.log("Signer:", await signer.getAddress())
  console.log("Contract:", contractAddress)
  console.log("Vendor to whitelist:", vendorAddress)

  const contract = new hre.ethers.Contract(contractAddress, artifact.abi, signer)

  // Check current status
  const isAlready = await contract.whitelistedVendors(vendorAddress)
  if (isAlready) {
    console.log("Vendor is already whitelisted.")
    return
  }

  const tx = await contract.addVendorToWhitelist(vendorAddress)
  console.log("Tx sent:", tx.hash)
  const receipt = await tx.wait()
  console.log("Confirmed in block:", receipt.blockNumber)

  const nowWhitelisted = await contract.whitelistedVendors(vendorAddress)
  console.log("Whitelisted:", nowWhitelisted)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})


