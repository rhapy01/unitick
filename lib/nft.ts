import { createPublicClient, createWalletClient, http, getContract, parseAbi, Address, Hex } from "viem"
import { mainnet, polygon, optimism, arbitrum, base, bsc, avalanche } from "wagmi/chains"
import { getContractAddress, isContractDeployed } from "@/lib/addresses"

export interface MintResult {
  bookingId: string
  contractAddress: string
  tokenId: string
  txHash: string
}

const ERC721_ABI = parseAbi([
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function safeMint(address to, uint256 tokenId) public",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
])

export function isNftEnabled(): boolean {
  return isContractDeployed("UNILABOOK") && Boolean(process.env.NEXT_PUBLIC_RPC_URL)
}

function getChain() {
  // Default to base if not specified; adjust as needed
  const chainName = process.env.NEXT_PUBLIC_CHAIN || "base"
  const map: Record<string, any> = { mainnet, polygon, optimism, arbitrum, base, bsc, avalanche }
  return map[chainName] || base
}

export function getPublicClient() {
  const chain = getChain()
  const rpc = process.env.NEXT_PUBLIC_RPC_URL || chain.rpcUrls.public.http[0]
  return createPublicClient({ chain, transport: http(rpc) })
}

export async function verifyNftOwnership(contractAddress: Address, tokenId: bigint, expectedOwner: Address): Promise<boolean> {
  try {
    const publicClient = getPublicClient()
    const contract = getContract({ address: contractAddress, abi: ERC721_ABI, client: publicClient })
    const owner = (await contract.read.ownerOf([tokenId])) as Address
    return owner.toLowerCase() === expectedOwner.toLowerCase()
  } catch {
    return false
  }
}

// Attempts to mint one ERC-721 per booking. Requires a contract exposing safeMint(to, tokenId).
// If NFT is not enabled via env, returns an empty array without failing the payment flow.
export async function mintTickets(
  bookingIds: string[],
  toAddress: Address,
): Promise<MintResult[]> {
  if (!isNftEnabled()) return []

  const contractAddress = getContractAddress("UNILABOOK") as Address
  if (!contractAddress) return []

  // Use the connected wallet via window.ethereum
  if (typeof window === "undefined" || !(window as any).ethereum) return []

  const chain = getChain()
  const walletClient = createWalletClient({ chain, transport: (window as any).ethereum })
  const account = (await walletClient.getAddresses())[0]
  if (!account) return []

  const results: MintResult[] = []

  // Naive tokenId assignment: derive from booking UUID last 12 hex chars
  for (const bookingId of bookingIds) {
    const hex = (bookingId.replace(/-/g, "").slice(-12) || "0").padStart(12, "0")
    const tokenId = BigInt("0x" + hex)

    try {
      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: ERC721_ABI,
        functionName: "safeMint",
        args: [toAddress, tokenId],
        account,
      })
      results.push({ bookingId, contractAddress, tokenId: tokenId.toString(), txHash: String(hash) })
    } catch (e) {
      // Skip failed mints; continue with others
      // In production you may want to abort and surface the error
    }
  }

  return results
}


