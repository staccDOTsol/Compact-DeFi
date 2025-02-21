export interface JupiterPriceFeed {
    data: {
        [x: string]: {
            id: string,
            mintSymbol: string,
            vsToken: string,
            vsTokenSymbol: string,
            price: number
        }
    },
    timeTaken: number,
    contextSlot: number
}
export interface Token {
    chainId: number; // 101,
    address: string; // 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: string; // 'USDC',
    name: string; // 'Wrapped USDC',
    decimals: number; // 6,
    logoURI: string; // 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/BXXkv6z8ykpG1yuvUDPgh732wzVHB69RnB9YgSYh3itW/logo.png',
    tags: string[]; // [ 'stablecoin' ]
    extraData?: {balance?: string}
    balance?: number;
  }