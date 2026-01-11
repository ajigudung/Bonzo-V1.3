import React, { useState } from 'react';

interface PromptItem {
  label: string;
  prompt: string;
}

interface PromptCategory {
  title: string;
  icon?: string;
  items?: PromptItem[];
}

interface SidebarProps {
  categories: Record<string, PromptCategory>;
  collapsed?: boolean;
  activePromptLabel?: string;
  isCustomPrompt?: boolean;
  isPhotoProduct?: boolean;
  onToggle?: () => void;
  onSelectPrompt: (categoryKey: string, label: string, prompt: string) => void;
  onSelectCustomPrompt?: () => void;
  onSelectPhotoProduct?: () => void;
}

export default function Sidebar({
  categories,
  collapsed = false,
  activePromptLabel,
  isCustomPrompt,
  isPhotoProduct,
  onToggle,
  onSelectPrompt,
  onSelectCustomPrompt,
  onSelectPhotoProduct,
}: SidebarProps) {
  // 🔥 SINGLE OPEN CATEGORY (ACCORDION)
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const handleToggleCategory = (key: string) => {
    setOpenCategory(prev => (prev === key ? null : key));
  };

  return (
    <aside className="w-64 bg-dark-card border-r border-dark-border flex flex-col">
      {/* ===== HEADER ===== */}
      <div className="text-4xl font-black tracking-tighter text-white flex items-center gap-2">
        <div className="bg-emerald-500 text-black px-2 rounded font-roboto"> BONZO
        </div>
        <div className=className="text-cyan-400 text-sm font-normal"> Version 1 . 3
        </div>
      </div>

      {/* ===== MENU ===== */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(categories).map(([key, category]) => {
          const isOpen = openCategory === key;

          return (
            <div key={key} className="border-b border-dark-border">
              {/* CATEGORY BUTTON */}
              <button
                onClick={() => handleToggleCategory(key)}
                className={`w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-dark-bg transition ${
                  isOpen ? 'bg-dark-bg' : ''
                }`}
              >
                {category.icon && <span>{category.icon}</span>}
                <span className="font-semibold">{category.title}</span>
                <span className="ml-auto text-xs">
                  {isOpen ? '▾' : '▸'}
                </span>
              </button>

              {/* SUB MENU */}
              {isOpen && category.items && (
                <div className="pl-6 pr-2 pb-2 space-y-1">
                  {category.items.map(item => {
                    const isActive = activePromptLabel === item.label;

                    return (
                      <button
                        key={item.label}
                        onClick={() =>
                          onSelectPrompt(key, item.label, item.prompt)
                        }
                        className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                          isActive
                            ? 'bg-blue-600 text-white'
                            : 'hover:bg-dark-bg text-gray-300'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* ===== MODE BUTTONS ===== */}
        {(onSelectPhotoProduct || onSelectCustomPrompt) && (
          <div className="border-t border-dark-border mt-2">
            {onSelectCustomPrompt && (
              <button
                onClick={onSelectCustomPrompt}
                className={`w-full px-4 py-3 text-left font-semibold transition ${
                  isCustomPrompt ? 'bg-blue-600 text-white' : 'hover:bg-dark-bg'
                }`}
              >
                ✍️ Custom Prompt
              </button>
            )}
            {onSelectPhotoProduct && (
              <button
                onClick={onSelectPhotoProduct}
                className={`w-full px-4 py-3 text-left font-semibold transition ${
                  isPhotoProduct ? 'bg-blue-600 text-white' : 'hover:bg-dark-bg'
                }`}
              >
                📦 Photo Product
              </button>
            )}





          </div>
        )}
      </div>

      {/* ===== COLLAPSE BUTTON (OPTIONAL) ===== */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="p-3 border-t border-dark-border hover:bg-dark-bg text-sm"
        >
          Collapse
        </button>
      )}
    </aside>
  );
}
