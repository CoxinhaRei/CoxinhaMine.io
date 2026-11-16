const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const openStorage=require('../storage');
const {createGameServer}=require('../server');
function temporary(t){const root=path.resolve(os.tmpdir()),folder=fs.mkdtempSync(path.join(root,'coxinha-save-test-'));t.after(()=>{const target=path.resolve(folder);if(!target.startsWith(root+path.sep))throw Error('Invalid test cleanup path');fs.rmSync(target,{recursive:true,force:true});});return folder;}
test('save survives reopening file storage',async t=>{
  const dir=temporary(t);let storage=await openStorage({DATA_DIR:dir});storage.db.set('profiles',{test:{state:{level:231,coins:12345}}}).write();await storage.flush();storage.close();
  storage=await openStorage({DATA_DIR:dir});assert.equal(storage.db.get(['profiles','test','state','level']).value(),231);assert.equal(storage.db.get(['profiles','test','state','coins']).value(),12345);storage.close();
});

test('account password and progress survive server recreation without browser data',async t=>{
  const folder=temporary(t);let server=await createGameServer({storage:await openStorage({DATA_DIR:folder})});
  const created=await server.accounts.register({nickname:'PersistentHero',password:'persistent-test-password'},null,'test-persistence');const id=created.profile.id;
  created.profile.state.coins=372;created.profile.state.level=77;server.store.save(created.profile);await server.close();
  server=await createGameServer({storage:await openStorage({DATA_DIR:folder})});
  try{const logged=await server.accounts.login({nickname:'persistenthero',password:'persistent-test-password'},'new-browser');assert.equal(logged.profile.id,id);assert.equal(logged.profile.state.coins,372);assert.equal(logged.profile.state.level,77);}finally{await server.close();}
});
test('remote save recovers profiles after local filesystem is replaced',async t=>{
  const fixture=await require('./redis-fixture')(t),remote=fixture.env;
  let storage=await openStorage({...remote,DATA_DIR:temporary(t)});await storage.claim('hero');storage.db.set('profiles',{hero:{state:{level:231,inventory:[{name:'Diamante'}]}}}).set('accounts',{test:{profileId:'hero',password:{hash:'test-only-hash'}}}).write();assert.equal(await storage.flush(),true);await storage.release('hero');storage.close();
  storage=await openStorage({...remote,DATA_DIR:temporary(t)});assert.equal(storage.db.get(['profiles','hero','state','level']).value(),231);assert.equal(storage.db.get(['profiles','hero','state','inventory',0,'name']).value(),'Diamante');assert.equal(storage.db.get(['accounts','test','profileId']).value(),'hero');storage.close();
});
