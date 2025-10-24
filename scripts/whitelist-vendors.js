// Whitelist Vendor Addresses Script
// This script whitelists the 3 vendor addresses for testing multiple payments

const { ethers } = require("hardhat");

async function main() {
    // The vendor addresses that need to be whitelisted
    const vendorAddresses = [
        "0x34e256A05c2cf2c72C44864648740b60D4A2666C",
        "0x5713f4236938865A29Bd9477D85C43Af083E297A", 
        "0xbbc92de321b5b828dcd5d46631f748de083d9862",
        "0x43606235E11641EFa7a45190aFB9e4cf9b0146eE"
    ];

    // Get the contract addresses from your deployment
    // Using the new UniTick contract address
    const UNILABOOK_CONTRACT_ADDRESS = "0xc4e90Dcd9Da001Dc463570d66d8281821De58D5C";
    
    console.log("🚀 Starting vendor whitelisting process...");
    console.log("📋 Vendor addresses to whitelist:");
    vendorAddresses.forEach((addr, index) => {
        console.log(`   ${index + 1}. ${addr}`);
    });

    // Get the contract instance
    const UniTick = await ethers.getContractFactory("contracts/UniTick2.sol:UniTick");
    const uniTick = UniTick.attach(UNILABOOK_CONTRACT_ADDRESS);

    // Get the owner (deployer) account
    const [owner] = await ethers.getSigners();
    console.log(`\n👤 Using account: ${owner.address}`);

    try {
        // Check current whitelist status
        console.log("\n🔍 Checking current whitelist status...");
        for (let i = 0; i < vendorAddresses.length; i++) {
            const isWhitelisted = await uniTick.isVendorWhitelisted(vendorAddresses[i]);
            console.log(`   ${vendorAddresses[i]}: ${isWhitelisted ? '✅ Already whitelisted' : '❌ Not whitelisted'}`);
        }

        // Batch whitelist all vendors at once (more gas efficient)
        console.log("\n⚡ Batch whitelisting vendors...");
        const tx = await uniTick.batchAddVendorsToWhitelist(vendorAddresses);
        console.log(`📝 Transaction hash: ${tx.hash}`);
        
        console.log("⏳ Waiting for transaction confirmation...");
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
        console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);

        // Verify whitelist status after transaction
        console.log("\n🔍 Verifying whitelist status after transaction...");
        for (let i = 0; i < vendorAddresses.length; i++) {
            const isWhitelisted = await uniTick.isVendorWhitelisted(vendorAddresses[i]);
            console.log(`   ${vendorAddresses[i]}: ${isWhitelisted ? '✅ Whitelisted' : '❌ Not whitelisted'}`);
        }

        // Get total whitelisted count
        const totalWhitelisted = await uniTick.getWhitelistedVendorsCount();
        console.log(`\n📊 Total whitelisted vendors: ${totalWhitelisted}`);

        console.log("\n🎉 All vendors successfully whitelisted!");
        console.log("🚀 You can now test multiple payments with these vendors!");

    } catch (error) {
        console.error("❌ Error during whitelisting:", error);
        
        // If batch fails, try individual whitelisting
        console.log("\n🔄 Attempting individual whitelisting...");
        for (let i = 0; i < vendorAddresses.length; i++) {
            try {
                const isWhitelisted = await uniTick.isVendorWhitelisted(vendorAddresses[i]);
                if (!isWhitelisted) {
                    console.log(`⚡ Whitelisting ${vendorAddresses[i]}...`);
                    const tx = await uniTick.addVendorToWhitelist(vendorAddresses[i]);
                    await tx.wait();
                    console.log(`✅ ${vendorAddresses[i]} whitelisted successfully`);
                } else {
                    console.log(`✅ ${vendorAddresses[i]} already whitelisted`);
                }
            } catch (individualError) {
                console.error(`❌ Failed to whitelist ${vendorAddresses[i]}:`, individualError.message);
            }
        }
    }
}

// Execute the script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("💥 Script failed:", error);
        process.exit(1);
    });
