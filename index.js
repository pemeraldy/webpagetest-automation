
const fs = require('fs');
const pdf = require('html-pdf-node');

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

const puppeteer = require('puppeteer');

run()

async function run() {
  const [url] = process.argv.slice(2)
  if (!url) {
    console.log(`Please type a url to audit.`)
    process.exit(1)
  } else {
    await audit(url)
    await generatePDF(url)
  }
}



function getFileName(url) {
  const { pathname, host } = new URL(url)
  let fileName = `lhreport-${host}${pathname ? '-' + pathname.replace('/', '') : ''}`;
  return fileName
}


async function audit(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = { logLevel: 'info', output: 'html', onlyCategories: ['performance'], port: chrome.port };
  const runnerResult = await lighthouse(url, options);

  const reportHtml = runnerResult.report;
  fs.writeFileSync(`${getFileName(url)}.html`, reportHtml, { encoding: 'utf-8' });
  console.log('Report is done for', runnerResult.lhr.finalUrl);
  console.log('Performance score was', runnerResult.lhr.categories.performance.score * 100);

  await chrome.kill();

}

async function generatePDF(url) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  const fileName = getFileName(url)
  const html = fs.readFileSync(`${fileName}.html`, 'utf-8');

  await page.setContent(html, {
    waitNetworkIdle: true,
    waitLoad: true,
    waitUntil: 'domcontentloaded'
  });
  await page.emulateMediaType('screen');
  await page.screenshot({ path: `./${fileName}.png`, fullPage: true });
  await browser.close();
}