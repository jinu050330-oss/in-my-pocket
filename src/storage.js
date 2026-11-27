const openDatabase = () => new Promise((resolve, reject) => {
  const request = indexedDB.open('in-my-pocket-v0.1', 1);
  request.onupgradeneeded = () => request.result.createObjectStore('photos', {keyPath:'id'});
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

async function transact(mode, action) {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('photos', mode);
      const request = action(tx.objectStore('photos'));
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = () => reject(tx.error);
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export const readPhotos = () => transact('readonly', store => store.getAll());
export const savePhoto = photo => transact('readwrite', store => store.put(photo));
