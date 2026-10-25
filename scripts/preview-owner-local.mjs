// Local QA ONLY. Simulates trusted dispatch identity against Wrangler on loopback.
// Never deploy this server or point it at a hosted Site.
import http from 'node:http';
http.createServer((request,response)=>{
 const headers={...request.headers,'oai-authenticated-user-id':'LOCAL-HISTORICAL-QA','oai-authenticated-user-email':'local-qa@example.invalid'};
 const upstream=http.request({hostname:'127.0.0.1',port:8787,path:request.url,method:request.method,headers},res=>{response.writeHead(res.statusCode||502,res.headers);res.pipe(response);});
 upstream.on('error',()=>{response.writeHead(502);response.end('Local Wrangler unavailable.');});request.pipe(upstream);
}).listen(8788,'127.0.0.1',()=>console.log('Local historical QA at http://127.0.0.1:8788; simulated identity, no production access.'));
