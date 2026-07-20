const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const asNumber=(value,min,max,fallback)=>{const n=Number(value);return Number.isFinite(n)?clamp(n,min,max):fallback};

async function loadDemo(request,env){
  const url=new URL('/data/demo.json',request.url);
  const response=await env.ASSETS.fetch(url);
  if(!response.ok) throw new Error('Synthetic dataset unavailable');
  return response.json();
}

function json(value,status=200,headers={}){
  return Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...headers}});
}

async function calculate(request,env){
  const input=await request.json();
  const demo=await loadDemo(request,env);
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
  return {
    inputs:{solarPct,flexibleLoadPct,storageKwh},
    annualCostEur:Math.round(annualCostEur),
    annualSavingEur:Math.round(base.annualCostEur-annualCostEur),
    gridImportKwh:Math.round(gridImportKwh),
    selfUsePct:Number((generationKwh?directUseKwh/generationKwh*100:0).toFixed(1)),
    status:'hypothetical',
    assumptions:[
      'Synthetic annual household profile',
      'Constant €0.21/kWh value for additionally captured generation',
      'No equipment purchase, finance or maintenance costs'
    ]
  };
}

export default {
  async fetch(request,env){
    const url=new URL(request.url);

    if(request.method==='GET'&&url.pathname==='/api/demo'){
      try{return json(await loadDemo(request,env));}
      catch(error){return json({error:error.message},503);}
    }

    if(url.pathname==='/api/whatif'){
      if(request.method!=='POST') return json({error:'Method not allowed'},405,{Allow:'POST'});
      try{return json(await calculate(request,env));}
      catch(error){return json({error:error.message},400);}
    }

    if(!['GET','HEAD'].includes(request.method)){
      return json({error:'This demo is read-only and cannot control devices or persist changes.'},403);
    }

    const response=await env.ASSETS.fetch(request);
    const headers=new Headers(response.headers);
    headers.set('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'");
    headers.set('Cross-Origin-Opener-Policy','same-origin');
    headers.set('Referrer-Policy','no-referrer');
    headers.set('X-Content-Type-Options','nosniff');
    headers.set('X-Frame-Options','DENY');
    return new Response(request.method==='HEAD'?null:response.body,{status:response.status,statusText:response.statusText,headers});
  }
};
