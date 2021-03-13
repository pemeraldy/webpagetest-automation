
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
    process.exit(1);
  } else {
    try {
      await audit(url);
      await generatePDF(url);
    } catch (error) {
      console.log(error);
      process.exit(1);
      // await browser.close();
    }
  }
}



function getFileName(url) {
  const { pathname, host } = new URL(url)
  let fileName = `lhreport-${host}${pathname ? '-' + pathname.replace('/', '') : ''}`;
  return fileName
}


async function audit(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = { logLevel: 'info', output: 'html', onlyCategories: ['performance', 'accessibility', 'seo'], port: chrome.port };
  const runnerResult = await lighthouse(url, options);

  const reportHtml = runnerResult.report;
  fs.writeFileSync(`${getFileName(url).replace('/', '')}.html`, reportHtml, { encoding: 'utf-8' });
  console.log('Report is done for', runnerResult.lhr.finalUrl);
  console.log('Performance score was', runnerResult.lhr.categories.performance.score * 100);

  await chrome.kill();

}

async function generatePDF(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const fileName = getFileName(url)
  const html = fs.readFileSync(`${fileName}.html`, 'utf-8');

  await page.setContent(html, {
    waitNetworkIdle: true,
    waitLoad: true,
    waitUntil: 'domcontentloaded'
  });
  await page.$$eval('.lh-audit__header', headers => headers.forEach(header => header.click()))
  await page.emulateMediaType('screen');
  // await page.pdf({ path: `${fileName}.pdf` });
  await page.screenshot({ path: `./${fileName}.png`, fullPage: true });
  await browser.close();
}