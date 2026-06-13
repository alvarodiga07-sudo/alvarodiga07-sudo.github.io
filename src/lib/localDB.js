// Local database using localStorage — drop-in replacement for Base44 SDK

const P = 'waddle_';

function getId() {
  return crypto.randomUUID();
}

function getStore(name) {
  try {
    return JSON.parse(localStorage.getItem(P + name) || '[]');
  } catch {
    return [];
  }
}

function setStore(name, data) {
  try {
    localStorage.setItem(P + name, JSON.stringify(data));
  } catch (e) {
    // localStorage quota exceeded — not much we can do
    console.warn('LocalStorage full:', e);
  }
}

// Compress + resize an image File to a JPEG data-URI
async function compressImage(file, maxWidth = 1400, quality = 0.82) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Generic entity factory
function makeEntity(storeName) {
  return {
    list: (sortKey) => {
      let items = getStore(storeName);
      if (sortKey) {
        const desc = sortKey.startsWith('-');
        const key = desc ? sortKey.slice(1) : sortKey;
        items = [...items].sort((a, b) => {
          const av = a[key] ?? '';
          const bv = b[key] ?? '';
          if (av < bv) return desc ? 1 : -1;
          if (av > bv) return desc ? -1 : 1;
          return 0;
        });
      }
      return Promise.resolve(items);
    },

    filter: (query) => {
      const items = getStore(storeName);
      return Promise.resolve(
        items.filter(item =>
          Object.entries(query).every(([k, v]) => item[k] === v)
        )
      );
    },

    create: (data) => {
      const items = getStore(storeName);
      const newItem = {
        id: getId(),
        created_date: new Date().toISOString(),
        ...data,
      };
      items.push(newItem);
      setStore(storeName, items);
      return Promise.resolve(newItem);
    },

    update: (id, data) => {
      const items = getStore(storeName);
      const idx = items.findIndex(i => i.id === id);
      if (idx === -1) return Promise.reject(new Error('Not found'));
      items[idx] = { ...items[idx], ...data };
      setStore(storeName, items);
      return Promise.resolve(items[idx]);
    },

    delete: (id) => {
      const items = getStore(storeName);
      setStore(storeName, items.filter(i => i.id !== id));
      return Promise.resolve();
    },
  };
}

// Auth helpers
const authStore = {
  me: () => {
    const raw = localStorage.getItem(P + 'user');
    if (!raw) {
      // First visit — return a blank profile so onboarding fires
      return Promise.resolve({ onboarding_complete: false });
    }
    return Promise.resolve(JSON.parse(raw));
  },

  updateMe: (data) => {
    const raw = localStorage.getItem(P + 'user');
    const current = raw ? JSON.parse(raw) : {};
    const updated = { ...current, ...data };
    localStorage.setItem(P + 'user', JSON.stringify(updated));
    return Promise.resolve(updated);
  },

  logout: () => {
    localStorage.removeItem(P + 'user');
    window.location.href = '/';
  },
};

// File upload — compresses to data-URI stored in localStorage
const coreIntegration = {
  UploadFile: async ({ file }) => {
    const dataUrl = await compressImage(file);
    return { file_url: dataUrl };
  },
};

export const createLocalClient = () => ({
  auth: authStore,
  entities: {
    Trip:          makeEntity('trips'),
    PassportStamp: makeEntity('stamps'),
    TripPhoto:     makeEntity('tripPhotos'),
    Post:          makeEntity('posts'),
    Follow:        makeEntity('follows'),
    Notification:  makeEntity('notifications'),
  },
  integrations: {
    Core: coreIntegration,
  },
});
