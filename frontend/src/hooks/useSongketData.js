import { useEffect, useMemo, useState, useCallback } from 'react';
import { explorerApi } from '../services/explorerApi';
import { songketDataList } from '../data/songketData';
import { getSongketGallery, getSongketHeroImage } from '../data/songketImages';
import { useDataRefresh } from '../context/DataRefreshContext';

const normalizeKey = (value) => {
  if (!value) return '';
  return value.toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, '-');
};

const normalizeExplorerText = (value) => (value ?? '').toString().trim();

const isVisibleExplorerRecord = (record) => {
  if (!record) return false;
  const name = normalizeExplorerText(record.name).toLowerCase();
  const category = normalizeExplorerText(record.category).toLowerCase();
  const thumbnail = normalizeExplorerText(record.thumbnail);
  const description = normalizeExplorerText(record.gallery_description || record.description || record.summary || record.history || record.philosophy || record.usage).toLowerCase();

  const containsRejectedToken = ['e2e', 'test', 'dummy', 'sample', 'placeholder'].some((token) => name.includes(token));
  const hasEmptyThumbnail = !thumbnail || thumbnail === 'null' || thumbnail === 'undefined';
  const hasInvalidCategory = category === 'uncategorized' || category === 'unclassified';
  const hasPlaceholderDescription = description === '' || description === 'deskripsi singkat belum tersedia.' || description === 'deskripsi belum tersedia';

  if (!record.published) return false;
  if (containsRejectedToken || hasEmptyThumbnail || hasInvalidCategory || hasPlaceholderDescription) return false;
  return true;
};

const findStaticMatch = (record) => {
  const candidates = [record?.slug, record?.name, record?.label, record?.title, record?.sample?.slug, record?.sample?.name]
    .filter(Boolean)
    .map((value) => value.toString().trim());

  for (const candidate of candidates) {
    const normalized = normalizeKey(candidate);
    const match = songketDataList.find((item) => normalizeKey(item.slug) === normalized || normalizeKey(item.name) === normalized);
    if (match) return match;
  }

  return null;
};

export default function useSongketData() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { refreshVersion } = useDataRefresh();

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await explorerApi.list();
      const visibleRecords = Array.isArray(data) ? data.filter(isVisibleExplorerRecord) : [];
      setRecords(visibleRecords);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords, refreshVersion]);

  const grouped = useMemo(() => {
    return records.map((record) => {
      const match = findStaticMatch(record);
      const label = match?.name || record?.name || record?.label || 'Songket';
      const slug = match?.slug || record?.slug || normalizeKey(label);
      const summary = match?.summary || record?.summary || (typeof record?.history === 'string' ? `${record.history.split('. ')[0]}.` : record?.gallery_description || '');

      return {
        ...record,
        id: record?.id || record?.slug || slug,
        label,
        name: label,
        slug,
        category: match?.category || record?.category || 'Uncategorized',
        origin: match?.origin || record?.origin || null,
        summary,
        history: match?.history_id || record?.history || record?.history_id || null,
        history_id: match?.history_id || record?.history_id || record?.history || null,
        philosophy: match?.philosophy || record?.philosophy || null,
        characteristic: match?.characteristics_id || record?.characteristics_id || record?.characteristics || null,
        characteristics_id: match?.characteristics_id || record?.characteristics_id || record?.characteristics || null,
        usage: match?.usage_id || record?.usage || record?.usage_id || null,
        usage_id: match?.usage_id || record?.usage_id || record?.usage || null,
        usage_en: match?.usage_en || record?.usage_en || null,
        gallery: match?.gallery || record?.gallery || getSongketGallery(slug),
        image_url: match?.image || record?.image || record?.thumbnail || record?.image_url || getSongketHeroImage(slug),
        image: match?.image || record?.image || record?.thumbnail || record?.image_url || getSongketHeroImage(slug),
        keywords: match?.keywords?.length ? match.keywords : [record?.category, record?.origin, label].filter(Boolean),
        popularityBadge: match?.popularityBadge || record?.popularityBadge || 'Terkenal',
        sample: { ...record, ...(match || {}) },
      };
    });
  }, [records]);

  const categories = useMemo(() => {
    const categorySet = new Set();
    grouped.forEach((item) => categorySet.add(item.category || 'Uncategorized'));
    return ['All', ...Array.from(categorySet)];
  }, [grouped]);

  return {
    records,
    grouped,
    categories,
    loading,
    error,
    refresh: loadRecords,
  };
}
