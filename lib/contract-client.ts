import { createPublicClient, createWalletClient, http, custom, getContract, parseAbi, Address, Hex, Hash, encodeFunctionData, maxUint256 } from "viem"
import { privateKeyToAccount } from 'viem/accounts'
import { mainnet, polygon, optimism, arbitrum, base, bsc, avalanche, baseSepolia } from "wagmi/chains"
import { DEFAULT_CHAIN, DEFAULT_BASE_SEPOLIA_RPC, DEFAULT_TICKET_CONTRACT_ADDRESS } from "@/lib/constants"
import { getContractAddress } from "@/lib/addresses"
import { getSecureWalletForUser } from "@/lib/wallet-secure"

// Contract ABI
const UNILABOOK_ABI = parseAbi([
  // Payment functions
  "function createOrder((address vendor, uint256 amount, bool isPaid)[] vendorPayments, string[] serviceNames, uint256[] bookingDates, string metadata) external returns (uint256)",

  // Query functions
  "function getOrder(uint256 orderId) view returns ((uint256 orderId, address buyer, uint256 totalAmount, uint256 platformFee, uint256 timestamp, bool isPaid, string metadata))",
  "function getOrderVendorPayments(uint256 orderId) view returns ((address vendor, uint256 amount, bool isPaid)[])",
  "function getOrderBookings(uint256 orderId) view returns ((uint256 bookingId, uint256 orderId, address vendor, uint256 amount, uint256 tokenId, string serviceName, uint256 bookingDate)[])",
  "function verifyTicket(uint256 tokenId, address owner) view returns (bool)",
  "function getTicketDetails(uint256 tokenId) view returns ((uint256 bookingId, uint256 orderId, address vendor, uint256 amount, uint256 tokenId, string serviceName, uint256 bookingDate))",
  "function isFreeTicket(uint256 tokenId) view returns (bool)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",

  // Platform settings
  "function platformFeeBps() view returns (uint256)",
  "function platformWallet() view returns (address)",
  "function setPlatformFee(uint256 newFee)",
  "function setPlatformWallet(address newWallet)",

  // Whitelist management
  "function addVendorToWhitelist(address vendor)",
  "function removeVendorFromWhitelist(address vendor)",
  "function batchAddVendorsToWhitelist(address[] vendors)",
  "function batchRemoveVendorsFromWhitelist(address[] vendors)",
  "function isVendorWhitelisted(address vendor) view returns (bool)",
  "function getWhitelistedVendorsCount() view returns (uint256)",
  "function getWhitelistedVendor(uint256 index) view returns (address)",
  "function whitelistedVendors(address) view returns (bool)",

  // Events
  "event OrderCreated(uint256 indexed orderId, address indexed buyer, uint256 totalAmount, uint256 platformFee)",
  "event TicketMinted(uint256 indexed tokenId, uint256 indexed orderId, address indexed owner)",
  "event FreeTicketCreated(uint256 indexed tokenId, uint256 indexed orderId, address indexed vendor, string serviceName)",
  "event PlatformFeeUpdated(uint256 newFee)",
  "event PlatformWalletUpdated(address newWallet)",
  "event VendorWhitelisted(address indexed vendor)",
  "event VendorRemovedFromWhitelist(address indexed vendor)"
])

// UniTick token ABI
export const unitickAbi = parseAbi([
  "function claimFaucet() external",
  "function canClaim(address account) external view returns (bool)",
  "function timeUntilNextClaim(address account) external view returns (uint256)",
  "function lastClaimTime(address) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event TokensClaimed(address indexed claimant, uint256 amount)"
])

export interface VendorPayment {
  vendor: Address
  amount: bigint
  isPaid: boolean
}

export interface OrderData {
  orderId: bigint
  buyer: Address
  totalAmount: bigint
  platformFee: bigint
  timestamp: bigint
  isPaid: boolean
  metadata: string
}

export interface BookingData {
  bookingId: bigint
  orderId: bigint
  vendor: Address
  amount: bigint
  tokenId: bigint
  serviceName: string
  bookingDate: bigint
}

// Use centralized contract address
export function getUnilaBookAddress(): Address {
  return getContractAddress("UNILABOOK") as Address
}

// Helper function to get wallet client
async function getWalletClient() {
  if (typeof window === "undefined" || !(window as any).ethereum) {
    throw new Error("Wallet not connected")
  }

  // Get the current chain from the wallet directly
  const walletChainId = await (window as any).ethereum.request({ method: 'eth_chainId' })
  const chainId = parseInt(walletChainId, 16)

  console.log('[Contract Client] Wallet chain ID:', chainId, 'Hex:', walletChainId)

  // Map chain ID to wagmi chain object
  let chain
  if (chainId === 84532) {
    chain = baseSepolia
    console.log('[Contract Client] Using Base Sepolia chain config')
  } else if (chainId === 1) {
    chain = mainnet
    console.log('[Contract Client] Using Mainnet chain config')
  } else {
    // For other chains, try to find in the map or default to baseSepolia
    const chainName = process.env.NEXT_PUBLIC_CHAIN || DEFAULT_CHAIN
    const map: Record<string, any> = { mainnet, polygon, optimism, arbitrum, base, baseSepolia, bsc, avalanche }
    chain = map[chainName] || baseSepolia
    console.log('[Contract Client] Using configured chain:', chainName, 'ID:', chain.id)
  }

  console.log('[Contract Client] Creating wallet client with chain ID:', chain.id)

  // Ensure we're using Base Sepolia for the contract calls
  if (chain.id !== 84532) {
    throw new Error(`Contract calls must be made on Base Sepolia (chain ID 84532), but wallet is on chain ID ${chain.id}`)
  }

  const walletClient = createWalletClient({ chain, transport: custom((window as any).ethereum) })
  const account = (await walletClient.getAddresses())[0]
  if (!account) throw new Error("No account found")

  return { walletClient, account, chain }
}

function getChain() {
  const chainName = process.env.NEXT_PUBLIC_CHAIN || DEFAULT_CHAIN
  const map: Record<string, any> = { mainnet, polygon, optimism, arbitrum, base, baseSepolia, bsc, avalanche }
  return map[chainName] || baseSepolia
}

export function getPublicClient() {
  const chain = getChain()
  const rpc = process.env.NEXT_PUBLIC_RPC_URL || (chain.id === 84532 ? DEFAULT_BASE_SEPOLIA_RPC : chain.rpcUrls.public.http[0])
  
  console.log('[Contract Client] Creating public client:', {
    chainId: chain.id,
    chainName: chain.name,
    rpc: rpc
  })
  
  // Add timeout to RPC calls (10 seconds)
  const transport = http(rpc, {
    timeout: 10000,
  })
  
  return createPublicClient({ chain, transport })
}

export function getContractClient() {
  const publicClient = getPublicClient()
  const contractAddress = getUnilaBookAddress()
  return getContract({ address: contractAddress, abi: UNILABOOK_ABI, client: publicClient })
}

// Check UniTick token balance
export async function getUniTickBalance(owner: Address): Promise<bigint> {
  const publicClient = getPublicClient()
  const unitickAddress = getContractAddress("UNITICK")

  const balance = await publicClient.readContract({
    address: unitickAddress as `0x${string}`,
    abi: unitickAbi,
    functionName: "balanceOf",
    args: [owner],
  })

  return balance as bigint
}

// Check current UniTick allowance
export async function getUniTickAllowance(owner: Address, spender: Address): Promise<bigint> {
  const publicClient = getPublicClient()
  const unitickAddress = getContractAddress("UNITICK")

  const allowance = await publicClient.readContract({
    address: unitickAddress as `0x${string}`,
    abi: unitickAbi,
    functionName: "allowance",
    args: [owner, spender],
  })

  return allowance as bigint
}

// Approve infinite UniTick tokens for spending (one-time approval)
export async function approveInfiniteUniTickTokens(walletClient?: any): Promise<Hash> {
  const contractAddress = getUnilaBookAddress()
  const unitickAddress = getContractAddress("UNITICK")
  const MAX_UINT256 = 2n ** 256n - 1n // Maximum uint256 value for infinite approval

  if (walletClient) {
    return await walletClient.writeContract({
      address: unitickAddress as `0x${string}`,
      abi: unitickAbi,
      functionName: "approve",
      args: [contractAddress, MAX_UINT256],
      account: walletClient.account,
    })
  } else {
    const { walletClient: client, account } = await getWalletClient()
    return await client.writeContract({
      address: unitickAddress as `0x${string}`,
      abi: unitickAbi,
      functionName: "approve",
      args: [contractAddress, MAX_UINT256],
      account,
    })
  }
}

// Approve specific amount of UniTick tokens (fallback)
export async function approveUniTickTokens(amount: bigint, walletClient?: any, spender?: Address): Promise<Hash> {
  const contractAddress = getUnilaBookAddress()
  const unitickAddress = getContractAddress("UNITICK")
  const spenderAddress = spender || contractAddress

  if (walletClient) {
    return await walletClient.writeContract({
      address: unitickAddress as `0x${string}`,
      abi: unitickAbi,
      functionName: "approve",
      args: [spenderAddress, amount],
      account: walletClient.account,
    })
  } else {
    const { walletClient: client, account } = await getWalletClient()
    return await client.writeContract({
      address: unitickAddress as `0x${string}`,
      abi: unitickAbi,
      functionName: "approve",
      args: [spenderAddress, amount],
      account,
    })
  }
}

// Wrapper function for creating orders from cart items
export async function createOrderFromCartItems(
  cartItems: any[],
  userId: string,
  email: string
): Promise<{ success: boolean; blockchainOrderId?: string; transactionHash?: string; blockNumber?: string; buyerAddress?: string; error?: string }> {
  try {
    console.log('[Contract Client] Creating order from cart items:', cartItems.length)
    
    // Get decrypted wallet for transaction signing
    let walletData
    try {
      walletData = await getSecureWalletForUser(userId, email)
    } catch (error) {
      console.log('[Contract Client] No encrypted wallet found, creating one...')
      // Create encrypted wallet for user
      const { createSecureWalletForUser } = await import('@/lib/wallet-secure')
      const walletAddress = await createSecureWalletForUser(userId, email)
      console.log('[Contract Client] Created encrypted wallet:', walletAddress)
      
      // Try to get the wallet again
      walletData = await getSecureWalletForUser(userId, email)
    }
    
    // Create account from private key
    const account = privateKeyToAccount(walletData.privateKey as `0x${string}`)
    
    // Create wallet client with the decrypted private key
    const walletClient = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org')
    })
    
    // Check ETH balance for gas fees
    const publicClient = getPublicClient()
    const ethBalance = await publicClient.getBalance({
      address: walletData.address as `0x${string}`
    })
    
    console.log('[Contract Client] Wallet ETH balance:', ethBalance.toString(), 'wei')
    
    // Check if wallet has enough ETH for gas (minimum 0.001 ETH = 1000000000000000 wei)
    const minGasBalance = BigInt('1000000000000000') // 0.001 ETH
    if (ethBalance < minGasBalance) {
      throw new Error(`Insufficient ETH for gas fees. Required: 0.001 ETH minimum, Available: ${(Number(ethBalance) / 1e18).toFixed(6)} ETH. Please add ETH to your wallet address: ${walletData.address}`)
    }
    
    // Check UniTick token balance and allowance
    const contractAddress = getUnilaBookAddress()
    const currentBalance = await getUniTickBalance(walletData.address)
    const currentAllowance = await getUniTickAllowance(walletData.address, contractAddress)
    
    console.log('[Contract Client] Current UniTick balance:', currentBalance.toString())
    console.log('[Contract Client] Current UniTick allowance:', currentAllowance.toString())
    console.log('[Contract Client] Contract address:', contractAddress)
    
    // Group items by vendor
    const vendorGroups = new Map<string, any[]>()
    cartItems.forEach(item => {
      const vendorAddress = item.listing.vendor?.wallet_address
      if (!vendorAddress) {
        throw new Error(`Vendor wallet address not found for listing: ${item.listing.title}`)
      }
      
      if (!vendorGroups.has(vendorAddress)) {
        vendorGroups.set(vendorAddress, [])
      }
      vendorGroups.get(vendorAddress)!.push(item)
    })

    // Create vendor payments - one entry per cart item to match service names and booking dates
    const vendorPayments: VendorPayment[] = []
    const serviceNames: string[] = []
    const bookingDates: bigint[] = []
    
    let totalAmount = 0
    
    // Process each cart item individually to ensure array length consistency
    for (const item of cartItems) {
      const vendorAddress = item.listing.vendor?.wallet_address
      if (!vendorAddress) {
        throw new Error(`Vendor wallet address not found for listing: ${item.listing.title}`)
      }
      
      const itemAmount = item.listing.price * item.quantity
      totalAmount += itemAmount
      
      vendorPayments.push({
        vendor: vendorAddress as Address,
        amount: BigInt(Math.floor(itemAmount * 1e18)), // Convert to UniTick token units (18 decimals)
        isPaid: false
      })
      
      serviceNames.push(item.listing.title)
      bookingDates.push(BigInt(Math.floor(new Date(item.booking_date).getTime() / 1000)))
    }

    // Calculate platform fee (0.5%) - convert to wei properly
    const platformFeeInTokens = totalAmount * 0.005 // 0.5%
    const platformFeeInWei = BigInt(Math.floor(platformFeeInTokens * 1e18))
    const totalAmountInWei = BigInt(Math.floor(totalAmount * 1e18))
    const totalWithFee = totalAmountInWei + platformFeeInWei
    
    console.log('[Contract Client] Total amount:', totalAmount, 'Platform fee in tokens:', platformFeeInTokens, 'Platform fee in wei:', platformFeeInWei.toString())
    console.log('[Contract Client] Required UniTick tokens:', totalWithFee.toString())
    
    // Check if wallet has enough UniTick tokens
    console.log('[Contract Client] Checking token balance...')
    console.log('[Contract Client] Required tokens:', totalWithFee.toString())
    console.log('[Contract Client] Available tokens:', currentBalance.toString())
    
    if (currentBalance < totalWithFee) {
      throw new Error(`Insufficient UniTick tokens. Required: ${totalWithFee.toString()}, Available: ${currentBalance.toString()}. Please claim tokens from faucet or add more UniTick tokens to your wallet address: ${walletData.address}`)
    }
    
    // Check if contract has enough allowance
    console.log('[Contract Client] Checking token allowance...')
    console.log('[Contract Client] Required allowance:', totalWithFee.toString())
    console.log('[Contract Client] Current allowance:', currentAllowance.toString())
    
    if (currentAllowance < totalWithFee) {
      console.log('[Contract Client] Insufficient allowance detected')
      console.log('[Contract Client] Current allowance:', currentAllowance.toString())
      console.log('[Contract Client] Required allowance:', totalWithFee.toString())
      console.log('[Contract Client] Shortfall:', (totalWithFee - currentAllowance).toString())
      
      throw new Error(`Insufficient token allowance. Current: ${currentAllowance.toString()}, Required: ${totalWithFee.toString()}. Please approve tokens first.`)
    } else {
      console.log('[Contract Client] Allowance sufficient, proceeding with order creation')
    }
    
    // Note: Contract balance check removed - the contract will receive tokens during the transaction
    // The contract receives tokens via transferFrom before trying to pay vendors

    // Validate and whitelist vendors before creating order
    console.log('[Contract Client] Validating vendor whitelist status...')
    const uniqueVendors = new Set<string>()
    for (const vendorPayment of vendorPayments) {
      uniqueVendors.add(vendorPayment.vendor)
    }
    
    for (const vendorAddress of uniqueVendors) {
      const isWhitelisted = await isVendorWhitelisted(vendorAddress)
      console.log(`[Contract Client] Vendor ${vendorAddress} whitelisted: ${isWhitelisted}`)
      
      if (!isWhitelisted) {
        console.log(`[Contract Client] Vendor ${vendorAddress} not whitelisted - adding to whitelist...`)
        try {
          const whitelistHash = await addVendorToWhitelistWithWallet(vendorAddress, walletClient)
          console.log(`[Contract Client] Whitelist transaction sent: ${whitelistHash}`)
          
          // Wait for whitelist transaction to be mined
          const whitelistReceipt = await publicClient.waitForTransactionReceipt({ hash: whitelistHash })
          if (whitelistReceipt.status !== 'success') {
            throw new Error(`Vendor whitelist failed with status: ${whitelistReceipt.status}`)
          }
          
          console.log(`[Contract Client] Vendor ${vendorAddress} successfully whitelisted`)
        } catch (whitelistError) {
          console.error(`[Contract Client] Failed to whitelist vendor ${vendorAddress}:`, whitelistError)
          throw new Error(`Failed to whitelist vendor ${vendorAddress}: ${whitelistError instanceof Error ? whitelistError.message : 'Unknown error'}`)
        }
      }
    }
    
    // Create metadata
    const metadata = JSON.stringify({
      buyerEmail: email,
      totalItems: cartItems.length,
      timestamp: new Date().toISOString()
    })

    // Create order on chain using internal wallet
    const result = await createOrderOnChain(
      vendorPayments,
      serviceNames,
      bookingDates,
      metadata,
      totalWithFee,
      walletClient
    )

    console.log('[Contract Client] Order created successfully:', result.orderId.toString())
    console.log('[Contract Client] Transaction hash:', result.receipt.transactionHash)
    
    // Return the blockchain data - database record will be created in the API handler
    return {
      success: true,
      blockchainOrderId: result.orderId.toString(),
      transactionHash: result.receipt.transactionHash || result.orderId.toString(),
      blockNumber: result.receipt.blockNumber.toString(),
      buyerAddress: walletData.address
    }
    
  } catch (error) {
    console.error('[Contract Client] Error creating order from cart items:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function createOrderOnChain(
  vendorPayments: VendorPayment[],
  serviceNames: string[],
  bookingDates: bigint[],
  metadata: string,
  totalUnitickAmount: bigint,
  walletClient?: any
): Promise<{ orderId: bigint; tokenIds: bigint[]; receipt: any }> {
  let client, account

  if (walletClient) {
    // Use the provided wallet client (for internal wallets)
    console.log('[Contract Client] Using provided wallet client for internal wallet')
    client = walletClient
    account = walletClient.account
  } else {
    // Fallback to creating our own client (for external wallets)
    console.log('[Contract Client] Creating new wallet client for external wallet')
    const result = await getWalletClient()
    client = result.walletClient
    account = result.account
  }

  const contractAddress = getUnilaBookAddress()

  // Simulate first to capture the predicted orderId and get a canonical request
  console.log('[Contract Client] Simulating contract call...')
  console.log('[Contract Client] Simulation parameters:', {
    contractAddress,
    account: account.address,
    vendorPaymentsCount: vendorPayments.length,
    serviceNamesCount: serviceNames.length,
    bookingDatesCount: bookingDates.length,
    vendorPayments: vendorPayments.map(vp => ({ vendor: vp.vendor, amount: vp.amount.toString() })),
    serviceNames,
    bookingDates: bookingDates.map(bd => bd.toString()),
    metadata
  })
  
  const publicClient = getPublicClient()
  let simulationResult
  try {
    simulationResult = await publicClient.simulateContract({
    address: contractAddress,
    abi: UNILABOOK_ABI,
    functionName: "createOrder",
    args: [vendorPayments, serviceNames, bookingDates, metadata],
    account,
  }) as any
    
    console.log('[Contract Client] Simulation successful, predicted order ID:', simulationResult.result)
  } catch (simulationError) {
    console.error('[Contract Client] Simulation failed:', simulationError)
    console.error('[Contract Client] Simulation error details:', {
      message: simulationError instanceof Error ? simulationError.message : 'Unknown error',
      cause: simulationError instanceof Error ? simulationError.cause : undefined,
      stack: simulationError instanceof Error ? simulationError.stack : undefined
    })
    
    // Try to extract more specific error information
    if (simulationError instanceof Error) {
      const errorMessage = simulationError.message
      if (errorMessage.includes('Vendor not whitelisted')) {
        throw new Error('Vendor whitelist validation failed in simulation')
      } else if (errorMessage.includes('UniTick transfer failed')) {
        throw new Error('Token transfer failed in simulation - check balance and allowance')
      } else if (errorMessage.includes('Vendor token transfer failed')) {
        throw new Error('Vendor payment transfer failed in simulation')
      } else if (errorMessage.includes('Platform fee token transfer failed')) {
        throw new Error('Platform fee transfer failed in simulation')
      } else {
        throw new Error(`Contract simulation failed: ${errorMessage}`)
      }
    }
    
    throw new Error(`Contract simulation failed: ${simulationError instanceof Error ? simulationError.message : 'Unknown error'}`)
  }
  
  const { request, result: simulatedOrderId } = simulationResult

  // Send the transaction using the simulated request
  let hash: Hash
  if (walletClient && walletClient.account) {
    // Internal wallet - sign transaction locally and send as raw transaction
    console.log('[Contract Client] Signing transaction locally with internal wallet')
    
    // Get gas price for the transaction
    const gasPrice = await publicClient.getGasPrice()
    
    // Get the correct nonce for the account
    const nonce = await publicClient.getTransactionCount({
      address: walletClient.account.address,
      blockTag: 'pending'
    })
    
    // Estimate gas limit for the transaction
    console.log('[Contract Client] Estimating gas for transaction...')
    console.log('[Contract Client] Contract address:', contractAddress)
    console.log('[Contract Client] Account address:', walletClient.account.address)
    console.log('[Contract Client] Vendor payments:', vendorPayments.map(vp => ({ vendor: vp.vendor, amount: vp.amount.toString() })))
    console.log('[Contract Client] Service names:', serviceNames)
    console.log('[Contract Client] Booking dates:', bookingDates.map(bd => bd.toString()))
    console.log('[Contract Client] Metadata:', metadata)
    
    let gasEstimate
    try {
      gasEstimate = await publicClient.estimateContractGas({
      address: contractAddress,
      abi: UNILABOOK_ABI,
      functionName: "createOrder",
      args: [vendorPayments, serviceNames, bookingDates, metadata],
      account: walletClient.account,
    })
      console.log('[Contract Client] Gas estimate successful:', gasEstimate.toString())
    } catch (gasError) {
      console.error('[Contract Client] Gas estimation failed:', gasError)
      throw new Error(`Gas estimation failed: ${gasError instanceof Error ? gasError.message : 'Unknown error'}`)
    }
    
    // Create the transaction data manually since simulation failed
    const transactionData = encodeFunctionData({
      abi: UNILABOOK_ABI,
      functionName: 'createOrder',
      args: [vendorPayments, serviceNames, bookingDates, metadata]
    })
    
    const signedTx = await walletClient.signTransaction({
      to: contractAddress,
      data: transactionData,
      account: walletClient.account,
      type: 'legacy',
      gasPrice: gasPrice,
      gas: gasEstimate,
      value: 0n,
      nonce: nonce,
    })
    
    // Double-check balance and allowance before sending
    console.log('[Contract Client] Final balance check before sending transaction...')
    const finalBalance = await getUniTickBalance(walletClient.account.address)
    const finalAllowance = await getUniTickAllowance(walletClient.account.address, contractAddress)
    console.log('[Contract Client] Final balance:', finalBalance.toString())
    console.log('[Contract Client] Final allowance:', finalAllowance.toString())
    console.log('[Contract Client] Required amount:', totalUnitickAmount.toString())
    
    if (finalBalance < totalUnitickAmount) {
      throw new Error(`Insufficient balance at transaction time. Required: ${totalUnitickAmount.toString()}, Available: ${finalBalance.toString()}`)
    }
    
    if (finalAllowance < totalUnitickAmount) {
      throw new Error(`Insufficient allowance at transaction time. Required: ${totalUnitickAmount.toString()}, Available: ${finalAllowance.toString()}`)
    }
    
    // Send the signed transaction
    console.log('[Contract Client] Sending signed transaction to blockchain...')
    hash = await publicClient.sendRawTransaction({ serializedTransaction: signedTx })
    console.log('[Contract Client] Transaction sent, hash:', hash)
  } else {
    // External wallet - use writeContract
    console.log('[Contract Client] Sending transaction with external wallet')
    hash = await client.writeContract(request)
  }

  // Wait for transaction receipt
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  
  // Check if transaction was successful
  if (receipt.status !== 'success') {
    console.error('[Contract Client] Transaction failed:', receipt)
    throw new Error(`Transaction failed with status: ${receipt.status}`)
  }
  
  console.log('[Contract Client] Transaction successful, parsing logs...')
  
  // Decode logs via ABI to get reliable parsing
  let orderId: bigint | null = null
  const tokenIds: bigint[] = []

  // First try: query logs scoped to our contract and this block
  try {
    const orderCreatedLogs = await publicClient.getLogs({
      address: contractAddress,
      event: parseAbi([
        "event OrderCreated(uint256 indexed orderId, address indexed buyer, uint256 totalAmount, uint256 platformFee)",
      ]) as any,
      fromBlock: receipt.blockNumber,
      toBlock: receipt.blockNumber,
      blockHash: receipt.blockHash,
    }) as any[]

    if (orderCreatedLogs && orderCreatedLogs.length > 0) {
      const log = orderCreatedLogs[0]
      // viem parses args by name
      orderId = (log as any).args.orderId as bigint
    }
  } catch (_) {
    // ignore and fall back to generic decoding below
  }

  // Collect TicketMinted events
  try {
    const ticketMintedLogs = await publicClient.getLogs({
      address: contractAddress,
      event: parseAbi([
        "event TicketMinted(uint256 indexed tokenId, uint256 indexed orderId, address indexed owner)",
      ]) as any,
      fromBlock: receipt.blockNumber,
      toBlock: receipt.blockNumber,
      blockHash: receipt.blockHash,
    }) as any[]

    for (const log of ticketMintedLogs) {
      tokenIds.push((log as any).args.tokenId as bigint)
    }
  } catch (_) {
    // ignore; will try generic decoding below
  }

  // Fallback parsing over all logs if needed
  if (orderId === null || tokenIds.length === 0) {
    for (const log of receipt.logs) {
      try {
        const parsed = publicClient.decodeEventLog({
          abi: UNILABOOK_ABI,
          data: log.data,
          topics: log.topics as any,
        }) as any

        if (parsed.eventName === 'OrderCreated' && orderId === null) {
          orderId = parsed.args[0] as bigint
        } else if (parsed.eventName === 'TicketMinted') {
          tokenIds.push(parsed.args[0] as bigint)
        }
      } catch (_) {
        // ignore non-matching logs
      }
    }
  }

  // Final safety net: fall back to simulated orderId if parsing failed
  if (orderId === null) {
    orderId = simulatedOrderId as bigint
  }

  return { orderId, tokenIds, receipt }
}

export async function getOrderFromChain(orderId: bigint): Promise<OrderData> {
  const contract = getContractClient()
  return await contract.read.getOrder([orderId]) as OrderData
}

export async function getOrderBookingsFromChain(orderId: bigint): Promise<BookingData[]> {
  const contract = getContractClient()
  return await contract.read.getOrderBookings([orderId]) as BookingData[]
}

export async function verifyTicketOnChain(tokenId: bigint, owner: Address): Promise<boolean> {
  const contract = getContractClient()
  return await contract.read.verifyTicket([tokenId, owner]) as boolean
}

export async function getTicketDetailsFromChain(tokenId: bigint): Promise<BookingData> {
  const contract = getContractClient()
  return await contract.read.getTicketDetails([tokenId]) as BookingData
}

export async function isFreeTicket(tokenId: bigint): Promise<boolean> {
  const contract = getContractClient()
  return await contract.read.isFreeTicket([tokenId]) as boolean
}

export async function getTicketOwner(tokenId: bigint): Promise<Address> {
  const contract = getContractClient()
  return await contract.read.ownerOf([tokenId]) as Address
}

// Whitelist management functions
export async function addVendorToWhitelist(vendor: Address): Promise<Hash> {
  const { walletClient, account } = await getWalletClient()

  const contractAddress = getUnilaBookAddress()

  return await walletClient.writeContract({
    address: contractAddress,
    abi: UNILABOOK_ABI,
    functionName: "addVendorToWhitelist",
    args: [vendor],
    account,
  })
}

// Whitelist function that uses a provided wallet client (for internal wallets)
export async function addVendorToWhitelistWithWallet(vendor: Address, walletClient: any): Promise<Hash> {
  const contractAddress = getUnilaBookAddress()

  return await walletClient.writeContract({
    address: contractAddress,
    abi: UNILABOOK_ABI,
    functionName: "addVendorToWhitelist",
    args: [vendor],
    account: walletClient.account,
  })
}

export async function removeVendorFromWhitelist(vendor: Address): Promise<Hash> {
  const { walletClient, account } = await getWalletClient()

  const contractAddress = getUnilaBookAddress()

  return await walletClient.writeContract({
    address: contractAddress,
    abi: UNILABOOK_ABI,
    functionName: "removeVendorFromWhitelist",
    args: [vendor],
    account,
  })
}

export async function batchAddVendorsToWhitelist(vendors: Address[]): Promise<Hash> {
  const { walletClient, account } = await getWalletClient()

  const contractAddress = getUnilaBookAddress()

  return await walletClient.writeContract({
    address: contractAddress,
    abi: UNILABOOK_ABI,
    functionName: "batchAddVendorsToWhitelist",
    args: [vendors],
    account,
  })
}

export async function batchRemoveVendorsFromWhitelist(vendors: Address[]): Promise<Hash> {
  const { walletClient, account } = await getWalletClient()
  const contractAddress = getUnilaBookAddress()

  return await walletClient.writeContract({
    address: contractAddress,
    abi: UNILABOOK_ABI,
    functionName: "batchRemoveVendorsFromWhitelist",
    args: [vendors],
    account,
  })
}

export async function isVendorWhitelisted(vendor: Address): Promise<boolean> {
  const contract = getContractClient()
  return await contract.read.isVendorWhitelisted([vendor]) as boolean
}

export async function getWhitelistedVendorsCount(): Promise<bigint> {
  try {
    const contract = getContractClient()
    console.log('[Contract Client] Getting whitelisted vendors count from contract:', getUnilaBookAddress())
    const count = await contract.read.getWhitelistedVendorsCount([]) as bigint
    console.log('[Contract Client] Whitelisted vendors count:', count.toString())
    return count
  } catch (error) {
    console.error('[Contract Client] Error getting whitelisted vendors count:', error)
    throw error
  }
}

export async function getWhitelistedVendor(index: bigint): Promise<Address> {
  try {
    const contract = getContractClient()
    console.log('[Contract Client] Getting whitelisted vendor at index:', index.toString())
    const vendor = await contract.read.getWhitelistedVendor([index]) as Address
    console.log('[Contract Client] Whitelisted vendor:', vendor)
    return vendor
  } catch (error) {
    console.error('[Contract Client] Error getting whitelisted vendor:', error)
    throw error
  }
}
