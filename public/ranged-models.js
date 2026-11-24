(function(root){
 'use strict';
 // Hand-drawn vector silhouettes: fixed materials, highlights and construction
 // details stay readable at hotbar size. Rarity belongs to the surrounding card.
 function svg(def){
  const id=String(def.rangedId||def.id).replace(/[^a-z]/g,''),url=name=>'url(#'+id+'-'+name+')';
  const gradients=`<defs><linearGradient id="${id}-wood" x2=".9" y2="1"><stop stop-color="#e9b968"/><stop offset=".48" stop-color="#b97436"/><stop offset="1" stop-color="#734426"/></linearGradient><linearGradient id="${id}-steel" x2=".6" y2="1"><stop stop-color="#f3f8f7"/><stop offset=".38" stop-color="#a8c2ca"/><stop offset=".65" stop-color="#5e7d8e"/><stop offset="1" stop-color="#c2d9dd"/></linearGradient><linearGradient id="${id}-ice" x2="1" y2="1"><stop stop-color="#eaffff"/><stop offset=".4" stop-color="#83e8fa"/><stop offset="1" stop-color="#3184cc"/></linearGradient><linearGradient id="${id}-void" x2="1" y2="1"><stop stop-color="#c98bfa"/><stop offset=".5" stop-color="#6944ac"/><stop offset="1" stop-color="#292b55"/></linearGradient><linearGradient id="${id}-gold" x2=".8" y2="1"><stop stop-color="#fff5a6"/><stop offset=".5" stop-color="#edbb50"/><stop offset="1" stop-color="#b9792c"/></linearGradient></defs>`;
  const path=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
  const line=(d,color,width=2)=>path(d,'none',`stroke="${color}" stroke-width="${width}"`);
  const circle=(x,y,r,fill,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
  const star=(x,y,r,color)=>path(`M${x} ${y-r}L${x+r*.28} ${y-r*.28}L${x+r} ${y}L${x+r*.28} ${y+r*.28}L${x} ${y+r}L${x-r*.28} ${y+r*.28}L${x-r} ${y}L${x-r*.28} ${y-r*.28}Z`,color,'stroke-width="1.4"');
  const wrap=(x,y)=>line(`M${x-6} ${y-5}L${x+6} ${y-1}M${x-6} ${y+1}L${x+6} ${y+5}M${x-6} ${y+7}L${x+6} ${y+11}`,'#e4bc7f',3);
  let art='';
  switch(id){
   case 'slingshot':
    art=path('M43 91L41 57Q23 45 18 17Q18 10 26 10L32 15Q35 39 49 43Q62 37 68 14L76 10Q84 12 81 22Q75 47 57 58L58 91Z',url('wood'))+line('M25 18Q36 32 48 52Q63 33 75 18','#f2cf84',5)+path('M39 46Q49 41 59 47L58 58Q48 63 39 56Z','#70503d')+circle(48,49,7,url('steel'))+path('M42 65L57 64L57 85L43 87Z','#70503d')+wrap(50,72)+line('M25 28L29 36M72 27L67 37','#ffe2a1',2.5);break;
   case 'woodbow':
    art=line('M31 9L31 91','#f9e8bf',2.5)+path('M30 7Q42 9 42 21Q42 29 55 39Q67 50 55 61Q42 71 42 79Q42 91 30 94L26 88Q36 86 33 74Q32 64 45 53Q50 50 45 47Q32 36 33 26Q36 15 26 13Z',url('wood'))+line('M38 23Q40 36 52 46M52 57Q40 67 38 79','#f7d08b',2)+path('M37 42L49 43L49 57L37 59Z','#664731')+wrap(43,47)+line('M15 50L87 50','#e8d8b1',3)+path('M78 43L95 50L78 57L82 50Z',url('steel'))+path('M14 43L24 49L14 56L17 50Z','#d7e7bc');break;
   case 'boomerang':
    art=path('M12 84L23 26Q25 15 36 15Q43 15 49 23L89 67L75 83L39 49L31 91Z',url('wood'))+path('M23 35L37 39L33 55L19 50Z','#eee2af')+path('M62 43L76 58L65 70L52 57Z','#eee2af')+line('M31 27Q36 24 41 31L77 69M21 73L27 48','#f5d78d',3)+line('M29 61L25 78M44 39L54 49','#6e4026',2)+circle(38,35,3,'#c2e5be');break;
   case 'revolver':
    art=path('M10 25L89 25L92 31L89 40L56 41L52 52L43 56L49 85Q47 91 39 92L20 89L24 57L17 47L10 46Z',url('steel'))+path('M23 57L39 54L46 86L24 86Z',url('wood'))+path('M54 43Q67 44 62 55Q57 64 46 59L45 54L52 54Q58 53 55 49Z','#547081')+path('M68 24L76 19L81 25Z','#547081')+line('M64 30H88M14 31H24','#eef6f5',3)+circle(38,39,15,'#718c96')+circle(38,39,5,'#d2dedc')+circle(33,31,2,'#293f4a')+circle(46,37,2,'#293f4a')+circle(34,46,2,'#293f4a')+line('M29 64L40 69M28 73L42 78','#734a31',2)+circle(33,82,2.5,'#d9b36f');break;
   case 'thornbow':
    art=line('M30 9L30 91','#ddf0a0',2.5)+path('M28 7Q42 9 42 22L68 34L60 47L72 58L46 77Q44 90 29 94L24 87Q34 81 32 72L51 54L40 48L51 38L32 27Q34 17 24 14Z','#75a64b')+path('M42 22L55 12L54 29M59 36L77 30L64 46M60 65L76 78L48 77Z','#b7d86e')+line('M36 21Q39 34 53 41M56 59L40 75','#d4e790',3)+path('M33 43L45 44L45 57L33 59Z','#5e5940')+wrap(39,47)+line('M14 50H86','#c6d693',3)+path('M79 42L94 50L79 58L82 50Z','#578242')+path('M14 43L24 50L14 57Z','#cee59c');break;
   case 'glacial':
    art=path('M32 91L48 36L59 39L43 94Z','#466784')+line('M37 82L50 43','#98d3de',3)+path('M40 59L52 62L48 75L36 72Z','#38516f')+line('M39 63L49 66M38 69L47 72','#d2e5df',3)+path('M44 41L30 23L33 9L46 17L54 4L67 18L82 11L86 27L64 45Z',url('ice'))+path('M54 4L55 29L44 41M67 18L55 29L64 45M33 9L42 28L55 29M82 11L73 32L64 45','#b8f6ff')+line('M54 9L57 23M36 14L41 23M80 18L76 28','#fff',2)+path('M44 42L61 47L58 54L42 50Z',url('steel'))+star(83,45,7,'#b9faff');break;
   case 'firebook':
    art=path('M11 22L42 15L88 26L91 83L55 90L12 77Z','#8f4238')+path('M19 24L43 21L80 30L82 77L54 82L20 72Z','#f3d8a3')+path('M43 21L48 75L54 82L80 77L78 34Z','#ffeac2')+line('M21 33L37 30M22 41L38 39M24 49L36 47M25 60L39 57','#ba9867',2)+path('M41 23L47 79L55 87L55 91L43 84L35 25Z','#d37945')+path('M57 31Q66 44 61 50Q76 40 77 56Q82 70 67 74Q48 73 52 58Q54 49 57 31Z','#f98b39')+path('M63 51Q67 59 70 55Q77 66 67 69Q58 68 61 60Z','#fff1a1')+path('M13 22L22 20L25 28L13 32ZM82 75L91 74L91 83L82 85Z',url('gold'))+circle(23,75,3,'#edb45a');break;
   case 'stinger':
    art=path('M9 40L67 17L87 31L88 43L69 55L57 54L48 87L31 85L37 57L18 59Z',url('gold'))+path('M26 34L38 30L45 51L32 55ZM45 26L55 22L64 45L53 50ZM66 19L74 22L81 37L73 43Z','#343d37')+path('M37 59L51 62L45 81L34 80Z','#5b5940')+path('M87 28L98 24L91 42L85 45Z',url('steel'))+path('M37 30Q18 9 12 18Q5 28 28 39M49 26Q38 4 31 10Q21 17 41 30','#e3f5df')+line('M16 22L29 33M32 15L41 25','#a5c8be',2)+circle(61,38,4,'#fff5ac');break;
   case 'chakram':{
    let blades='';for(let n=0;n<6;n++)blades+=`<g transform="rotate(${n*60} 50 50)">`+path('M43 23L55 4L62 24L75 29L61 35Z',url('ice'))+line('M55 8L52 24L61 30','#f5ffff',2)+'</g>';
    art=blades+`<circle cx="50" cy="50" r="29" fill="none" stroke="#274b62" stroke-width="13"/><circle cx="50" cy="50" r="29" fill="none" stroke="${url('ice')}" stroke-width="8"/>`+line('M29 47A22 22 0 0 1 50 28M72 50A22 22 0 0 1 50 72','#ebffff',3)+star(18,73,5,'#b8faff');break;}
   case 'voidbow':
    art=path('M18 17Q44 14 51 35Q65 11 87 20L91 35L72 32L60 49L83 59L71 72L53 58L43 93L30 87L39 52L19 59L9 46L36 39L24 29L14 32Z',url('void'))+path('M33 78L45 82L42 92L29 88Z','#443152')+line('M18 26L51 50L84 27M37 40L51 50L70 38','#d6b9fc',2.5)+path('M48 66L61 17L65 13L67 22L55 69Z','#e6b8ff')+path('M54 18L66 6L73 25L65 21Z','#cfb0ff')+circle(51,49,7,'#34284e')+star(51,49,5,'#efa6ff')+line('M34 81L43 85','#cfa6dc',2);break;
   case 'starfall':
    art=line('M26 8L27 93','#ffe6a6',2)+path('M24 6Q42 8 44 24Q43 34 59 45L61 54Q43 68 44 79Q42 92 25 95L22 87Q34 82 32 73L47 52L47 47L32 26Q34 16 21 14Z',url('void'))+path('M33 19L40 25L40 34L52 46L48 50L34 33Z','#6bbddd')+path('M50 56L39 72L39 83L28 90L26 86L33 77L34 68Z','#78c7e5')+path('M33 43L49 42L50 58L34 60Z','#33436d')+line('M18 50L83 50','#d4eaff',3)+star(86,50,11,'#fff1ae')+star(35,16,6,'#fff1ae')+star(37,82,5,'#fff1ae')+circle(52,27,2,'#e2f8ff')+circle(66,13,2.5,'#e2f8ff')+line('M52 27L66 13L79 22','#aacdec',1.5)+star(79,22,4,'#f2e5ff');break;
   case 'horizon':
    art=path('M32 92L45 40L54 42L44 95Z',url('void'))+line('M38 85L49 48','#ba8ce2',2.5)+path('M39 63L49 66L46 80L35 77Z','#42344f')+line('M38 68L48 71M37 74L46 77','#d8b0d9',2)+path('M43 48L32 37L34 16L42 10L43 33L52 40L68 33L76 14L83 22L78 42L60 53Z',url('steel'))+circle(57,26,21,'#211b35')+circle(57,26,16,'#120f23','stroke="#8668b0" stroke-width="2"')+`<ellipse cx="57" cy="26" rx="33" ry="8" transform="rotate(-20 57 26)" fill="none" stroke="#644477" stroke-width="8"/><ellipse cx="57" cy="26" rx="33" ry="8" transform="rotate(-20 57 26)" fill="none" stroke="#e1b6f0" stroke-width="3"/>`+path('M43 12Q56 3 70 16Q57 11 47 20Z','#aa90cc','stroke="none"')+star(89,43,5,'#e7c1ff');break;
   default:return '';
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 104 104">${gradients}<g transform="translate(2 2)" stroke="#263b43" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round">${art}</g></svg>`;
 }
 const api={svg};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RANGED_MODELS=api;
})(typeof globalThis!=='undefined'?globalThis:this);
