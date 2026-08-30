'use client';

import { useState } from 'react';
import { IDEA_TEMPLATES, getAllCategories, getTemplatesByCategory } from '@/lib/templates';
import type { IdeaTemplate } from '@/lib/templates';

interface TemplateSelectorProps {
  onSelectTemplate: (template: IdeaTemplate) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function TemplateSelector({ onSelectTemplate, isOpen, onClose }: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const categories = ['All', ...getAllCategories()];
  const templates = selectedCategory === 'All' 
    ? IDEA_TEMPLATES 
    : getTemplatesByCategory(selectedCategory);
  
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose} 
        onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
        role="button"
        tabIndex={0}
        aria-label="Close template selector"
      />
      <div className="relative bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Idea Templates</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 border-2 border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              onClick={onClose}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none p-1"
              aria-label="Close template selector"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-6" role="tablist">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                role="tab"
                aria-selected={selectedCategory === category}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-500">
                <p className="text-xl mb-2">No templates found</p>
                <p>Try adjusting your search or category filter</p>
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={() => {
                    onSelectTemplate(template);
                    onClose();
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface TemplateCardProps {
  template: IdeaTemplate;
  onSelect: () => void;
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  return (
    <button
      onClick={onSelect}
      className="p-5 border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 hover:shadow-lg transition-all duration-200 group"
      style={{ cursor: 'pointer' }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl flex-shrink-0 group-hover:scale-105 transition-transform">
          {getCategoryIcon(template.category)}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors truncate">
            {template.name}
          </h3>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
            {template.category}
          </span>
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {template.description}
      </p>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>💡 {template.numIdeas} ideas</span>
        <span className="group-hover:text-purple-600 transition-colors">Click to use →</span>
      </div>
    </button>
  );
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Product & Startup': '🚀',
    'Marketing & Growth': '📈',
    'Productivity & Personal': '⚡',
    'Creative & Innovation': '💡',
    'Technology & Engineering': '⚙️',
    'Social Impact': '🌍',
    'All': '📋',
  };
  return icons[category] || '📋';
}