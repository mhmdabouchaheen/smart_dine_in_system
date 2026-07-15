import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import {
  fetchCategories,
  fetchMenu,
  fetchIngredients,
  createCategory,
  updateCategory,
  deleteCategory,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../../services/api'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { TextInput, TextArea, Select } from '../../components/ui/FormField'
import type { Category, MenuItem, Ingredient, RecipeLine } from '../../types'
import { required, validatePositiveNumber, hasErrors, type FieldErrors } from '../../utils/validation'

type Tab = 'items' | 'categories'

interface ItemForm {
  name: string
  categoryId: string
  price: string
  description: string
  image: string
  isBestSeller: boolean
  isSeasonal: boolean
}

const emptyItemForm: ItemForm = {
  name: '',
  categoryId: '',
  price: '',
  description: '',
  image: '',
  isBestSeller: false,
  isSeasonal: false,
}

interface CategoryForm {
  index: string
  name: string
  latin: string
  quote: string
  servedNote: string
}

const emptyCategoryForm: CategoryForm = { index: '', name: '', latin: '', quote: '', servedNote: '' }

export default function MenuManagement() {
  const [tab, setTab] = useState<Tab>('items')
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [isLoading, setLoading] = useState(true)

  // Menu item modal state
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItemForm)
  const [itemErrors, setItemErrors] = useState<FieldErrors<keyof ItemForm>>({})
  const [recipe, setRecipe] = useState<RecipeLine[]>([])
  const [isSavingItem, setSavingItem] = useState(false)
  const [deleteItemTarget, setDeleteItemTarget] = useState<MenuItem | null>(null)

  // Category modal state
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [catForm, setCatForm] = useState<CategoryForm>(emptyCategoryForm)
  const [catErrors, setCatErrors] = useState<FieldErrors<keyof CategoryForm>>({})
  const [isSavingCat, setSavingCat] = useState(false)
  const [deleteCatTarget, setDeleteCatTarget] = useState<Category | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const [cats, menu, ings] = await Promise.all([fetchCategories(), fetchMenu(), fetchIngredients()])
    setCategories(cats)
    setItems(menu)
    setIngredients(ings)
    setLoading(false)
  }

  // --- Menu item CRUD ---
  function openCreateItem() {
    setEditingItemId(null)
    setItemForm({ ...emptyItemForm, categoryId: categories[0]?._id || '' })
    setRecipe([])
    setItemErrors({})
    setItemModalOpen(true)
  }

  function openEditItem(item: MenuItem) {
    setEditingItemId(item._id)
    setItemForm({
      name: item.name,
      categoryId: item.categoryId,
      price: String(item.price),
      description: item.description,
      image: item.image,
      isBestSeller: !!item.isBestSeller,
      isSeasonal: !!item.isSeasonal,
    })
    setRecipe(item.recipe || [])
    setItemErrors({})
    setItemModalOpen(true)
  }

  function updateItemField<K extends keyof ItemForm>(key: K, value: ItemForm[K]) {
    setItemForm((prev) => ({ ...prev, [key]: value }))
  }

  function addRecipeLine() {
    if (ingredients.length === 0) return
    setRecipe((prev) => [...prev, { ingredientId: ingredients[0]._id, quantityRequired: 1 }])
  }

  function updateRecipeLine(idx: number, patch: Partial<RecipeLine>) {
    setRecipe((prev) => prev.map((line, i) => (i === idx ? { ...line, ...patch } : line)))
  }

  function removeRecipeLine(idx: number) {
    setRecipe((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSaveItem() {
    const errors: FieldErrors<keyof ItemForm> = {
      name: required(itemForm.name, 'Name'),
      categoryId: required(itemForm.categoryId, 'Category'),
      price: validatePositiveNumber(itemForm.price, 'Price'),
      description: required(itemForm.description, 'Description'),
      image: required(itemForm.image, 'Image URL'),
    }
    setItemErrors(errors)
    if (hasErrors(errors)) return

    setSavingItem(true)
    try {
      const payload = {
        name: itemForm.name,
        categoryId: itemForm.categoryId,
        price: Number(itemForm.price),
        description: itemForm.description,
        image: itemForm.image,
        isBestSeller: itemForm.isBestSeller,
        isSeasonal: itemForm.isSeasonal,
        recipe,
      }
      if (editingItemId) {
        const updated = await updateMenuItem(editingItemId, payload)
        setItems((prev) => prev.map((i) => (i._id === editingItemId ? updated : i)))
      } else {
        const created = await createMenuItem(payload)
        setItems((prev) => [created, ...prev])
      }
      setItemModalOpen(false)
    } finally {
      setSavingItem(false)
    }
  }

  async function handleDeleteItem() {
    if (!deleteItemTarget) return
    await deleteMenuItem(deleteItemTarget._id)
    setItems((prev) => prev.filter((i) => i._id !== deleteItemTarget._id))
    setDeleteItemTarget(null)
  }

  // --- Category CRUD ---
  function openCreateCategory() {
    setEditingCatId(null)
    setCatForm(emptyCategoryForm)
    setCatErrors({})
    setCatModalOpen(true)
  }

  function openEditCategory(cat: Category) {
    setEditingCatId(cat._id)
    setCatForm({ index: cat.index, name: cat.name, latin: cat.latin, quote: cat.quote, servedNote: cat.servedNote })
    setCatErrors({})
    setCatModalOpen(true)
  }

  async function handleSaveCategory() {
    const errors: FieldErrors<keyof CategoryForm> = {
      index: required(catForm.index, 'Index'),
      name: required(catForm.name, 'Name'),
      latin: required(catForm.latin, 'Latin name'),
      quote: required(catForm.quote, 'Quote'),
      servedNote: required(catForm.servedNote, 'Served note'),
    }
    setCatErrors(errors)
    if (hasErrors(errors)) return

    setSavingCat(true)
    try {
      if (editingCatId) {
        const updated = await updateCategory(editingCatId, catForm)
        setCategories((prev) => prev.map((c) => (c._id === editingCatId ? updated : c)))
      } else {
        const created = await createCategory(catForm)
        setCategories((prev) => [...prev, created])
      }
      setCatModalOpen(false)
    } finally {
      setSavingCat(false)
    }
  }

  async function handleDeleteCategory() {
    if (!deleteCatTarget) return
    await deleteCategory(deleteCatTarget._id)
    setCategories((prev) => prev.filter((c) => c._id !== deleteCatTarget._id))
    setDeleteCatTarget(null)
  }

  function categoryName(id: string) {
    return categories.find((c) => c._id === id)?.name || '—'
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <p className="eyebrow mb-4">The Menu</p>
          <h1 className="font-display text-4xl leading-[1.05]">
            Manage <em className="text-ember italic">dishes &amp; categories.</em>
          </h1>
        </div>
        <Button onClick={tab === 'items' ? openCreateItem : openCreateCategory}>
          <Plus size={14} /> {tab === 'items' ? 'Add Dish' : 'Add Category'}
        </Button>
      </div>

      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setTab('items')}
          className={`px-5 py-2.5 text-xs uppercase tracking-widest2 border transition-colors ${
            tab === 'items' ? 'bg-ember border-ember text-noir-950' : 'border-white/15 text-bone-dim hover:border-white/40'
          }`}
        >
          Menu Items
        </button>
        <button
          onClick={() => setTab('categories')}
          className={`px-5 py-2.5 text-xs uppercase tracking-widest2 border transition-colors ${
            tab === 'categories' ? 'bg-ember border-ember text-noir-950' : 'border-white/15 text-bone-dim hover:border-white/40'
          }`}
        >
          Categories
        </button>
      </div>

      {isLoading ? (
        <p className="text-bone-dim text-sm">Loading…</p>
      ) : tab === 'items' ? (
        <div className="border border-white/10 overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-widest2 text-bone-faint border-b border-white/10">
                <th className="px-6 py-4 font-normal">Dish</th>
                <th className="px-6 py-4 font-normal">Category</th>
                <th className="px-6 py-4 font-normal">Price</th>
                <th className="px-6 py-4 font-normal">Flags</th>
                <th className="px-6 py-4 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-b border-white/5 last:border-0">
                  <td className="px-6 py-4">
                    <p className="text-bone">{item.name}</p>
                  </td>
                  <td className="px-6 py-4 text-bone-dim">{categoryName(item.categoryId)}</td>
                  <td className="px-6 py-4 text-bone-dim">${item.price}</td>
                  <td className="px-6 py-4 text-[10px] uppercase tracking-widest2 text-ember space-x-2">
                    {item.isBestSeller && <span>Best Seller</span>}
                    {item.isSeasonal && <span>Seasonal</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => openEditItem(item)} className="text-bone-dim hover:text-ember" aria-label={`Edit ${item.name}`}>
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteItemTarget(item)} className="text-bone-dim hover:text-red-400" aria-label={`Remove ${item.name}`}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-white/10 overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-widest2 text-bone-faint border-b border-white/10">
                <th className="px-6 py-4 font-normal">No.</th>
                <th className="px-6 py-4 font-normal">Name</th>
                <th className="px-6 py-4 font-normal">Latin</th>
                <th className="px-6 py-4 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat._id} className="border-b border-white/5 last:border-0">
                  <td className="px-6 py-4 text-ember font-display">{cat.index}</td>
                  <td className="px-6 py-4 text-bone">{cat.name}</td>
                  <td className="px-6 py-4 text-bone-dim">{cat.latin}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => openEditCategory(cat)} className="text-bone-dim hover:text-ember" aria-label={`Edit ${cat.name}`}>
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteCatTarget(cat)} className="text-bone-dim hover:text-red-400" aria-label={`Remove ${cat.name}`}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Menu item modal */}
      <Modal
        isOpen={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        title={editingItemId ? 'Edit Dish' : 'Add Dish'}
        maxWidth="max-w-2xl"
      >
        <div className="grid md:grid-cols-2 gap-5">
          <TextInput label="Name" value={itemForm.name} onChange={(e) => updateItemField('name', e.target.value)} error={itemErrors.name} />
          <Select label="Category" value={itemForm.categoryId} onChange={(e) => updateItemField('categoryId', e.target.value)} error={itemErrors.categoryId}>
            <option value="">Select…</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>
          <TextInput label="Price" type="number" min={0} value={itemForm.price} onChange={(e) => updateItemField('price', e.target.value)} error={itemErrors.price} />
          <TextArea label="Description" full rows={3} value={itemForm.description} onChange={(e) => updateItemField('description', e.target.value)} error={itemErrors.description} />
          <TextInput label="Image URL" full value={itemForm.image} onChange={(e) => updateItemField('image', e.target.value)} error={itemErrors.image} />

          <label className="flex items-center gap-2 text-sm text-bone-dim">
            <input type="checkbox" checked={itemForm.isBestSeller} onChange={(e) => updateItemField('isBestSeller', e.target.checked)} />
            Best Seller
          </label>
          <label className="flex items-center gap-2 text-sm text-bone-dim">
            <input type="checkbox" checked={itemForm.isSeasonal} onChange={(e) => updateItemField('isSeasonal', e.target.checked)} />
            Seasonal
          </label>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <p className="eyebrow">Recipe (ingredients consumed per serving)</p>
            <button onClick={addRecipeLine} className="text-[11px] uppercase tracking-widest2 text-bone-dim hover:text-ember">
              + Add Ingredient
            </button>
          </div>
          {recipe.length === 0 ? (
            <p className="text-xs text-bone-faint">No ingredients linked — stock will never block this dish.</p>
          ) : (
            <div className="space-y-3">
              {recipe.map((line, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <select
                    value={line.ingredientId}
                    onChange={(e) => updateRecipeLine(idx, { ingredientId: e.target.value })}
                    className="field flex-1"
                  >
                    {ingredients.map((ing) => (
                      <option key={ing._id} value={ing._id}>
                        {ing.name} ({ing.unit})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={1}
                    value={line.quantityRequired}
                    onChange={(e) => updateRecipeLine(idx, { quantityRequired: Number(e.target.value) })}
                    className="field w-28"
                  />
                  <button onClick={() => removeRecipeLine(idx)} className="text-bone-faint hover:text-red-400 shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
          <Button variant="ghost" onClick={() => setItemModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveItem} disabled={isSavingItem}>{isSavingItem ? 'Saving…' : 'Save Dish'}</Button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteItemTarget} onClose={() => setDeleteItemTarget(null)} title="Remove Dish" subtitle={deleteItemTarget ? `"${deleteItemTarget.name}" will be removed from the menu.` : undefined} maxWidth="max-w-sm">
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteItemTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteItem}>Remove</Button>
        </div>
      </Modal>

      {/* Category modal */}
      <Modal isOpen={catModalOpen} onClose={() => setCatModalOpen(false)} title={editingCatId ? 'Edit Category' : 'Add Category'} maxWidth="max-w-lg">
        <div className="grid grid-cols-2 gap-5">
          <TextInput label="Index (e.g. 01)" value={catForm.index} onChange={(e) => setCatForm((p) => ({ ...p, index: e.target.value }))} error={catErrors.index} />
          <TextInput label="Latin Name" value={catForm.latin} onChange={(e) => setCatForm((p) => ({ ...p, latin: e.target.value }))} error={catErrors.latin} />
          <TextInput label="Name" full value={catForm.name} onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))} error={catErrors.name} />
          <TextInput label="Quote" full value={catForm.quote} onChange={(e) => setCatForm((p) => ({ ...p, quote: e.target.value }))} error={catErrors.quote} />
          <TextInput label="Served Note" full value={catForm.servedNote} onChange={(e) => setCatForm((p) => ({ ...p, servedNote: e.target.value }))} error={catErrors.servedNote} />
        </div>
        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-white/10">
          <Button variant="ghost" onClick={() => setCatModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveCategory} disabled={isSavingCat}>{isSavingCat ? 'Saving…' : 'Save Category'}</Button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteCatTarget} onClose={() => setDeleteCatTarget(null)} title="Remove Category" subtitle={deleteCatTarget ? `Dishes under "${deleteCatTarget.name}" will be orphaned.` : undefined} maxWidth="max-w-sm">
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteCatTarget(null)}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteCategory}>Remove</Button>
        </div>
      </Modal>
    </div>
  )
}
