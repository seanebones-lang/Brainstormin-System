import { useState } from 'react';

type Props = {
  onSubmit: (formData: FormData) => void;
  loading: boolean;
};

export default function GenerateForm({ onSubmit, loading }: Props) {
  const [keywords, setKeywords] = useState('');
  const [category, setCategory] = useState('E-commerce');
  const [scale, setScale] = useState('SMB');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('keywords', keywords);
    formData.append('category', category);
    formData.append('scale', scale);
    onSubmit(formData);
  };

  const categories = ['Productivity', 'E-commerce', /* ... full 10 */ 'Sustainability'];

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl">
      <div className="space-y-4">
        <input
          type="text"
          placeholder="e.g., AI for retail"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          className="w-full p-4 border border-gray-300 rounded-xl text-xl"
          required
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-4 border rounded-xl">
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={scale} onChange={(e) => setScale(e.target.value)} className="w-full p-4 border rounded-xl">
          <option>SMB</option>
          <option>Enterprise</option>
          <option>Insider</option>
        </select>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-xl font-bold text-xl hover:from-blue-600 transition disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Ideas'}
        </button>
      </div>
    </form>
  );
}
