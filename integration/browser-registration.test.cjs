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
