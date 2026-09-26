// Run with PLAYWRIGHT_PATH=/path/to/playwright/index.mjs node tests/browser.mjs
import assert from "node:assert/strict";
import {mkdtemp} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import http from "node:http";
const {chromium}=await import(process.env.PLAYWRIGHT_PATH || "playwright");
const extensionDir=path.resolve(import.meta.dirname,"..");
const profile=await mkdtemp(path.join(tmpdir(),"titan-browser-test-"));
const server=http.createServer((_req,res)=>{res.setHeader("Content-Type","text/html");res.end('<!doctype html><title>Titan fixture</title><body><h1>Titan test page</h1><a href="/destination">Destination link</a><input aria-label="Typing test"><div style="height:4000px">Long page</div></body>');});
await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve);});
const base=`http://127.0.0.1:${server.address().port}`;let context;
try {
  context=await chromium.launchPersistentContext(profile,{executablePath:process.env.CHROMIUM_PATH || "/usr/lib/chromium/chromium",headless:true,args:[`--disable-extensions-except=${extensionDir}`,`--load-extension=${extensionDir}`,"--no-sandbox"]});
  context.setDefaultTimeout(10000);const errors=[];context.on("page",p=>p.on("pageerror",e=>errors.push(e.message)));
  const worker=context.serviceWorkers()[0] || await context.waitForEvent("serviceworker");const extensionId=new URL(worker.url()).host;
  const page=await context.newPage();await page.goto(`chrome-extension://${extensionId}/settings.html`);await page.waitForTimeout(300);
  await page.evaluate(async base=>{await chrome.storage.local.set({config:{version:1,pins:[{id:"fixture-pin",name:"Fixture pin",url:`${base}/pinned`,folder:""}],folders:[],shortcuts:`fixture: ${base}/shortcut Fixture shortcut\ng!: ${base}/bang Google`,navigation:{keyMappings:"",smoothScroll:true,linkHintCharacters:"sadfjklewcmpgh"},settings:{vim:true,newTab:true,scrollStep:100}}});await chrome.history.addUrl({url:`${base}/old-history`});await chrome.bookmarks.create({title:"Fixture bookmark",url:`${base}/bookmarked`});},base);
  await page.goto(base);await page.waitForTimeout(500);
  await page.keyboard.press("j",{delay:80});await page.waitForFunction(()=>scrollY>0);await page.keyboard.press("g");await page.keyboard.press("g");await page.waitForTimeout(400);
  const field=page.getByRole("textbox",{name:"Typing test"});await field.focus();await page.keyboard.press("Shift+T");
  const vomnibar=page.frameLocator("iframe.vimium-ui-component-visible"),input=vomnibar.locator("#vomnibar input");await input.waitFor();await page.keyboard.type("/fixture");await vomnibar.locator("li").filter({hasText:"Fixture shortcut"}).waitFor();await page.keyboard.press("Escape");await page.locator("iframe.vimium-ui-component-visible").waitFor({state:"hidden"});
  await page.keyboard.press("Shift+T");const results=vomnibar.locator("li");await input.waitFor();await results.filter({hasText:"Fixture pin"}).waitFor();assert.doesNotMatch((await results.allTextContents()).join("\n"),/old-history|history/);await input.fill("old-history");await results.filter({hasText:"old-history"}).waitFor();await page.keyboard.press("Escape");
  await field.focus();await page.keyboard.type("abc");assert.equal(await field.inputValue(),"");await page.keyboard.press("i");await page.keyboard.type("hello");assert.equal(await field.inputValue(),"hello");await page.keyboard.press("Escape");
  await page.getByRole("heading").click();await page.keyboard.press("f");await page.locator(".vimiumHintMarker").first().waitFor();const hint=await page.locator(".vimiumHintMarker").first().innerText();await page.keyboard.type(hint.toLowerCase());await page.waitForURL(`${base}/destination`);await page.waitForTimeout(500);const pinPage=context.waitForEvent("page");await page.keyboard.press("!");await (await pinPage).waitForURL(`${base}/pinned`);assert.deepEqual(errors,[]);
  console.log("PASS: native Vimium Vomnibar UI, Titan pins/slash shortcuts, history-on-type, Vim normal/insert modes, link hints and numbered pins.");console.log(`Isolated test profile: ${profile}`);
} finally {await context?.close();server.close();}
