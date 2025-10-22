// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract UnilaBook is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    
    uint256 private _nextTokenId = 1; // Start from 1, 0 reserved for invalid
    uint256 private _nextOrderId = 1;
    
    // Platform fee in basis points (100 = 1%)
    uint256 public platformFeeBps = 50; // 0.5%
    
    // Platform wallet address
    address public platformWallet;

    // UniTick token contract
    IERC20 public uniTickToken;

    // Maximum vendors per order to prevent DOS
    uint256 public constant MAX_VENDORS_PER_ORDER = 50;

    // Vendor whitelist - only whitelisted addresses can receive payments
    mapping(address => bool) public whitelistedVendors;
    address[] public whitelistedAddresses;

    // Events for whitelist management
    event VendorWhitelisted(address indexed vendor);
    event VendorRemovedFromWhitelist(address indexed vendor);
    
    // Order structure
    struct Order {
        uint256 orderId;
        address buyer;
        uint256 totalAmount;
        uint256 platformFee;
        uint256 timestamp;
        bool isPaid;
        string metadata;
    }
    
    // Vendor payment structure
    struct VendorPayment {
        address vendor;
        uint256 amount;
        bool isPaid;
    }
    
    // Booking structure
    struct Booking {
        uint256 bookingId;
        uint256 orderId;
        address vendor;
        uint256 amount;
        uint256 tokenId;
        string serviceName;
        uint256 bookingDate;
    }
    
    // Mappings
    mapping(uint256 => Order) public orders;
    mapping(uint256 => VendorPayment[]) public orderVendorPayments;
    mapping(uint256 => Booking[]) public orderBookings;
    mapping(uint256 => uint256) public tokenToOrder;
    mapping(address => uint256[]) public vendorOrders;
    mapping(address => uint256[]) public userOrders;
    
    // Events
    event OrderCreated(
        uint256 indexed orderId,
        address indexed buyer,
        uint256 totalAmount,
        uint256 platformFee
    );
    
    event PaymentProcessed(
        uint256 indexed orderId,
        address indexed vendor,
        uint256 amount
    );
    
    event TicketMinted(
        uint256 indexed tokenId,
        uint256 indexed orderId,
        address indexed owner
    );
    
    event PlatformFeeUpdated(uint256 newFee);
    event PlatformWalletUpdated(address newWallet);
    
    constructor(address _platformWallet, address _uniTickToken) ERC721("UnilaBook Tickets", "UNILA") Ownable(msg.sender) {
        require(_platformWallet != address(0), "Invalid platform wallet");
        require(_uniTickToken != address(0), "Invalid UniTick token address");

        platformWallet = _platformWallet;
        uniTickToken = IERC20(_uniTickToken);

        // Automatically whitelist platform wallet
        _addToWhitelist(_platformWallet);
    }

    /**
     * @dev Add vendor to whitelist (only owner)
     */
    function addVendorToWhitelist(address vendor) external onlyOwner {
        require(vendor != address(0), "Invalid vendor address");
        _addToWhitelist(vendor);
    }

    /**
     * @dev Remove vendor from whitelist (only owner)
     */
    function removeVendorFromWhitelist(address vendor) external onlyOwner {
        require(whitelistedVendors[vendor], "Vendor not whitelisted");
        _removeFromWhitelist(vendor);
    }

    /**
     * @dev Batch add vendors to whitelist
     */
    function batchAddVendorsToWhitelist(address[] calldata vendors) external onlyOwner {
        for (uint256 i = 0; i < vendors.length; i++) {
            require(vendors[i] != address(0), "Invalid vendor address");
            if (!whitelistedVendors[vendors[i]]) {
                _addToWhitelist(vendors[i]);
            }
        }
    }

    /**
     * @dev Batch remove vendors from whitelist
     */
    function batchRemoveVendorsFromWhitelist(address[] calldata vendors) external onlyOwner {
        for (uint256 i = 0; i < vendors.length; i++) {
            if (whitelistedVendors[vendors[i]]) {
                _removeFromWhitelist(vendors[i]);
            }
        }
    }

    /**
     * @dev Check if vendor is whitelisted
     */
    function isVendorWhitelisted(address vendor) external view returns (bool) {
        return whitelistedVendors[vendor];
    }

    /**
     * @dev Get total number of whitelisted vendors
     */
    function getWhitelistedVendorsCount() external view returns (uint256) {
        return whitelistedAddresses.length;
    }

    /**
     * @dev Get whitelisted vendor at index
     */
    function getWhitelistedVendor(uint256 index) external view returns (address) {
        require(index < whitelistedAddresses.length, "Index out of bounds");
        return whitelistedAddresses[index];
    }

    /**
     * @dev Internal function to add vendor to whitelist
     */
    function _addToWhitelist(address vendor) internal {
        if (!whitelistedVendors[vendor]) {
            whitelistedVendors[vendor] = true;
            whitelistedAddresses.push(vendor);
            emit VendorWhitelisted(vendor);
        }
    }

    /**
     * @dev Internal function to remove vendor from whitelist
     */
    function _removeFromWhitelist(address vendor) internal {
        if (whitelistedVendors[vendor]) {
            whitelistedVendors[vendor] = false;

            // Remove from array (maintains order but expensive - acceptable for admin operations)
            for (uint256 i = 0; i < whitelistedAddresses.length; i++) {
                if (whitelistedAddresses[i] == vendor) {
                    whitelistedAddresses[i] = whitelistedAddresses[whitelistedAddresses.length - 1];
                    whitelistedAddresses.pop();
                    break;
                }
            }

            emit VendorRemovedFromWhitelist(vendor);
        }
    }
    
    /**
     * @dev Create a new order with multiple vendor payments
     * @param _vendorPayments Array of vendor addresses and amounts
     * @param _serviceNames Array of service names for each vendor
     * @param _bookingDates Array of booking dates for each service
     * @param _metadata JSON metadata for the order
     */
    function createOrder(
        VendorPayment[] calldata _vendorPayments,
        string[] calldata _serviceNames,
        uint256[] calldata _bookingDates,
        string calldata _metadata
    ) external nonReentrant returns (uint256) {
        // Input validation
        require(_vendorPayments.length > 0, "No vendor payments");
        require(_vendorPayments.length <= MAX_VENDORS_PER_ORDER, "Too many vendors");
        require(_vendorPayments.length == _serviceNames.length, "Mismatched service names");
        require(_vendorPayments.length == _bookingDates.length, "Mismatched booking dates");
        
        // Calculate total and validate vendors
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < _vendorPayments.length; i++) {
            require(_vendorPayments[i].vendor != address(0), "Invalid vendor address");
            require(_vendorPayments[i].amount > 0, "Amount must be greater than 0");

            // Security: Check vendor whitelist
            require(whitelistedVendors[_vendorPayments[i].vendor], "Vendor not whitelisted");

            // Check for overflow
            uint256 newTotal = totalAmount + _vendorPayments[i].amount;
            require(newTotal > totalAmount, "Amount overflow");
            totalAmount = newTotal;
        }

        // Calculate platform fee
        uint256 platformFee = (totalAmount * platformFeeBps) / 10000;
        uint256 requiredAmount = totalAmount + platformFee;
        require(requiredAmount > totalAmount, "Fee calculation overflow");

        // Transfer UniTick tokens from buyer to contract
        require(uniTickToken.transferFrom(msg.sender, address(this), requiredAmount), "UniTick transfer failed");
        
        // Get next order ID
        uint256 orderId = _nextOrderId;
        _nextOrderId++;
        
        // Create order
        orders[orderId] = Order({
            orderId: orderId,
            buyer: msg.sender,
            totalAmount: totalAmount,
            platformFee: platformFee,
            timestamp: block.timestamp,
            isPaid: true,
            metadata: _metadata
        });
        
        // Process payments and mint tickets
        for (uint256 i = 0; i < _vendorPayments.length; i++) {
            // Store vendor payment
            orderVendorPayments[orderId].push(VendorPayment({
                vendor: _vendorPayments[i].vendor,
                amount: _vendorPayments[i].amount,
                isPaid: true
            }));
            
            // Send payment to vendor in UniTick tokens
            require(uniTickToken.transfer(_vendorPayments[i].vendor, _vendorPayments[i].amount), "Vendor token transfer failed");
            
            emit PaymentProcessed(orderId, _vendorPayments[i].vendor, _vendorPayments[i].amount);
            
            // Create booking
            uint256 tokenId = _nextTokenId;
            _nextTokenId++;
            
            orderBookings[orderId].push(Booking({
                bookingId: i,
                orderId: orderId,
                vendor: _vendorPayments[i].vendor,
                amount: _vendorPayments[i].amount,
                tokenId: tokenId,
                serviceName: _serviceNames[i],
                bookingDate: _bookingDates[i]
            }));
            
            // Mint NFT ticket
            _safeMint(msg.sender, tokenId);
            tokenToOrder[tokenId] = orderId;
            
            emit TicketMinted(tokenId, orderId, msg.sender);
            
            // Track vendor orders
            vendorOrders[_vendorPayments[i].vendor].push(orderId);
        }
        
        // Send platform fee in UniTick tokens
        if (platformFee > 0) {
            require(uniTickToken.transfer(platformWallet, platformFee), "Platform fee token transfer failed");
        }
        
        // Track user orders
        userOrders[msg.sender].push(orderId);
        
        emit OrderCreated(orderId, msg.sender, totalAmount, platformFee);
        
        return orderId;
    }
    
    /**
     * @dev Get order details
     */
    function getOrder(uint256 _orderId) external view returns (Order memory) {
        require(orders[_orderId].orderId != 0, "Order does not exist");
        return orders[_orderId];
    }
    
    /**
     * @dev Get vendor payments for an order
     */
    function getOrderVendorPayments(uint256 _orderId) external view returns (VendorPayment[] memory) {
        require(orders[_orderId].orderId != 0, "Order does not exist");
        return orderVendorPayments[_orderId];
    }
    
    /**
     * @dev Get bookings for an order
     */
    function getOrderBookings(uint256 _orderId) external view returns (Booking[] memory) {
        require(orders[_orderId].orderId != 0, "Order does not exist");
        return orderBookings[_orderId];
    }
    
    /**
     * @dev Get orders for a user
     */
    function getUserOrders(address _user) external view returns (uint256[] memory) {
        return userOrders[_user];
    }
    
    /**
     * @dev Get orders for a vendor
     */
    function getVendorOrders(address _vendor) external view returns (uint256[] memory) {
        return vendorOrders[_vendor];
    }
    
    /**
     * @dev Verify ticket ownership and validity
     */
    function verifyTicket(uint256 _tokenId, address _owner) external view returns (bool) {
        if (_tokenId == 0 || _tokenId >= _nextTokenId) return false;
        
        try this.ownerOf(_tokenId) returns (address owner) {
            return owner == _owner && tokenToOrder[_tokenId] > 0;
        } catch {
            return false;
        }
    }
    
    /**
     * @dev Get ticket details
     */
    function getTicketDetails(uint256 _tokenId) external view returns (Booking memory) {
        uint256 orderId = tokenToOrder[_tokenId];
        require(orderId > 0, "Invalid token");
        
        Booking[] memory bookings = orderBookings[orderId];
        for (uint256 i = 0; i < bookings.length; i++) {
            if (bookings[i].tokenId == _tokenId) {
                return bookings[i];
            }
        }
        revert("Ticket not found");
    }
    
    /**
     * @dev Update platform fee (only owner)
     */
    function updatePlatformFee(uint256 _newFeeBps) external onlyOwner {
        require(_newFeeBps <= 1000, "Fee too high"); // Max 10%
        platformFeeBps = _newFeeBps;
        emit PlatformFeeUpdated(_newFeeBps);
    }
    
    /**
     * @dev Update platform wallet (only owner)
     */
    function updatePlatformWallet(address _newWallet) external onlyOwner {
        require(_newWallet != address(0), "Invalid address");
        platformWallet = _newWallet;
        emit PlatformWalletUpdated(_newWallet);
    }
    
    /**
     * @dev Emergency withdraw (only owner) - for stuck funds
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        (bool success, ) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    // Override required functions
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}