import { Idea } from '@/lib/openai';

export default function IdeaCard({ idea }: { idea: Idea }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition border border-gray-100">
      <h3 className="text-2xl font-bold mb-2 text-gray-900">{idea.title}</h3>
      <p className="text-gray-600 mb-4 leading-relaxed">{idea.description}</p>
      <div className="flex justify-between items-center mb-4">
        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${idea.target_scale === 'SMB' ? 'bg-green-100 text-green-800' : idea.target_scale === 'Enterprise' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
          {idea.target_scale}
        </span>
        <span className="text-2xl font-bold text-green-600">{idea.feasibility_score}/10</span>
      </div>
      <ul className="mb-4 space-y-1">
        {idea.key_features.slice(0,3).map((f, i) => (
          <li key={i} className="flex items-center text-sm text-gray-700">
            • {f}
          </li>
        ))}
      </ul>
      <div className="text-xs text-gray-500 mb-4">Tech: {idea.tech_stack.join(', ')} | {idea.monetization}</div>
      <p className="text-sm italic text-gray-600 mb-4">{idea.novelty_rationale}</p>
      <div className="flex space-x-2">
        <button className="flex-1 bg-gray-100 px-4 py-2 rounded-lg text-sm hover:bg-gray-200">⭐ Rate</button>
        <button className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600">Export PDF</button>
      </div>
    </div>
  );
}
