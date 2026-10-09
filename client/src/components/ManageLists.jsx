import React, { useState, useMemo } from 'react';
import AddModalManageLists from './AddModalManageLists.jsx';
import EditModalManageLists from './EditModalManageLists.jsx';
import DeleteModalManageLists from './DeleteModalManageLists.jsx';

const INITIAL_DATA = {
  report_categories: [
    { id: 'rc-1', name: 'Electronics', status: 'active' },
    { id: 'rc-2', name: 'Bags & Wallets', status: 'active' },
    { id: 'rc-3', name: 'Keys & Accessories', status: 'active' },
    { id: 'rc-4', name: 'Books & Study Material', status: 'active' },
    { id: 'rc-5', name: 'Clothing & Apparel', status: 'active' },
    { id: 'rc-6', name: 'IDs & Campus Cards', status: 'active' },
    { id: 'rc-7', name: 'Others', status: 'active' },
  ],
  programs: [
    { id: 'pr-1', name: 'BS Computer Science', status: 'active' },
    { id: 'pr-2', name: 'BS Information Technology', status: 'active' },
    { id: 'pr-3', name: 'BS Business Administration', status: 'active' },
    { id: 'pr-4', name: 'BS Accountancy', status: 'active' },
    { id: 'pr-5', name: 'BA Psychology', status: 'active' },
  ],
  departments: [
    { id: 'dp-1', name: 'College of Information and Computing', status: 'active' },
    { id: 'dp-2', name: 'College of Business & Management', status: 'active' },
    { id: 'dp-3', name: 'College of Arts and Sciences', status: 'active' },
  ],
};

export default function ManageLists() {
  const [activeTab, setActiveTab] = useState('report_categories');
  const [listData, setListData] = useState(INITIAL_DATA);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Tab definitions
  const tabs = [
    {
      id: 'report_categories',
      label: 'Report Categories',
      icon: 'category',
      count: listData.report_categories.length,
    },
    {
      id: 'programs',
      label: 'Programs',
      icon: 'school',
      count: listData.programs.length,
    },
    {
      id: 'departments',
      label: 'Departments',
      icon: 'corporate_fare',
      count: listData.departments.length,
    },
  ];

  // Active items filtered by search
  const currentItems = listData[activeTab] || [];
  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return currentItems;
    return currentItems.filter((item) => item.name.toLowerCase().includes(q));
  }, [currentItems, searchQuery]);

  // Modal Handlers
  const handleSaveNewItem = (newItemData) => {
    const prefix = activeTab === 'report_categories' ? 'rc' : activeTab === 'programs' ? 'pr' : 'dp';
    const newItem = {
      id: `${prefix}-${Date.now()}`,
      name: newItemData.name,
      status: newItemData.status,
    };
    setListData((prev) => ({
      ...prev,
      [activeTab]: [newItem, ...prev[activeTab]],
    }));
  };

  const handleSaveEditItem = (updatedItem) => {
    setListData((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((item) =>
        item.id === updatedItem.id ? updatedItem : item
      ),
    }));
  };

  const handleConfirmDelete = (id) => {
    setListData((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].filter((item) => item.id !== id),
    }));
  };

  const getColumnLabel = (tabId) => {
    switch (tabId) {
      case 'report_categories':
        return 'Category Name';
      case 'programs':
        return 'Program Name';
      case 'departments':
        return 'Department Name';
      default:
        return 'Category Name';
    }
  };

  const getAddButtonLabel = (tabId) => {
    switch (tabId) {
      case 'report_categories':
        return 'Add Category';
      case 'programs':
        return 'Add Program';
      case 'departments':
        return 'Add Department';
      default:
        return 'Add Category';
    }
  };

  const activeTabMeta = tabs.find((t) => t.id === activeTab);

  return (
    <div className="max-w-[1340px] mx-auto flex flex-col gap-6 w-full">
      {/* Page Title & System Badge Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-[#23261F] font-headline-lg tracking-tight">
              Manage Lists
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#eff4ff] text-[#5170ff] border border-[#d3e4fe]">
              Admin System
            </span>
          </div>
          <p className="text-sm text-[#6E6858]">
            Configure and update dropdown options available across user report forms, registration, and profile selectors.
          </p>
        </div>
      </div>

      {/* Main Container: Tabs, Search & Table */}
      <div className="w-full flex flex-col gap-4">
        {/* Tabs Bar */}
        <div className="flex items-center justify-between border-b border-[#E8E4D8] pb-1">
          <div className="flex items-center gap-2 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                  }}
                  type="button"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium text-sm transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'font-semibold border-b-2 border-[#5170ff] text-[#5170ff] bg-white shadow-[0_-2px_6px_rgba(0,0,0,0.02)]'
                      : 'text-[#6E6858] hover:text-[#23261F] hover:bg-[#eff4ff]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${
                      isActive
                        ? 'font-bold bg-[#5170ff] text-white'
                        : 'font-medium bg-[#E8E4D8]/60 text-[#444655]'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Input & Add Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <div className="relative flex items-center flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-3 text-[18px] text-[#6E6858] pointer-events-none">
              search
            </span>
            <input
              className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#23261F] placeholder-[#6E6858]/60 focus:outline-none focus:border-[#5170ff] focus:ring-1 focus:ring-[#5170ff] shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              placeholder={`Filter ${activeTabMeta?.label.toLowerCase()}...`}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-[#6E6858] hover:text-[#23261F] text-xs font-semibold cursor-pointer"
                title="Clear filter"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5170ff] hover:bg-[#4767f6] text-white font-medium text-sm transition-colors shadow-sm shrink-0 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>{getAddButtonLabel(activeTab)}</span>
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-xl border border-[#E8E4D8] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white text-[#6E6858] text-xs uppercase font-semibold border-b border-[#E8E4D8]">
                <tr>
                  <th className="py-3 px-6">
                    {getColumnLabel(activeTab)}
                  </th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4D8] text-sm text-[#23261F]">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-[#6E6858]">
                      No items found matching "{searchQuery}".
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-[#eff4ff]/40 transition-colors"
                    >
                      <td className="py-3.5 px-6 font-semibold text-[#23261F]">
                        <span className="flex items-center gap-3">
                          {item.name}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        {item.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            className="p-1.5 rounded-lg hover:bg-[#e5eeff] text-[#444655] hover:text-[#23261F] transition-colors cursor-pointer"
                            title="Edit Option"
                            type="button"
                            onClick={() => {
                              setSelectedItem(item);
                              setIsEditModalOpen(true);
                            }}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              edit
                            </span>
                          </button>
                          <button
                            className="p-1.5 rounded-lg hover:bg-[#ffdad6] text-[#ba1a1a] transition-colors cursor-pointer"
                            title="Delete Option"
                            type="button"
                            onClick={() => {
                              setSelectedItem(item);
                              setIsDeleteModalOpen(true);
                            }}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              delete
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-3 px-6 bg-[#eff4ff]/50 border-t border-[#E8E4D8] flex items-center text-xs text-[#6E6858] justify-end">
            <div>
              Showing {filteredItems.length} item{filteredItems.length === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Popups for Currently Selected Sub-tab */}
      <AddModalManageLists
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleSaveNewItem}
        activeTab={activeTab}
      />

      <EditModalManageLists
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedItem(null);
        }}
        onSave={handleSaveEditItem}
        item={selectedItem}
        activeTab={activeTab}
      />

      <DeleteModalManageLists
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedItem(null);
        }}
        onConfirm={handleConfirmDelete}
        item={selectedItem}
        activeTab={activeTab}
      />
    </div>
  );
}

export { ManageLists };
