import React, { useEffect, useState } from 'react';
import supabase from '../lib/supabaseClient';

interface Item {
  id: number;
  name: string;
}

export default function TestFetch() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase.from<Item>('items').select('*');

      if (error) {
        setError(error.message);
      } else {
        setItems(data || []);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h2>Supabase Data</h2>
      <ul>
        {items.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
