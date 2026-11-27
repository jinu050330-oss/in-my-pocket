async function imageForModel(file) {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
    if (scale === 1) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Image conversion failed')), 'image/png');
    });
  } finally {
    bitmap.close();
  }
}

const modelUrl = 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/';
let initializationAttempt = 0;
let progressUpdate = () => {};
let pending = Promise.resolve();

export function removeBackground(file, progress) {
  const job = pending.then(async () => {
    progressUpdate = progress;
    try {
      return await segmentFile(file);
    } finally {
      progressUpdate = () => {};
    }
  });
  pending = job.catch(() => {});
  return job;
}

async function segmentFile(file) {
  const input = await imageForModel(file);
  const {preload, removeBackground: segment} = await import('@imgly/background-removal');
  const config = {
    // IMG.LY caches failed initialization promises by config. A fragment changes the cache key while keeping asset URLs the same.
    publicPath: initializationAttempt ? `${modelUrl}#retry-${initializationAttempt}` : modelUrl,
    model:'isnet_quint8',
    device:'cpu',
    output:{format:'image/png'},
    progress(key, current, total) {
      progressUpdate(key.startsWith('fetch:') && current < total
        ? `처리 모델 준비 중 · ${Math.floor(100 * current / total)}%`
        : '배경 제거 중…');
    }
  };
  try {
    await preload(config);
  } catch (error) {
    initializationAttempt++;
    throw error;
  }
  const png = await segment(input, config);
  const bitmap = await createImageBitmap(png, {resizeWidth:128, resizeHeight:128});
  try {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const context = canvas.getContext('2d', {willReadFrequently:true});
    context.drawImage(bitmap, 0, 0);
    const {data} = context.getImageData(0,0,128,128);
    let clear = false, visible = false;
    for (let index = 3; index < data.length; index += 4) {
      clear ||= data[index] === 0;
      visible ||= data[index] > 0;
    }
    if (png.type !== 'image/png' || !clear || !visible) throw new Error('Invalid foreground mask');
    return png;
  } finally {
    bitmap.close();
  }
}
