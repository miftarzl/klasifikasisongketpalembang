import React from 'react';

export default function ExplorerList({ items = [], onEdit, onDelete }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(item => (
        <div key={item.id} className="rounded-lg border p-4 bg-white">
          <div className="h-44 w-full overflow-hidden rounded-md mb-3">
            <img src={item.thumbnail || '/images/placeholder.png'} alt={item.name} className="w-full h-full object-cover" />
          </div>
          <h3 className="font-semibold text-lg">{item.name}</h3>
          <p className="text-sm text-songket-text-secondary truncate mt-1">{item.origin || '-'}</p>
          <div className="mt-3 flex gap-2">
            <button onClick={() => onEdit(item)} className="btn btn-sm">Edit</button>
            <button onClick={() => onDelete(item)} className="btn btn-sm btn-danger">Hapus</button>
          </div>
        </div>
      ))}
    </div>
  );
}
