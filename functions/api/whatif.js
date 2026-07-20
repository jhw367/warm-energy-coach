const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const asNumber=(value,min,max,fallback)=>{const n=Number(value);return Number.isFinite(n)?clamp(n,min,max):fallback};

export async function onRequestPost(context){
  try{
    const input=await context.request.json();
    const dataResponse=await context.env.ASSETS.fetch(new URL('/data/demo.json',context.request.url));
    const demo=await dataResponse.json();
    const solarPct=asNumber(input.solarPct,50,160,100);
    const flexibleLoadPct=asNumber(input.flexibleLoadPct,5,45,18);
    const storageKwh=asNumber(input.storageKwh,0,20,10);
    const base=demo.scenario.baseline;
    const solarDeltaKwh=demo.energy.solarGenerationKwh*((solarPct-100)/100);
    const captureRatio=clamp(.45+flexibleLoadPct/200+storageKwh/100,.4,.85);
    const capturedSolarDeltaKwh=solarDeltaKwh*captureRatio;
    const flexibleDelta=flexibleLoadPct-base.flexibleLoadPct;
    const storageDelta=storageKwh-base.storageKwh;
    const annualCostEur=clamp(base.annualCostEur-capturedSolarDeltaKwh*.21-flexibleDelta*10-storageDelta*18,400,4000);
    const gridImportKwh=clamp(base.gridImportKwh-capturedSolarDeltaKwh-flexibleDelta*12-storageDelta*30,0,10000);
    const generationKwh=demo.energy.solarGenerationKwh*(solarPct/100);
    const directUseKwh=clamp(demo.energy.directSolarUseKwh+capturedSolarDeltaKwh,0,generationKwh);
    return Response.json({inputs:{solarPct,flexibleLoadPct,storageKwh},annualCostEur:Math.round(annualCostEur),annualSavingEur:Math.round(base.annualCostEur-annualCostEur),gridImportKwh:Math.round(gridImportKwh),selfUsePct:Number((generationKwh?directUseKwh/generationKwh*100:0).toFixed(1)),status:'hypothetical',assumptions:['Synthetic annual household profile','Constant €0.21/kWh value for additionally captured generation','No equipment purchase, finance or maintenance costs']});
  }catch(error){return Response.json({error:error.message},{status:400})}
}

export function onRequest(){return Response.json({error:'Method not allowed'},{status:405,headers:{allow:'POST'}})}
