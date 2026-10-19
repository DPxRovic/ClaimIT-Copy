import React, { useState, useMemo, useEffect } from 'react';
import AddModalManageLists from './AddModalManageLists.jsx';
import EditModalManageLists from './EditModalManageLists.jsx';
import DeleteModalManageLists from './DeleteModalManageLists.jsx';
import {
  subscribeTaxonomies,
  addTaxonomyItem,
  updateTaxonomyItem,
  deleteTaxonomyItem,
} from '../firebase/admin.js';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Subscribe to real taxonomy items in Firestore for each taxonomy type
  useEffect(() => {
    const unsubscribe = subscribeTaxonomies(
      activeTab,
      (firestoreItems) => {
        if (firestoreItems && firestoreItems.length > 0) {
          setListData((prev) => ({
            ...prev,
            [activeTab]: firestoreItems,
          }));
        }
      },
      (err) => {
        console.warn(`Taxonomy subscription warning for ${activeTab}:`, err);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [activeTab]);

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
  const handleSaveNewItem = async (newItemData) => {
    setIsProcessing(true);
    try {
      const added = await addTaxonomyItem(activeTab, {
        name: newItemData.name,
        status: newItemData.status,
      });

      setListData((prev) => ({
        ...prev,
        [activeTab]: [added, ...prev[activeTab]],
      }));

      setIsAddModalOpen(false);
      setFeedbackMessage(`Added "${newItemData.name}" successfully.`);
      setTimeout(() => setFeedbackMessage(null), 3500);
    } catch (err) {
      console.error('Failed to add taxonomy item:', err);
      alert('Failed to add item: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveEditItem = async (updatedItem) => {
    setIsProcessing(true);
    try {
      await updateTaxonomyItem(activeTab, updatedItem.id, {
        name: updatedItem.name,
        status: updatedItem.status,
      });

      setListData((prev) => ({
        ...prev,
        [activeTab]: prev[activeTab].map((item) =>
          item.id === updatedItem.id ? updatedItem : item
        ),
      }));

      setIsEditModalOpen(false);
      setSelectedItem(null);
      setFeedbackMessage(`Updated "${updatedItem.name}" successfully.`);
      setTimeout(() => setFeedbackMessage(null), 3500);
    } catch (err) {
      console.error('Failed to update taxonomy item:', err);
      alert('Failed to update item: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDelete = async (id) => {
    setIsProcessing(true);
    try {
      await deleteTaxonomyItem(activeTab, id);

      setListData((prev) => ({
        ...prev,
        [activeTab]: prev[activeTab].filter((item) => item.id !== id),
      }));

      setIsDeleteModalOpen(false);
      setSelectedItem(null);
      setFeedbackMessage('Item deleted.');
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err) {
      console.error('Failed to delete taxonomy item:', err);
      alert('Failed to delete item: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
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
        return 'Add Item';
    }
  };

  const getItemTypeSingular = (tabId) => {
    switch (tabId) {
      case 'report_categories':
        return 'category';
      case 'programs':
        return 'program';
      case 'departments':
        return 'department';
      default:
        return 'item';
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1340px] mx-auto">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#0f172a] text-white px-5 py-3 rounded-xl shadow-xl text-sm font-medium flex items-center gap-2 border border-white/10 transition-all">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-[#23261F] font-headline-lg tracking-tight">
            Manage Lists
          </h1>
          <p className="text-sm text-[#6E6858]">
            Configure and maintain standard campus taxonomies, report categories, and academic departments.
          </p>
        </div>
        <div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#5170ff] hover:bg-[#4767f6] text-white font-medium text-sm transition-colors shadow-sm cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>{getAddButtonLabel(activeTab)}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#E8E4D8] overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-[#5170ff] text-[#5170ff] font-semibold'
                  : 'border-transparent text-[#6E6858] hover:text-[#23261F] hover:border-[#CBD5E1]'
              }`}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
              <span>{tab.label}</span>
              <span
                className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${
                  isActive
                    ? 'bg-[#5170ff]/10 text-[#5170ff]'
                    : 'bg-slate-100 text-[#6E6858]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toolbar / Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-[#6E6858] pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder={`Search ${tabs.find((t) => t.id === activeTab)?.label.toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-white border border-[#CBD5E1] rounded-lg text-[#23261F] placeholder-[#6E6858]/60 focus:outline-none focus:border-[#5170ff] focus:ring-1 focus:ring-[#5170ff]"
          />
        </div>
      </div>

      {/* Taxonomy Table */}
      <div className="bg-white rounded-xl border border-[#E8E4D8] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#f8f9ff] text-[#6E6858] text-xs uppercase font-semibold border-b border-[#E8E4D8]">
              <tr>
                <th className="py-3.5 px-6">{getColumnLabel(activeTab)}</th>
                <th className="py-3.5 px-6 whitespace-nowrap">Status</th>
                <th className="py-3.5 px-6 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4D8] text-sm text-[#23261F]">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-10 text-center text-[#6E6858]">
                    No items found matching your search.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#f8f9ff]/70 transition-colors">
                    <td className="py-3.5 px-6 font-medium text-[#0f172a]">{item.name}</td>
                    <td className="py-3.5 px-6 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          item.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {item.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItem(item);
                            setIsEditModalOpen(true);
                          }}
                          className="p-1.5 text-[#6E6858] hover:text-[#5170ff] hover:bg-[#eff4ff] rounded-lg transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItem(item);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-[#6E6858] hover:text-[#ba1a1a] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Item Modal */}
      {isAddModalOpen && (
        <AddModalManageLists
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSaveNewItem}
          typeLabel={getItemTypeSingular(activeTab)}
          fieldLabel={getColumnLabel(activeTab)}
        />
      )}

      {/* Edit Item Modal */}
      {isEditModalOpen && selectedItem && (
        <EditModalManageLists
          isOpen={isEditModalOpen}
          item={selectedItem}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedItem(null);
          }}
          onSave={handleSaveEditItem}
          fieldLabel={getColumnLabel(activeTab)}
        />
      )}

      {/* Delete Item Modal */}
      {isDeleteModalOpen && selectedItem && (
        <DeleteModalManageLists
          isOpen={isDeleteModalOpen}
          item={selectedItem}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedItem(null);
          }}
          onConfirm={handleConfirmDelete}
          typeLabel={getItemTypeSingular(activeTab)}
        />
      )}
    </div>
  );
}
