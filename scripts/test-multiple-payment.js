// Test Multiple Payment Script
// This script tests creating an order with multiple vendors after whitelisting

const { ethers } = require("hardhat");

async function main() {
    // Your whitelisted vendor addresses
    const vendors = [
        "0x34e256A05c2cf2c72C44864648740b60D4A2666C",
        "0x5713f4236938865A29Bd9477D85C43Af083E297A", 
        "0xbbc92de321b5b828dcd5d46631f748de083d9862"
    ];

    // Contract addresses - UPDATE THESE
    const UNILABOOK_ADDRESS = "YOUR_UNILABOOK_CONTRACT_ADDRESS";
    const UNITICK_ADDRESS = "YOUR_UNITICK_CONTRACT_ADDRESS";
    
    const [deployer, buyer] = await ethers.getSigners();
    
    console.log("🧪 Testing multiple payment with whitelisted vendors...");
    console.log(`👤 Buyer: ${buyer.address}`);
    
    // Get contracts
    const UnilaBook = await ethers.getContractFactory("UnilaBook");
    const UniTick = await ethers.getContractFactory("UniTick");
    
    const unilaBook = UnilaBook.attach(UNILABOOK_ADDRESS);
    const uniTick = UniTick.attach(UNITICK_ADDRESS);
    
    // Check whitelist status
    console.log("\n🔍 Checking whitelist status:");
    for (const vendor of vendors) {
        const isWhitelisted = await unilaBook.isVendorWhitelisted(vendor);
        console.log(`   ${vendor}: ${isWhitelisted ? '✅ Whitelisted' : '❌ Not whitelisted'}`);
    }
    
    // Prepare test order
    const vendorPayments = vendors.map((vendor, index) => ({
        vendor: vendor,
        amount: ethers.parseEther("100") // 100 tokens per vendor
    }));
    
    const serviceNames = [
        "Hotel Booking",
        "Car Rental", 
        "Tour Service"
    ];
    
    const bookingDates = [
        Math.floor(Date.now() / 1000) + 86400, // Tomorrow
        Math.floor(Date.now() / 1000) + 172800, // Day after tomorrow
        Math.floor(Date.now() / 1000) + 259200  // 3 days from now
    ];
    
    const metadata = JSON.stringify({
        orderType: "multi-vendor-test",
        description: "Test order with multiple vendors",
        createdAt: new Date().toISOString()
    });
    
    // Check buyer's token balance
    const buyerBalance = await uniTick.balanceOf(buyer.address);
    const requiredAmount = ethers.parseEther("300") + ethers.parseEther("1.5"); // 300 + 0.5% fee
    
    console.log(`\n💰 Buyer balance: ${ethers.formatEther(buyerBalance)} UTICK`);
    console.log(`💸 Required amount: ${ethers.formatEther(requiredAmount)} UTICK`);
    
    if (buyerBalance < requiredAmount) {
        console.log("⚠️  Insufficient balance. Claiming faucet tokens...");
        const claimTx = await uniTick.connect(buyer).claimFaucet();
        await claimTx.wait();
        console.log("✅ Tokens claimed!");
    }
    
    // Approve tokens for UnilaBook contract
    console.log("\n🔐 Approving tokens...");
    const approveTx = await uniTick.connect(buyer).approve(UNILABOOK_ADDRESS, requiredAmount);
    await approveTx.wait();
    console.log("✅ Tokens approved!");
    
    // Create the order
    console.log("\n📝 Creating multi-vendor order...");
    const orderTx = await unilaBook.connect(buyer).createOrder(
        vendorPayments,
        serviceNames,
        bookingDates,
        metadata
    );
    
    const receipt = await orderTx.wait();
    console.log(`✅ Order created! Transaction: ${orderTx.hash}`);
    
    // Parse events to get order ID
    const orderCreatedEvent = receipt.logs.find(log => {
        try {
            const parsed = unilaBook.interface.parseLog(log);
            return parsed.name === 'OrderCreated';
        } catch {
            return false;
        }
    });
    
    if (orderCreatedEvent) {
        const parsed = unilaBook.interface.parseLog(orderCreatedEvent);
        const orderId = parsed.args.orderId;
        console.log(`📋 Order ID: ${orderId}`);
        
        // Get order details
        const order = await unilaBook.getOrder(orderId);
        console.log(`\n📊 Order Details:`);
        console.log(`   Buyer: ${order.buyer}`);
        console.log(`   Total Amount: ${ethers.formatEther(order.totalAmount)} UTICK`);
        console.log(`   Platform Fee: ${ethers.formatEther(order.platformFee)} UTICK`);
        console.log(`   Timestamp: ${new Date(Number(order.timestamp) * 1000).toLocaleString()}`);
        
        // Get vendor payments
        const vendorPayments = await unilaBook.getOrderVendorPayments(orderId);
        console.log(`\n💳 Vendor Payments:`);
        vendorPayments.forEach((payment, index) => {
            console.log(`   ${index + 1}. ${payment.vendor}: ${ethers.formatEther(payment.amount)} UTICK`);
        });
        
        // Get bookings/NFTs
        const bookings = await unilaBook.getOrderBookings(orderId);
        console.log(`\n🎫 NFT Tickets Created:`);
        bookings.forEach((booking, index) => {
            console.log(`   ${index + 1}. Token ID: ${booking.tokenId}, Service: ${booking.serviceName}`);
        });
    }
    
    console.log("\n🎉 Multi-vendor payment test completed successfully!");
}

main().catch(console.error);
