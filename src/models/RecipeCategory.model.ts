// backend/src/models/RecipeCategory.model.ts

import { getDB } from '../config/database'
import { ObjectId, type WithId, type Document } from 'mongodb'

export interface RecipeCategory {
  _id?: string
  name: string
  icon: string
  color: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateRecipeCategoryInput {
  name: string
  icon?: string
  color?: string
  isActive?: boolean
}

function toRecipeCategory(doc: WithId<Document> | null): RecipeCategory | null {
  if (!doc) return null
  return {
    _id: doc._id.toString(),
    name: doc.name,
    icon: doc.icon || '🍰',
    color: doc.color || 'bg-amber-100 text-amber-800',
    isActive: doc.isActive ?? true,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }
}

export const RecipeCategoryModel = {
  collection: 'recipe_categories',
  
  async create(input: CreateRecipeCategoryInput): Promise<RecipeCategory> {
    const db = getDB()
    const now = new Date()
    const newCategory: Omit<RecipeCategory, '_id'> = {
      name: input.name,
      icon: input.icon || '🍰',
      color: input.color || 'bg-amber-100 text-amber-800',
      isActive: input.isActive !== false,
      createdAt: now,
      updatedAt: now
    }
    const result = await db.collection('recipe_categories').insertOne(newCategory)
    return { _id: result.insertedId.toString(), ...newCategory }
  },
  
  async findAll(): Promise<RecipeCategory[]> {
    const db = getDB()
    const docs = await db.collection('recipe_categories').find({}).toArray()
    return docs.map(doc => toRecipeCategory(doc)!).filter(c => c !== null)
  },
  
  async findActive(): Promise<RecipeCategory[]> {
    const db = getDB()
    const docs = await db.collection('recipe_categories')
      .find({ isActive: true })
      .toArray()
    return docs.map(doc => toRecipeCategory(doc)!).filter(c => c !== null)
  },
  
  async findById(id: string): Promise<RecipeCategory | null> {
    const db = getDB()
    if (!ObjectId.isValid(id)) return null
    const doc = await db.collection('recipe_categories').findOne({ _id: new ObjectId(id) })
    return toRecipeCategory(doc)
  },
  
  async update(id: string, updates: Partial<RecipeCategory>): Promise<void> {
    const db = getDB()
    await db.collection('recipe_categories').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updatedAt: new Date() } }
    )
  },
  
  async delete(id: string): Promise<void> {
    const db = getDB()
    await db.collection('recipe_categories').deleteOne({ _id: new ObjectId(id) })
  }
}