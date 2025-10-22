// Quick Whitelist Script - Simple version
// Run this with: npx hardhat run scripts/quick-whitelist.js --network <your-network>

const { ethers } = require("hardhat");

async function main() {
    // Your 3 vendor addresses
    const vendors = [
        "0x34e256A05c2cf2c72C44864648740b60D4A2666C",
        "0x5713f4236938865A29Bd9477D85C43Af083E297A", 
        "0xbbc92de321b5b828dcd5d46631f748de083d9862"
    ];

    // Update this with your actual UnilaBook contract address
    const contractAddress = "YOUR_UNILABOOK_CONTRACT_ADDRESS_HERE";
    
    const UnilaBook = await ethers.getContractFactory("UnilaBook");
    const contract = UnilaBook.attach(contractAddress);
    
    console.log("Whitelisting vendors...");
    
    // Batch whitelist (most efficient)
    const tx = await contract.batchAddVendorsToWhitelist(vendors);
    await tx.wait();
    
    console.log("✅ All vendors whitelisted!");
    
    // Verify
    for (const vendor of vendors) {
        const isWhitelisted = await contract.isVendorWhitelisted(vendor);
        console.log(`${vendor}: ${isWhitelisted ? '✅' : '❌'}`);
    }
}

main().catch(console.error);
