const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const os=require('node:os');
const path=require('node:path');
const {BROWSERS,browserSpec,connectInstalledBrowsers,computeExtensionId}=require('../desktop/browser-registration.cjs');

test('supported browsers map to their macOS profile folders',()=>{
  assert.equal(browserSpec('Chrome').macData,'Google/Chrome');
  assert.equal(browserSpec('Edge').macData,'Microsoft Edge');
  assert.equal(browserSpec('Brave').macData,'BraveSoftware/Brave-Browser');
  assert.equal(browserSpec('Opera').macData,'com.operasoftware.Opera');
  assert.equal(browserSpec('Opera').rootProfile,true);
  assert.equal(browserSpec('Firefox').firefox,true);
  assert.throws(()=>browserSpec('Unknown'),/Choose Chrome, Edge, Brave, Opera, or Firefox/);
});

test('automatic discovery connects every installed Chromium browser and profile',async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'awesome-browsers-'));
  t.after(()=>fs.rm(root,{recursive:true,force:true}));
  const appSupport=path.join(root,'Application Support'),integrationRoot=path.join(root,'app');
  const extension=path.join(integrationRoot,'extension');
  await fs.mkdir(extension,{recursive:true});
  const ids={Chrome:'a'.repeat(32),Edge:'b'.repeat(32),Brave:'c'.repeat(32),Opera:'d'.repeat(32)};
  for(const browser of ['Chrome','Edge','Brave']){
    const folder=path.join(appSupport,BROWSERS[browser].macData,'Default');await fs.mkdir(folder,{recursive:true});
    await fs.writeFile(path.join(folder,'Preferences'),JSON.stringify({extensions:{settings:{[ids[browser]]:{path:extension}}}}));
  }
  const opera=path.join(appSupport,BROWSERS.Opera.macData);await fs.mkdir(opera,{recursive:true});
  await fs.writeFile(path.join(opera,'Preferences'),JSON.stringify({extensions:{settings:{[ids.Opera]:{path:extension}}}}));
  const calls=[];
  const result=await connectInstalledBrowsers({dataDirectory:path.join(root,'data'),integrationRoot,appSupport},{register:async input=>{calls.push(input);return {manifestPath:'unused'};}});
  assert.deepEqual(result.map(value=>value.browser),['Chrome','Edge','Brave','Opera']);
  const computed=computeExtensionId(await fs.realpath(extension));
  for(const browser of Object.keys(ids)){
    const registered=calls.filter(value=>value.browser===browser).map(value=>value.extensionId);
    assert.deepEqual([...registered].sort(),[computed,ids[browser]].sort(),`${browser} registers its installed ID and the computed unpacked ID`);
  }
});

test('discovery finds a store-installed copy of the extension (relative path under <profile>/Extensions)',async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'awesome-store-'));
  t.after(()=>fs.rm(root,{recursive:true,force:true}));
  const appSupport=path.join(root,'Application Support'),integrationRoot=path.join(root,'app');
  await fs.mkdir(path.join(integrationRoot,'extension'),{recursive:true});
  const profile=path.join(appSupport,BROWSERS.Chrome.macData,'Default');
  const storeId='p'.repeat(32),otherId='o'.repeat(32),escapeId='n'.repeat(32);
  const installed=path.join(profile,'Extensions',storeId,'0.1.1_0');
  await fs.mkdir(installed,{recursive:true});
  await fs.writeFile(path.join(installed,'manifest.json'),JSON.stringify({name:'Download Manager for Mac Integration',background:{service_worker:'background.js'}}));
  await fs.writeFile(path.join(installed,'background.js'),"const HOST = 'com.asimsafeer.downloadmanagerformac';");
  const unrelated=path.join(profile,'Extensions',otherId,'1.0_0');           // another extension, ours must still be found after it
  await fs.mkdir(unrelated,{recursive:true});
  await fs.writeFile(path.join(unrelated,'manifest.json'),JSON.stringify({name:'Something else'}));
  await fs.writeFile(path.join(unrelated,'background.js'),'');
  await fs.writeFile(path.join(profile,'Secure Preferences'),JSON.stringify({extensions:{settings:{
    [otherId]:{path:`${otherId}/1.0_0`},
    ['m'.repeat(32)]:{path:'missing/9.9_0'},                                  // dangling entry must not stop the scan
    [escapeId]:{path:'../../../../../etc'},                                   // must not be followed outside Extensions
    [storeId]:{path:`${storeId}/0.1.1_0`}}}}));
  const calls=[];
  await connectInstalledBrowsers({dataDirectory:path.join(root,'data'),integrationRoot,appSupport},{register:async input=>{calls.push(input);return {manifestPath:'unused'};}});
  const ids=calls.filter(value=>value.browser==='Chrome').map(value=>value.extensionId);
  assert.ok(ids.includes(storeId),'store-installed extension is registered');
  assert.ok(!ids.includes(otherId)&&!ids.includes(escapeId),'unrelated and out-of-tree entries are ignored');
});
