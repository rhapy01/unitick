const { ethers } = require("hardhat");

async function main() {
  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  console.log("Deploying updated UniTick contract with gift functionality...");

  // Get the contract factory
  const UniTickContract = await ethers.getContractFactory("contracts/UniTick2.sol:UniTick");

  // Platform wallet address (use deployer address for testing)
  const platformWallet = process.env.PLATFORM_WALLET_ADDRESS || deployer.address;

  // Use existing UniTick token address
  const unitickTokenAddress = process.env.NEXT_PUBLIC_UNITICK_CONTRACT_ADDRESS || "0xA3f4990edBc6aB2c6bafe5DAd9fB4ff1C48f17e7";

  console.log("Using UniTick token address:", unitickTokenAddress);
  console.log("Using platform wallet:", platformWallet);

  // Deploy the updated contract with gift functionality
  const uniTickContract = await UniTickContract.deploy(platformWallet, unitickTokenAddress);
  await uniTickContract.waitForDeployment();

  console.log("Updated UniTick contract deployed to:", await uniTickContract.getAddress());

  // Verify deployment with retries (RPC can be eventually consistent)
  const retry = async (label, fn, attempts = 10, delayMs = 1500) => {
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

  // Verify deployment
  const platformFee = await retry('Read platformFeeBps', () => uniTickContract.platformFeeBps())
  const platformWalletFromContract = await retry('Read platformWallet', () => uniTickContract.platformWallet())

  console.log("Platform fee:", platformFee.toString(), "basis points (0.5%)");
  console.log("Platform wallet from contract:", platformWalletFromContract);

  // Verify whitelist initialization
  const isPlatformWhitelisted = await retry('Check platform whitelisted', () => uniTickContract.isVendorWhitelisted(platformWallet))
  console.log("Platform wallet whitelisted:", isPlatformWhitelisted);

  const whitelistCount = await retry('Read whitelist count', () => uniTickContract.getWhitelistedVendorsCount())
  console.log("Total whitelisted vendors:", whitelistCount.toString());

  // Test the new gift function exists
  try {
    console.log("Testing gift function availability...");
    // This will fail but we just want to check if the function exists
    await uniTickContract.createOrderForGift.staticCall(
      "0x0000000000000000000000000000000000000000", // invalid recipient
      [], // empty vendor payments
      [], // empty service names
      [], // empty booking dates
      "test" // metadata
    );
  } catch (error) {
    if (error.message.includes("Invalid recipient address")) {
      console.log("✅ Gift function is available and working correctly");
    } else {
      console.log("⚠️ Gift function test failed:", error.message);
    }
  }

  // Save deployment info
  const deploymentInfo = {
    uniTickAddress: unitickTokenAddress,
    ticketContractAddress: await uniTickContract.getAddress(),
    platformWallet: platformWallet,
    platformFee: platformFee.toString(),
    network: network.name,
    deployedAt: new Date().toISOString(),
    hasGiftFunctionality: true
  };

  console.log("Deployment info:", JSON.stringify(deploymentInfo, null, 2));

  // Update addresses file
  try {
    const fs = require('fs')
    const path = require('path')
    const addressesPath = path.join(__dirname, '..', 'lib', 'addresses.ts')
    if (fs.existsSync(addressesPath)) {
      let content = fs.readFileSync(addressesPath, 'utf8')
      content = content.replace(
        /UNILABOOK:\s*"0x[0-9a-fA-F]{40}"/,
        `UNILABOOK: "${await uniTickContract.getAddress()}"`
      )
      fs.writeFileSync(addressesPath, content, 'utf8')
      console.log('✅ Updated contract addresses in lib/addresses.ts')
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
      console.log('✅ Updated default addresses in lib/constants.ts')
    }
  } catch (e) {
    console.warn('Could not update addresses automatically:', e.message)
  }

  // Instructions for next steps
  console.log("\n=== Next Steps ===");
  console.log("1. Update your .env file with the new contract address:");
  console.log(`   NEXT_PUBLIC_TICKET_CONTRACT_ADDRESS=${await uniTickContract.getAddress()}`);
  console.log("2. Verify the contract on Etherscan (if on mainnet/testnet)");
  console.log("3. Test the gift functionality:");
  console.log("   - Create a gift order");
  console.log("   - Verify NFTs are minted to recipient's wallet");
  console.log("   - Test gift claiming process");
  console.log("4. Update any existing vendor whitelist if needed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
