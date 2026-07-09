const assetModules = import.meta.glob('../assets/img-songket/**/*.{png,jpg,jpeg,svg}', { eager: true, query: '?url', import: 'default' });
const rootModules = import.meta.glob('../../../img songket/**/*.{png,jpg,jpeg,svg}', { eager: true, query: '?url', import: 'default' });
const imageModules = { ...assetModules, ...rootModules };

const normalizeFolderName = (folderName) => {
  if (!folderName) return '';
  return folderName
    .toString()
    .trim()
    .toLowerCase()
    .replace(/^songket[\s-]*/i, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const normalizePath = (path) => path.replace(/\\/g, '/');

const imageMap = {};

for (const rawPath in imageModules) {
  const normalizedPath = normalizePath(rawPath);
  const url = imageModules[rawPath];
  
  if (!url) continue;
  
  // Try multiple patterns to match folder names
  let folderName = null;
  let match = normalizedPath.match(/img-songket\/([^/]+)\//i);
  if (match) {
    folderName = match[1];
  } else {
    match = normalizedPath.match(/img\s+songket\/([^/]+)\//i);
    if (match) folderName = match[1];
  }
  
  if (!folderName) continue;

  const slug = normalizeFolderName(folderName);
  if (!slug) continue;

  if (!imageMap[slug]) {
    imageMap[slug] = [];
  }
  imageMap[slug].push(url);
}

// Sort images by filename numerically within each slug
Object.values(imageMap).forEach((images) => {
  images.sort((a, b) => {
    const aName = a.split('/').pop() || '';
    const bName = b.split('/').pop() || '';
    return aName.localeCompare(bName, undefined, { numeric: true, sensitivity: 'base' });
  });
});

export const getSongketGallery = (slug) => {
  if (!slug) return [];
  const normalizedSlug = normalizeFolderName(slug);
  return imageMap[normalizedSlug] ? [...imageMap[normalizedSlug]] : [];
};

export const getSongketHeroImage = (slug) => {
  const gallery = getSongketGallery(slug);
  return gallery.length ? gallery[0] : `/images/songket/${normalizeFolderName(slug)}.svg`;
};
