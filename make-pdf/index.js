/* note / AI warning: all code below is 
   unchecked output from GPT-5-mini; it works
   and does the thing (take screenshots from a HTML slide 
   deck) and create a PDF from it 
   
   USAGE:
   
   node make-pdf [url for the slide deck]
    
   this creates a folder in the slide decks folders
   called 'exported slides' with PNGs and a PDF
   with all slides as individual pages
   */

// capture-slides-to-pdf.js
   const puppeteer = require('puppeteer');
   const fs = require('fs');
   const path = require('path');
   const { PDFDocument } = require('pdf-lib');
   
   function lastPathSegmentName(urlStr) {
     try {
       const u = new URL(urlStr);
       let seg = u.pathname.split('/').filter(Boolean).pop() || 'output';
       seg = seg.replace(/\.[^/.]+$/, '');
       return seg || 'output';
     } catch (e) {
       let seg = urlStr.split(/[\\/]/).filter(Boolean).pop() || 'output';
       seg = seg.split('?')[0].split('#')[0].replace(/\.[^/.]+$/, '');
       return seg || 'output';
     }
   }
   
   (async () => {
     const url = process.argv[2] || 'file:///path/to/presentation.html';
     const OUT_PREFIX = 'slide-';
     const SCALE = 4;
   
     const baseDirName = lastPathSegmentName(url);
     const baseDir = path.resolve(process.cwd(), baseDirName);
     const outDir = path.join(baseDir, 'exported slides');
     if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
   
     const OUT_PDF = path.join(outDir, 'slides.pdf');
   
     const browser = await puppeteer.launch({ headless: true });
     const page = await browser.newPage();
     await page.goto(url, { waitUntil: 'networkidle2' });
   
     // remove unwanted UI elements before capturing
     await page.evaluate(() => {
       const removeAll = selector => {
         document.querySelectorAll(selector).forEach(el => el.remove());
       };
       removeAll('.b6-ui');
       removeAll('.clock');
     });
   
     // wait for fonts/images/animations to settle
     await page.evaluate(async () => {
       await document.fonts.ready;
       await Promise.all(Array.from(document.images || []).map(img => {
         if (img.complete) return Promise.resolve();
         return new Promise(res => { img.onload = img.onerror = res; });
       }));
       await new Promise(r => setTimeout(r, 200));
     });
   
     const boxes = await page.$$eval('.slide', els => {
       return els.map(el => {
         const r = el.getBoundingClientRect();
         return {
           x: r.left + window.scrollX,
           y: r.top + window.scrollY,
           width: r.width,
           height: r.height,
           area: r.width * r.height,
           visible: r.width > 1 && r.height > 1
         };
       });
     });
   
     const filtered = boxes
       .filter(b => b.visible && b.area > 1000 && isFinite(b.x) && isFinite(b.y))
       .sort((a,b) => (a.y - b.y) || (a.x - b.x));
   
     if (filtered.length === 0) {
       console.error('No valid .slide elements found.');
       await browser.close();
       process.exit(1);
     }
   
     let idx = 0;
     const savedFiles = [];
   
     for (const b of filtered) {
       const clip = {
         x: Math.round(b.x),
         y: Math.round(b.y),
         width: Math.max(1, Math.round(b.width)),
         height: Math.max(1, Math.round(b.height))
       };
   
       await page.setViewport({
         width: clip.width,
         height: clip.height,
         deviceScaleFactor: SCALE
       });
   
       const buf = await page.screenshot({
         clip,
         omitBackground: false,
         type: 'png'
       });
   
       const name = `${OUT_PREFIX}${String(idx).padStart(3, '0')}.png`;
       const fullPath = path.join(outDir, name);
       fs.writeFileSync(fullPath, buf);
       savedFiles.push(fullPath);
       console.log('Saved', fullPath, `(${clip.width}x${clip.height} @${SCALE}x)`);
       idx++;
     }
   
     await browser.close();
   
     const pdfDoc = await PDFDocument.create();
     for (const filePath of savedFiles) {
       const imgBytes = fs.readFileSync(filePath);
       const pngImage = await pdfDoc.embedPng(imgBytes);
       const px = pngImage.width;
       const py = pngImage.height;
       const page = pdfDoc.addPage([px, py]);
       page.drawImage(pngImage, { x: 0, y: 0, width: px, height: py });
     }
   
     const pdfBytes = await pdfDoc.save();
     fs.writeFileSync(OUT_PDF, pdfBytes);
     console.log('Saved PDF:', OUT_PDF);
     console.log('All exports are in:', outDir);
   })();
