
export const pages: any = [
    {
      title: "overview",
      url: "home",
      icon: 'home',
    },
    // {
    //   title: "learning center",
    //   url: "learn",
    //   icon: 'book-outline',
    // },
    {
      title: "dashboard",
      url: "dashboard",
      icon: 'grid-outline'
    },
    {
      title: "NFT",
      url: "nft-gallery",
      icon: 'color-palette'
    },
    {
      title: "DeFi",
      icon: "cube-outline",
      url: "/defi",
      children: [
        {
          title: "liquid staking",
          url: "/defi/liquid-stake",
          icon: 'water',
        },
        {
          title: "swap",
          url: "/defi/token-swap",
          icon: 'swap-horizontal',
        },
        {
          title: "NFT Liquidity",
          url: "/defi/nft-liquidity",
          icon: 'swap-horizontal',
        },
      ]
    },
    // {
    //   title: "learning center",
    //   url: "learning-center",
    //   icon: 'book-outline',
    // },
    // {
    //   title: "vote what next",
    //   url: "vote-what-next",
    //   icon: 'rocket-outline',
    // },
    {
      title: "stake with us",
      url: "stake-with-us",
      icon: 'heart-circle',
    },
    // {
    //   title: "stake gen2",
    //   url: "stake-gen2",
    //   icon: 'flash',
    // }
  ];