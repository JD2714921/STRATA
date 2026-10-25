// Synthetic isolation fixtures only; never market evidence or a trading validation.
export function confluenceFixture(side='SELL',patch={}) {
 const at='2026-10-22T08:00:00.000Z';
 const feature={index:40,sourceTime:at,availableAt:at,atr:2,atrPeriod:9,atrPercentile:0.5,volatility:'normal',direction:side==='BUY'?'Bullish':'Bearish',pivots:[],sweep:side,level:100,retest:side,fvg:null,ifvg:null,gapOutcome:[],openingReversal:null,gapBefore:false};
 return {instrumentId:'SILVER_CASH',asOf:at,feature,directional:feature,higher:feature,circle2:{coverage:true,vintageVerified:true,contradiction:false,expectedDirection:side},mappingVerified:true,timingVerified:true,methodsApproved:true,validated:true,fresh:true,riskConfigured:true,positionsKnown:true,newPositionsToday:0,ownerDirection:side,ownerEvidenceComplete:true,invalidation:false,proposedR:5,...patch};
}
export function isolationCases(){return [
 ['buy',confluenceFixture('BUY')],['sell',confluenceFixture()],
 ['caution',confluenceFixture('SELL',{feature:{...confluenceFixture().feature,volatility:'high'}})],
 ['missing',confluenceFixture('SELL',{feature:null,validated:false})],
 ['contradiction',confluenceFixture('SELL',{circle2:{...confluenceFixture().circle2,contradiction:true}})],
 ['nq-buy',confluenceFixture('BUY',{instrumentId:'NQ'})],
 ['unmapped-sugar',confluenceFixture('BUY',{instrumentId:'SUGAR_RAW_CASH',mappingVerified:false})],
 ['unmapped-crude',confluenceFixture('SELL',{instrumentId:'CRUDE_OIL_CASH',mappingVerified:false})],
 ['owner-disagrees',confluenceFixture('SELL',{ownerDirection:'BUY'})],
 ['risk-missing',confluenceFixture('SELL',{riskConfigured:false})],
 ['daily-cap',confluenceFixture('SELL',{newPositionsToday:1})],
 ];}
