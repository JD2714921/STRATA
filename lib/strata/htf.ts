export type HTFReference = {
  instrumentId: string;
  title: string;
  timeframe: "1D" | "1W" | "1M";
  seriesKind: "Bond price" | "Government yield" | "Index price" | "Commodity price" | "Currency pair" | "Equity price";
  source: string;
  imageUrl: string;
  captureTimestamp: null;
  purpose: string;
};

const weeklyPurpose = "Weekly liquidity structure and event-response elasticity reference.";
const commodityPurpose = "Higher-timeframe liquidity structure and event-response elasticity reference.";

export const htfReferences: HTFReference[] = [
  {instrumentId:"US2Y",title:"US 2Y T-Note",timeframe:"1W",seriesKind:"Bond price",source:"OANDA",imageUrl:"/htf/us-2y-t-note-1w.jpeg",captureTimestamp:null,purpose:weeklyPurpose},
  {instrumentId:"US5Y",title:"US 5Y T-Note",timeframe:"1W",seriesKind:"Bond price",source:"OANDA",imageUrl:"/htf/us-5y-t-note-1w.jpeg",captureTimestamp:null,purpose:weeklyPurpose},
  {instrumentId:"US10Y",title:"US 10Y T-Note",timeframe:"1W",seriesKind:"Bond price",source:"OANDA",imageUrl:"/htf/us-10y-t-note-1w.jpeg",captureTimestamp:null,purpose:weeklyPurpose},
  {instrumentId:"US30Y",title:"United States 30 Year Government Bonds Yield",timeframe:"1W",seriesKind:"Government yield",source:"TVC",imageUrl:"/htf/us-30y-yield-1w.jpeg",captureTimestamp:null,purpose:weeklyPurpose},
  {instrumentId:"UK10Y",title:"UK 10Y Gilt",timeframe:"1W",seriesKind:"Bond price",source:"OANDA",imageUrl:"/htf/uk-10y-gilt-1w.jpeg",captureTimestamp:null,purpose:weeklyPurpose},
  {instrumentId:"DE10Y",title:"German Government Bonds 10 YR Yield",timeframe:"1W",seriesKind:"Government yield",source:"TVC",imageUrl:"/htf/de-10y-yield-1w.jpeg",captureTimestamp:null,purpose:weeklyPurpose},
  {instrumentId:"JP5Y",title:"Japan 5 Year LSEG Government Bonds Yield",timeframe:"1W",seriesKind:"Government yield",source:"TVC",imageUrl:"/htf/jp-5y-yield-1w.jpeg",captureTimestamp:null,purpose:weeklyPurpose},
  {instrumentId:"HANGSENG",title:"Hang Seng Index",timeframe:"1W",seriesKind:"Index price",source:"HSI",imageUrl:"/htf/hang-seng-1w.jpeg",captureTimestamp:null,purpose:weeklyPurpose},
  {instrumentId:"GOLD_CASH",title:"Gold",timeframe:"1M",seriesKind:"Commodity price",source:"Owner-supplied chart · provider / contract not shown",imageUrl:"/htf/gold-1m.jpeg",captureTimestamp:null,purpose:commodityPurpose},
  {instrumentId:"SILVER_CASH",title:"Silver",timeframe:"1M",seriesKind:"Commodity price",source:"Owner-supplied chart · provider / contract not shown",imageUrl:"/htf/silver-1m.jpeg",captureTimestamp:null,purpose:commodityPurpose},
  {instrumentId:"PLATINUM",title:"Platinum",timeframe:"1W",seriesKind:"Commodity price",source:"Owner-supplied chart · provider / contract not shown",imageUrl:"/htf/platinum-1w.jpeg",captureTimestamp:null,purpose:commodityPurpose},
  {instrumentId:"SUGAR_RAW_CASH",title:"Sugar Raw",timeframe:"1M",seriesKind:"Commodity price",source:"Owner-supplied chart · provider / contract not shown",imageUrl:"/htf/sugar-raw-1m.jpeg",captureTimestamp:null,purpose:commodityPurpose},
  {instrumentId:"SUGAR_WHITE",title:"Sugar White",timeframe:"1M",seriesKind:"Commodity price",source:"Owner-supplied chart · provider / contract not shown",imageUrl:"/htf/sugar-white-1m.jpeg",captureTimestamp:null,purpose:commodityPurpose},
  {instrumentId:"COPPER_CASH",title:"Copper",timeframe:"1M",seriesKind:"Commodity price",source:"Owner-supplied chart · provider / contract not shown",imageUrl:"/htf/copper-1m.jpeg",captureTimestamp:null,purpose:commodityPurpose},
  {instrumentId:"WHEAT",title:"Wheat",timeframe:"1M",seriesKind:"Commodity price",source:"Owner-supplied chart · provider / contract not shown",imageUrl:"/htf/wheat-1m.jpeg",captureTimestamp:null,purpose:commodityPurpose},
  {instrumentId:"BRENT_CASH",title:"Oil",timeframe:"1M",seriesKind:"Commodity price",source:"Owner-supplied chart · provider / contract not shown",imageUrl:"/htf/oil-1m.jpeg",captureTimestamp:null,purpose:commodityPurpose},
  {instrumentId:"NATGAS",title:"Natural Gas",timeframe:"1M",seriesKind:"Commodity price",source:"Owner-supplied chart · provider / contract not shown",imageUrl:"/htf/natural-gas-1m.jpeg",captureTimestamp:null,purpose:commodityPurpose},
  {instrumentId:"GBPUSD",title:"GBPUSD",timeframe:"1M",seriesKind:"Currency pair",source:"Owner-supplied chart · provider / contract not shown",imageUrl:"/htf/gbpusd-1m.jpeg",captureTimestamp:null,purpose:commodityPurpose},
  {instrumentId:"GBPEUR",title:"GBPEUR",timeframe:"1M",seriesKind:"Currency pair",source:"Owner-supplied chart · provider / contract not shown",imageUrl:"/htf/gbpeur-1m.jpeg",captureTimestamp:null,purpose:commodityPurpose},
  {instrumentId:"USDCHF",title:"USDCHF",timeframe:"1M",seriesKind:"Currency pair",source:"Owner-supplied chart · provider / contract not shown",imageUrl:"/htf/usdchf-1m.jpeg",captureTimestamp:null,purpose:commodityPurpose},
  {instrumentId:"AUDUSD",title:"AUDUSD",timeframe:"1M",seriesKind:"Currency pair",source:"Owner-supplied chart · provider / contract not shown",imageUrl:"/htf/audusd-1m.jpeg",captureTimestamp:null,purpose:commodityPurpose},
  {instrumentId:"USDCAD",title:"USDCAD",timeframe:"1M",seriesKind:"Currency pair",source:"Owner-supplied chart · provider / contract not shown",imageUrl:"/htf/usdcad-1m.jpeg",captureTimestamp:null,purpose:commodityPurpose},
  {instrumentId:"USDJPY",title:"USDJPY",timeframe:"1M",seriesKind:"Currency pair",source:"Owner-supplied chart · provider / contract not shown",imageUrl:"/htf/usdjpy-1m.jpeg",captureTimestamp:null,purpose:commodityPurpose},
  {instrumentId:"GBPCNH",title:"GBPCNH",timeframe:"1M",seriesKind:"Currency pair",source:"Owner-supplied chart · provider / contract not shown",imageUrl:"/htf/gbpcnh-1m.png",captureTimestamp:null,purpose:commodityPurpose},
  {instrumentId:"SPX",title:"SPX",timeframe:"1M",seriesKind:"Index price",source:"Owner-supplied chart · provider / contract not shown",imageUrl:"/htf/spx-1m.jpeg",captureTimestamp:null,purpose:commodityPurpose},
  {instrumentId:"UK100",title:"UK100",timeframe:"1M",seriesKind:"Index price",source:"Owner-supplied chart · provider / contract not shown",imageUrl:"/htf/uk100-1m.jpeg",captureTimestamp:null,purpose:commodityPurpose},
  {instrumentId:"EURO50",title:"EURO50",timeframe:"1M",seriesKind:"Index price",source:"Owner-supplied chart · provider / contract not shown",imageUrl:"/htf/euro50-1m.jpeg",captureTimestamp:null,purpose:commodityPurpose},
  {instrumentId:"DOW",title:"DOW ETF",timeframe:"1M",seriesKind:"Equity price",source:"Owner-supplied chart · provider / contract not shown",imageUrl:"/htf/dow-etf-1m.jpeg",captureTimestamp:null,purpose:commodityPurpose},
  {instrumentId:"MSTR",title:"MicroStrategy",timeframe:"1W",seriesKind:"Equity price",source:"Owner-supplied chart · provider / contract not shown",imageUrl:"/htf/mstr-1w.jpeg",captureTimestamp:null,purpose:commodityPurpose},
  {instrumentId:"COIN",title:"Coinbase",timeframe:"1W",seriesKind:"Equity price",source:"Owner-supplied chart · provider / contract not shown",imageUrl:"/htf/coin-1w.jpeg",captureTimestamp:null,purpose:commodityPurpose},
  {instrumentId:"USDBRL",title:"U.S. Dollar / Brazilian Real",timeframe:"1W",seriesKind:"Currency pair",source:"ICE",imageUrl:"/htf/usdbrl-1w.jpeg",captureTimestamp:null,purpose:weeklyPurpose},
  {instrumentId:"USDPKR",title:"U.S. Dollar / Pakistani Rupee",timeframe:"1W",seriesKind:"Currency pair",source:"ICE",imageUrl:"/htf/usdpkr-1w.jpeg",captureTimestamp:null,purpose:weeklyPurpose},
  {instrumentId:"USDILS",title:"U.S. Dollar / Israeli Shekel",timeframe:"1W",seriesKind:"Currency pair",source:"FOREXCOM",imageUrl:"/htf/usdils-1w.jpeg",captureTimestamp:null,purpose:weeklyPurpose},
  {instrumentId:"ALUMINIUM",title:"Aluminium Spot",timeframe:"1W",seriesKind:"Commodity price",source:"NCDEX",imageUrl:"/htf/aluminium-1w.jpeg",captureTimestamp:null,purpose:weeklyPurpose},
  {instrumentId:"DAX",title:"DAX Index",timeframe:"1W",seriesKind:"Index price",source:"XETR",imageUrl:"/htf/dax-1w.jpeg",captureTimestamp:null,purpose:weeklyPurpose},
  {instrumentId:"RUSSELL2000",title:"US Russell 2000 Cash",timeframe:"1W",seriesKind:"Index price",source:"IG",imageUrl:"/htf/russell-2000-1w.jpeg",captureTimestamp:null,purpose:weeklyPurpose},
  {instrumentId:"NK225",title:"JP NK 225 Index",timeframe:"1D",seriesKind:"Index price",source:"Phillip Nova",imageUrl:"/htf/nk225-1d.jpeg",captureTimestamp:null,purpose:commodityPurpose},
  {instrumentId:"CSI300",title:"CSI 300 Index",timeframe:"1W",seriesKind:"Index price",source:"SSE",imageUrl:"/htf/csi-300-1w.jpeg",captureTimestamp:null,purpose:weeklyPurpose},
  {instrumentId:"DXY",title:"U.S. Dollar Index",timeframe:"1M",seriesKind:"Index price",source:"TVC",imageUrl:"/htf/dxy-1m.jpeg",captureTimestamp:null,purpose:commodityPurpose},
  {instrumentId:"US20Y",title:"United States 20 Year Government Bonds Yield",timeframe:"1D",seriesKind:"Government yield",source:"TVC",imageUrl:"/htf/us-20y-yield-1d.jpeg",captureTimestamp:null,purpose:commodityPurpose},
  {instrumentId:"VIX",title:"Volatility S&P 500 Index",timeframe:"1W",seriesKind:"Index price",source:"CBOE",imageUrl:"/htf/vix-1w.jpeg",captureTimestamp:null,purpose:weeklyPurpose},
  {instrumentId:"USDEUR",title:"U.S. Dollar / Euro",timeframe:"1W",seriesKind:"Currency pair",source:"ICE",imageUrl:"/htf/usdeur-1w.jpeg",captureTimestamp:null,purpose:weeklyPurpose},
  {instrumentId:"USDAUD",title:"U.S. Dollar / Australian Dollar",timeframe:"1W",seriesKind:"Currency pair",source:"ICE",imageUrl:"/htf/usdaud-1w.jpeg",captureTimestamp:null,purpose:weeklyPurpose},
  {instrumentId:"PALLADIUM",title:"CFDs on Palladium (US$ / OZ)",timeframe:"1W",seriesKind:"Commodity price",source:"TVC",imageUrl:"/htf/palladium-1w.jpeg",captureTimestamp:null,purpose:weeklyPurpose},
  {instrumentId:"CORN",title:"Corn – Cash",timeframe:"1W",seriesKind:"Commodity price",source:"CMC Markets",imageUrl:"/htf/corn-1w.jpeg",captureTimestamp:null,purpose:weeklyPurpose},
  {instrumentId:"NQ100",title:"Nasdaq Cash",timeframe:"1W",seriesKind:"Index price",source:"Eightcap",imageUrl:"/htf/nq100-1w.jpeg",captureTimestamp:null,purpose:weeklyPurpose},
];

export const htfReferenceIds = htfReferences.map((reference) => reference.instrumentId);
