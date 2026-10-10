import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import ts from 'typescript';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const path = new URL('../src/services/qrAssist.ts', import.meta.url);
assert.ok(existsSync(path), 'QR detection/crop helper must exist');
const source = readFileSync(path, 'utf8').replace("from 'qr-scanner'", `from '${new URL('../node_modules/qr-scanner/qr-scanner.min.js', import.meta.url).href}'`);
// Execute the installed qr-scanner worker's actual decoder, not a substitute.
const { runInNewContext } = await import('node:vm');
const workerSource = readFileSync(new URL('../node_modules/qr-scanner/qr-scanner-worker.min.js', import.meta.url), 'utf8');
let workerCode;
runInNewContext(workerSource.replace('export const', 'const') + '; createWorker();', {
  Worker: function () {}, URL: { createObjectURL: blob => { workerCode = blob.parts.join(''); return ''; } },
  Blob: class { constructor(parts) { this.parts = parts; } },
});
let decoded;
const self = { postMessage: result => { decoded = result.data; } };
runInNewContext(workerCode, { self, Uint8ClampedArray, Uint8Array, Int32Array, Float64Array });
function decodeCrop(image, bounds) {
  const crop = image.roi(new cv.Rect(bounds.x, bounds.y, bounds.width, bounds.height));
  const enlarged = new cv.Mat();
  try {
    cv.resize(crop, enlarged, new cv.Size(bounds.width * 3, bounds.height * 3), 0, 0, cv.INTER_NEAREST);
    self.onmessage({ data: { id: 1, type: 'decode', data: { data: new Uint8ClampedArray(enlarged.data), width: enlarged.cols, height: enlarged.rows } } });
    return decoded;
  } finally { crop.delete(); enlarged.delete(); }
}
const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { detectQrBounds, nextAutoZoom } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const cv = require('@techstark/opencv-js');
await new Promise(resolve => cv.Mat ? resolve() : cv.then(() => resolve()));
const qr = require('qr.js')('QR-assist-fixture', { errorCorrectLevel: 2 });
const size = 480;
function fixture(moduleSize = 5) {
  const image = new cv.Mat(size, size, cv.CV_8UC4, new cv.Scalar(255, 255, 255, 255));
  const origin = Math.floor((size - qr.moduleCount * moduleSize) / 2);
  for (let r = 0; r < qr.moduleCount; r++) for (let c = 0; c < qr.moduleCount; c++) {
    if (qr.isDark(r, c)) cv.rectangle(image, new cv.Point(origin + c * moduleSize, origin + r * moduleSize), new cv.Point(origin + (c + 1) * moduleSize - 1, origin + (r + 1) * moduleSize - 1), new cv.Scalar(0, 0, 0, 255), -1);
  }
  return image;
}
const detector = new cv.QRCodeDetector();
try {
  const blank = new cv.Mat(size, size, cv.CV_8UC4, new cv.Scalar(255, 255, 255, 255));
  assert.equal(detectQrBounds(cv, detector, blank), null); blank.delete();
  for (const moduleSize of [5, 2]) {
    const image = fixture(moduleSize);
    const bounds = detectQrBounds(cv, detector, image);
    if (moduleSize === 2) {
      assert.equal(bounds, null, 'tiny QR below detector limit falls back to normal scanner');
      console.log('real OpenCV QR module=2: not detected (resolution limit)');
      image.delete(); continue;
    }
    assert.ok(bounds, `detect QR at module size ${moduleSize}`);
    assert.ok(bounds.x >= 0 && bounds.y >= 0 && bounds.x + bounds.width <= size && bounds.y + bounds.height <= size);
    assert.equal(decodeCrop(image, bounds), 'QR-assist-fixture');
    console.log(`real OpenCV QR module=${moduleSize}: detected, crop=${bounds.width}x${bounds.height}, qr-scanner decoded`);
    image.delete();
  }
  const blurred = fixture();
  cv.GaussianBlur(blurred, blurred, new cv.Size(3, 3), 0);
  const blurBounds = detectQrBounds(cv, detector, blurred);
  assert.ok(blurBounds);
  assert.equal(decodeCrop(blurred, blurBounds), 'QR-assist-fixture'); blurred.delete();
  console.log('real OpenCV mild blur: detected, qr-scanner decoded');
  const occluded = fixture();
  cv.rectangle(occluded, new cv.Point(160, 160), new cv.Point(230, 230), new cv.Scalar(255, 255, 255, 255), -1);
  const occludedBounds = detectQrBounds(cv, detector, occluded);
  console.log(`real OpenCV finder occlusion: ${occludedBounds ? 'detected' : 'not detected (expected limitation)'}`);
  occluded.delete();
  assert.equal(nextAutoZoom(1, { min: 1, max: 3, step: 0.1 }, 0.1), 1.4);
  assert.equal(nextAutoZoom(2.9, { min: 1, max: 3, step: 0.1 }, 0.1), 3);
  assert.equal(nextAutoZoom(2, { min: 1, max: 3, step: 0.1 }, 0.5), null);
  assert.equal(nextAutoZoom(1, null, 0.1), null);
  assert.equal(nextAutoZoom(1, { min: 1, max: 3 }, NaN), null);
  console.log('QR bounds, blank fallback, hardware clamp: PASS');
} finally { detector.delete(); }
