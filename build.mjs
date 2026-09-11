import { build } from '../Metr1ka/node_modules/vite/dist/node/index.js';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
const root=fileURLToPath(new URL('../',import.meta.url)).replace(/\/$/,'');
await build({configFile:false,resolve:{alias:{'react/jsx-runtime':root+'/Metr1ka/node_modules/react/jsx-runtime.js'}},root:root+'/Metr1ka',define:{'process.env.NODE_ENV':'"production"'},build:{outDir:'/tmp/survey-build',emptyOutDir:true,minify:true,lib:{entry:root+'/encuestas-online/encuesta.jsx',name:'Encuesta',formats:['iife'],fileName:()=> 'survey.js'}}});
const template=fs.readFileSync(root+'/encuestas-online/plantilla.html','utf8');
const logo=fs.readFileSync(root+'/Metr1ka/src/assets/LogoMetr1ka.svg','utf8').replace('<svg ','<svg aria-label="Metr1ka" role="img" ');
fs.writeFileSync(root+'/encuestas-online/index.html',template.replace('<!-- LOGO -->',logo).replace('/* APP */',()=>fs.readFileSync('/tmp/survey-build/survey.js','utf8').replaceAll('</script','<\\/script')));
