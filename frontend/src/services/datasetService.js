import { api } from './api';

export async function fetchDatasetRecords() {
  const response = await api.get('/datasets');
  return response.data;
}

export async function fetchDatasets() {
  return fetchDatasetRecords();
}

export function groupSongketRecords(records = []) {
  const grouped = records.reduce((acc, item) => {
    const key = item.name || item.label || 'Unknown';
    acc[key] = acc[key] || [];
    acc[key].push(item);
    return acc;
  }, {});

  return Object.entries(grouped).map(([key, values]) => ({
    label: key,
    slug: key.toString().trim().toLowerCase().replace(/\s+/g, '-').replace(/^songket-/, ''),
    category: values[0]?.category || 'Uncategorized',
    origin: values[0]?.origin || null,
    summary: values[0]?.history ? `${values[0].history.split('. ')[0]}.` : '',
    gallery: values.map((item) => item.image_url).filter(Boolean),
    keywords: [
      values[0]?.category,
      values[0]?.origin,
      values[0]?.name,
      values[0]?.label,
    ]
      .filter(Boolean)
      .join(' ')
      .split(/\s+/),
    items: values,
    sample: values[0],
  }));
}
