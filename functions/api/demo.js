export async function onRequestGet(context){
  const url=new URL('/data/demo.json',context.request.url);
  const response=await context.env.ASSETS.fetch(url);
  return new Response(response.body,{status:response.status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'public, max-age=300','x-content-type-options':'nosniff'}});
}

export function onRequest(){
  return Response.json({error:'Method not allowed'},{status:405,headers:{allow:'GET'}});
}
