import { getDB } from '../config/database'
import { ObjectId, type WithId, type Document } from 'mongodb'

export interface MenuSupplement {
  supplementId: string | ObjectId
  isEnabled: boolean
  customPrice?: number
}

export interface MenuPromotion {
  type: 'percentage' | 'fixed' | 'offer' | 'new' | 'popular'
  value?: number
  label?: string
  endDate?: Date
}

export interface MenuItem {
  _id?: string
  id?: string
  name: string
  description: string
  price: number
  points?: number
  categoryId: string | ObjectId
  image?: string | null
  allergens: string[]
  isAvailable: boolean
  tags?: string[]
  availableSupplements?: MenuSupplement[]
  promotion?: MenuPromotion
  recipeId?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateMenuItemInput {
  name: string
  description: string
  price: number
  points?: number
  categoryId: string | ObjectId
  image?: string | null
  allergens?: string[]
  isAvailable?: boolean
  tags?: string[]
  availableSupplements?: MenuSupplement[]
  promotion?: MenuPromotion
  recipeId?: string
}

function normalizeSupplementId(supp: MenuSupplement): MenuSupplement {
  return {
    ...supp,
    supplementId: typeof supp.supplementId === 'string' && ObjectId.isValid(supp.supplementId)
      ? new ObjectId(supp.supplementId)
      : supp.supplementId,
  }
}

function toMenuItem(doc: WithId<Document> | null): MenuItem | null {
  if (!doc) return null

  let availableSupplements = doc.availableSupplements || doc.supplements || []
  if (Array.isArray(availableSupplements)) {
    availableSupplements = availableSupplements.map((supp: any) => ({
      ...supp,
      supplementId: supp.supplementId instanceof ObjectId
        ? supp.supplementId.toString()
        : supp.supplementId,
    }))
  }

  return {
    _id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    price: doc.price,
    points: doc.points,
    categoryId: doc.categoryId instanceof ObjectId ? doc.categoryId.toString() : doc.categoryId,
    image: doc.image,
    allergens: doc.allergens || [],
    isAvailable: doc.isAvailable ?? true,
    tags: doc.tags,
    availableSupplements,
    promotion: doc.promotion,
    recipeId: doc.recipeId,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }
}

export const MenuItemModel = {
  collection: 'menu_items',
  
  async create(input: CreateMenuItemInput): Promise<MenuItem> {
    const db = getDB()
    const now = new Date()

    const categoryIdObj = typeof input.categoryId === 'string' && ObjectId.isValid(input.categoryId)
      ? new ObjectId(input.categoryId)
      : input.categoryId

    const availableSupplements = Array.isArray(input.availableSupplements)
      ? input.availableSupplements.map(normalizeSupplementId)
      : undefined

    const newItem: Omit<MenuItem, '_id'> = {
      name: input.name,
      description: input.description,
      price: input.price,
      points: input.points,
      categoryId: categoryIdObj,
      image: input.image,
      allergens: input.allergens || [],
      isAvailable: input.isAvailable !== false,
      tags: input.tags,
      availableSupplements,
      promotion: input.promotion,
      recipeId: input.recipeId,
      createdAt: now,
      updatedAt: now
    }
    
    const result = await db.collection('menu_items').insertOne(newItem)
    return {
      _id: result.insertedId.toString(),
      ...newItem,
      categoryId: typeof categoryIdObj === 'string' ? categoryIdObj : categoryIdObj.toString(),
      availableSupplements: input.availableSupplements,
    }
  },
  
  async findAll(): Promise<MenuItem[]> {
    const db = getDB()
    const docs = await db.collection('menu_items')
      .find({})
      .sort({ name: 1 })
      .toArray()
    return docs.map(doc => toMenuItem(doc)!).filter(i => i !== null)
  },
  
  async findActive(): Promise<MenuItem[]> {
    const db = getDB()
    const docs = await db.collection('menu_items')
      .find({ isAvailable: true })
      .sort({ name: 1 })
      .toArray()
    return docs.map(doc => toMenuItem(doc)!).filter(i => i !== null)
  },
  
  async findByCategory(categoryId: string): Promise<MenuItem[]> {
    const db = getDB()
    const categoryFilter = ObjectId.isValid(categoryId) ? new ObjectId(categoryId) : categoryId
    const docs = await db.collection('menu_items')
      .find({ categoryId: categoryFilter })
      .sort({ name: 1 })
      .toArray()
    return docs.map(doc => toMenuItem(doc)!).filter(i => i !== null)
  },
  
  async findById(id: string): Promise<MenuItem | null> {
    const db = getDB()
    if (!ObjectId.isValid(id)) return null
    const doc = await db.collection('menu_items').findOne({ _id: new ObjectId(id) })
    return toMenuItem(doc)
  },
  
  async update(id: string, updates: Partial<MenuItem>): Promise<void> {
    const db = getDB()
    if (!ObjectId.isValid(id)) {
      throw new Error('ID invalide')
    }

    const { _id, id: ignoreId, createdAt, ...safeUpdates } = updates
    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    const unsetData: Record<string, ''> = {}

    if (safeUpdates.name !== undefined) updateData.name = safeUpdates.name
    if (safeUpdates.description !== undefined) updateData.description = safeUpdates.description
    if (safeUpdates.price !== undefined) updateData.price = safeUpdates.price
    if (safeUpdates.points !== undefined) updateData.points = safeUpdates.points
    if (safeUpdates.image === null) {
      unsetData.image = ''
    } else if (safeUpdates.image !== undefined) {
      updateData.image = safeUpdates.image
    }
    if (safeUpdates.allergens !== undefined) updateData.allergens = safeUpdates.allergens
    if (safeUpdates.isAvailable !== undefined) updateData.isAvailable = safeUpdates.isAvailable
    if (safeUpdates.tags !== undefined) updateData.tags = safeUpdates.tags
    if (safeUpdates.promotion !== undefined) updateData.promotion = safeUpdates.promotion
    if (safeUpdates.recipeId !== undefined) updateData.recipeId = safeUpdates.recipeId

    if (safeUpdates.availableSupplements !== undefined) {
      updateData.availableSupplements = Array.isArray(safeUpdates.availableSupplements)
        ? safeUpdates.availableSupplements.map(normalizeSupplementId)
        : safeUpdates.availableSupplements
    }

    if (safeUpdates.categoryId !== undefined && safeUpdates.categoryId !== null) {
      updateData.categoryId =
        typeof safeUpdates.categoryId === 'string' && ObjectId.isValid(safeUpdates.categoryId)
          ? new ObjectId(safeUpdates.categoryId)
          : safeUpdates.categoryId
    }

    await db.collection('menu_items').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: updateData,
        ...(Object.keys(unsetData).length > 0 ? { $unset: unsetData } : {}),
      }
    )
  },
  
  async delete(id: string): Promise<void> {
    const db = getDB()
    await db.collection('menu_items').deleteOne({ _id: new ObjectId(id) })
  },
  
  async toggleAvailability(id: string): Promise<void> {
    const item = await this.findById(id)
    if (!item) throw new Error('Item non trouvé')
    await this.update(id, { isAvailable: !item.isAvailable })
  }
}
