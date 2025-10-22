// Whitelist Vendor Addresses Script
// This script whitelists the 3 vendor addresses for testing multiple payments

const { ethers } = require("hardhat");

async function main() {
    // The 3 vendor addresses that need to be whitelisted
    const vendorAddresses = [
        "0x34e256A05c2cf2c72C44864648740b60D4A2666C",
        "0x5713f4236938865A29Bd9477D85C43Af083E297A", 
        "0xbbc92de321b5b828dcd5d46631f748de083d9862"
    ];

    // Get the contract addresses from your deployment
    // Update these addresses based on your actual deployment
    const UNILABOOK_CONTRACT_ADDRESS = process.env.UNILABOOK_CONTRACT_ADDRESS || "YOUR_UNILABOOK_CONTRACT_ADDRESS";
    
    console.log("🚀 Starting vendor whitelisting process...");
    console.log("📋 Vendor addresses to whitelist:");
    vendorAddresses.forEach((addr, index) => {
        console.log(`   ${index + 1}. ${addr}`);
    });

    // Get the contract instance
    const UnilaBook = await ethers.getContractFactory("UnilaBook");
    const unilaBook = UnilaBook.attach(UNILABOOK_CONTRACT_ADDRESS);

    // Get the owner (deployer) account
    const [owner] = await ethers.getSigners();
    console.log(`\n👤 Using account: ${owner.address}`);

    try {
        // Check current whitelist status
        console.log("\n🔍 Checking current whitelist status...");
        for (let i = 0; i < vendorAddresses.length; i++) {
            const isWhitelisted = await unilaBook.isVendorWhitelisted(vendorAddresses[i]);
            console.log(`   ${vendorAddresses[i]}: ${isWhitelisted ? '✅ Already whitelisted' : '❌ Not whitelisted'}`);
        }

        // Batch whitelist all vendors at once (more gas efficient)
        console.log("\n⚡ Batch whitelisting vendors...");
        const tx = await unilaBook.batchAddVendorsToWhitelist(vendorAddresses);
        console.log(`📝 Transaction hash: ${tx.hash}`);
        
        console.log("⏳ Waiting for transaction confirmation...");
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
        console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);

        // Verify whitelist status after transaction
        console.log("\n🔍 Verifying whitelist status after transaction...");
        for (let i = 0; i < vendorAddresses.length; i++) {
            const isWhitelisted = await unilaBook.isVendorWhitelisted(vendorAddresses[i]);
            console.log(`   ${vendorAddresses[i]}: ${isWhitelisted ? '✅ Whitelisted' : '❌ Not whitelisted'}`);
        }

        // Get total whitelisted count
        const totalWhitelisted = await unilaBook.getWhitelistedVendorsCount();
        console.log(`\n📊 Total whitelisted vendors: ${totalWhitelisted}`);

        console.log("\n🎉 All vendors successfully whitelisted!");
        console.log("🚀 You can now test multiple payments with these vendors!");

    } catch (error) {
        console.error("❌ Error during whitelisting:", error);
        
        // If batch fails, try individual whitelisting
        console.log("\n🔄 Attempting individual whitelisting...");
        for (let i = 0; i < vendorAddresses.length; i++) {
            try {
                const isWhitelisted = await unilaBook.isVendorWhitelisted(vendorAddresses[i]);
                if (!isWhitelisted) {
                    console.log(`⚡ Whitelisting ${vendorAddresses[i]}...`);
                    const tx = await unilaBook.addVendorToWhitelist(vendorAddresses[i]);
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
