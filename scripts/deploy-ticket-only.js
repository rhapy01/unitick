const { ethers } = require("hardhat");

async function main() {
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // Use existing UniTick token contract address
  const existingUniTickTokenAddress = "0xA3f4990edBc6aB2c6bafe5DAd9fB4ff1C48f17e7";
  console.log("Using existing UniTick token contract:", existingUniTickTokenAddress);

  console.log("\nDeploying UniTick ticket contract...");

  // Get the contract factory for the ticket contract only
  const UniTickContract = await ethers.getContractFactory("contracts/UniTick2.sol:UniTick");

  // Platform wallet address (use deployer address for testing)
  const platformWallet = process.env.PLATFORM_WALLET_ADDRESS || deployer.address;

  // Deploy the ticket contract with existing UniTick token address
  const uniTickContract = await UniTickContract.deploy(platformWallet, existingUniTickTokenAddress);
  await uniTickContract.waitForDeployment();

  console.log("UniTick ticket contract deployed to:", await uniTickContract.getAddress());
  console.log("Platform wallet:", platformWallet);

  // Retry helper
  async function retry(label, fn, attempts = 10, delayMs = 1500) {
    let lastErr
    for (let i = 1; i <= attempts; i++) {
      try {
        const res = await fn()
        console.log(`${label} OK on attempt ${i}`)
        return res
      } catch (e) {
        lastErr = e
        console.log(`${label} failed on attempt ${i}/${attempts}:`, e?.shortMessage || e?.message || e)
        await new Promise(r => setTimeout(r, delayMs))
      }
    }
    throw lastErr
  }

  // Verify deployment with retries (RPC can be eventually consistent)
  const platformFee = await retry('Read platformFeeBps', () => uniTickContract.platformFeeBps())
  const platformWalletFromContract = await retry('Read platformWallet', () => uniTickContract.platformWallet())

  console.log("Platform fee:", platformFee.toString(), "basis points (0.5%)");
  console.log("Platform wallet from contract:", platformWalletFromContract);

  // Verify whitelist initialization
  const isPlatformWhitelisted = await retry('Check platform whitelisted', () => uniTickContract.isVendorWhitelisted(platformWallet))
  console.log("Platform wallet whitelisted:", isPlatformWhitelisted);

  const whitelistCount = await retry('Read whitelist count', () => uniTickContract.getWhitelistedVendorsCount())
  console.log("Total whitelisted vendors:", whitelistCount.toString());

  // Save deployment info
  const deploymentInfo = {
    uniTickTokenAddress: existingUniTickTokenAddress, // Keep existing token
    ticketContractAddress: await uniTickContract.getAddress(),
    platformWallet: platformWallet,
    platformFee: platformFee.toString(),
    network: network.name,
    deployedAt: new Date().toISOString()
  };

  console.log("Deployment info:", JSON.stringify(deploymentInfo, null, 2));

  // Update only the ticket contract address in lib/addresses.ts
  try {
    const fs = require('fs')
    const path = require('path')
    const addressesPath = path.join(__dirname, '..', 'lib', 'addresses.ts')
    if (fs.existsSync(addressesPath)) {
      let content = fs.readFileSync(addressesPath, 'utf8')
      // Only update the ticket contract address, keep existing token address
      content = content.replace(
        /UNILABOOK:\s*process\.env\.NEXT_PUBLIC_TICKET_CONTRACT_ADDRESS\s*\|\|\s*"0x[0-9a-fA-F]{40}"/,
        `UNILABOOK: process.env.NEXT_PUBLIC_TICKET_CONTRACT_ADDRESS || "${await uniTickContract.getAddress()}"`
      )
      content = content.replace(
        /UNILABOOK:\s*"0x[0-9a-fA-F]{40}"/,
        `UNILABOOK: "${await uniTickContract.getAddress()}"`
      )
      fs.writeFileSync(addressesPath, content, 'utf8')
      console.log('Updated ticket contract address in lib/addresses.ts')
    }

    // Also update constants.ts defaults
    const constantsPath = path.join(__dirname, '..', 'lib', 'constants.ts')
    if (fs.existsSync(constantsPath)) {
      let constantsContent = fs.readFileSync(constantsPath, 'utf8')
      constantsContent = constantsContent.replace(
        /DEFAULT_TICKET_CONTRACT_ADDRESS\s*=\s*"0x[0-9a-fA-F]{40}"/,
        `DEFAULT_TICKET_CONTRACT_ADDRESS = "${await uniTickContract.getAddress()}"`
      )
      fs.writeFileSync(constantsPath, constantsContent, 'utf8')
      console.log('Updated default ticket contract address in lib/constants.ts')
    }
  } catch (e) {
    console.warn('Could not update addresses automatically:', e.message)
  }

  // Instructions for next steps
  console.log("\n=== Next Steps ===");
  console.log("1. (Optional) Update your .env file if you prefer env-config:");
  console.log(`   NEXT_PUBLIC_TICKET_CONTRACT_ADDRESS=${await uniTickContract.getAddress()}`);
  console.log(`   PLATFORM_WALLET_ADDRESS=${platformWallet}`);
  console.log("2. Verify the contract on Etherscan");
  console.log("3. Test free ticket functionality");
  console.log("\n✅ Only ticket contract deployed - using existing UniTick token!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
