// backend/src/models/Recipe.model.ts

import { getDB } from '../config/database'
import { ObjectId, type WithId, type Document } from 'mongodb'

export interface RecipeIngredient {
  productId: string
  quantity: number
  unit: string
}

export interface Recipe {
  _id?: string
  id?: string
  name: string
  description?: string
  categoryId: string
  ingredients: RecipeIngredient[]
  yield: number
  yieldUnit: string
  preparationTime: number
  cookingTime: number
  shelfLife: number
  sellingPrice: number
  image?: string
  instructions?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

function toRecipe(doc: WithId<Document> | null): Recipe | null {
  if (!doc) return null
  return {
    _id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    categoryId: doc.categoryId,
    ingredients: doc.ingredients || [],
    yield: doc.yield || 1,
    yieldUnit: doc.yieldUnit || 'pieces',
    preparationTime: doc.preparationTime || 0,
    cookingTime: doc.cookingTime || 0,
    shelfLife: doc.shelfLife || 24,
    sellingPrice: doc.sellingPrice,
    image: doc.image,
    instructions: doc.instructions,
    isActive: doc.isActive ?? true,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt
  }
}

export const RecipeModel = {
  collection: 'recipes',
  
  async create(input: any): Promise<Recipe> {
    const db = getDB()
    const now = new Date()
    const newRecipe: Omit<Recipe, '_id'> = {
      name: input.name,
      description: input.description,
      categoryId: input.categoryId,
      ingredients: input.ingredients,
      yield: input.yield,
      yieldUnit: input.yieldUnit || 'pieces',
      preparationTime: input.preparationTime || 0,
      cookingTime: input.cookingTime || 0,
      shelfLife: input.shelfLife || 24,
      sellingPrice: input.sellingPrice,
      image: input.image,
      instructions: input.instructions,
      isActive: input.isActive !== false,
      createdAt: now,
      updatedAt: now
    }
    const result = await db.collection('recipes').insertOne(newRecipe)
    return { _id: result.insertedId.toString(), ...newRecipe }
  },
  
  async findAll(): Promise<Recipe[]> {
    const db = getDB()
    const docs = await db.collection('recipes').find({}).toArray()
    return docs.map(doc => toRecipe(doc)!).filter(r => r !== null)
  },
  
  async findActive(): Promise<Recipe[]> {
    const db = getDB()
    const docs = await db.collection('recipes')
      .find({ isActive: true })
      .toArray()
    return docs.map(doc => toRecipe(doc)!).filter(r => r !== null)
  },
  
  async findByCategory(categoryId: string): Promise<Recipe[]> {
    const db = getDB()
    const docs = await db.collection('recipes')
      .find({ categoryId })
      .toArray()
    return docs.map(doc => toRecipe(doc)!).filter(r => r !== null)
  },
  
  async findById(id: string): Promise<Recipe | null> {
    const db = getDB()
    if (!ObjectId.isValid(id)) return null
    const doc = await db.collection('recipes').findOne({ _id: new ObjectId(id) })
    return toRecipe(doc)
  },
  
  async update(id: string, updates: Partial<Recipe>): Promise<void> {
    const db = getDB()
    const { _id, id: ignoreId, createdAt, ...safeUpdates } = updates
    await db.collection('recipes').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...safeUpdates, updatedAt: new Date() } }
    )
  },
  
  async delete(id: string): Promise<void> {
    const db = getDB()
    await db.collection('recipes').deleteOne({ _id: new ObjectId(id) })
  },
  
  async getRecipeCost(recipeId: string): Promise<number> {
    const recipe = await this.findById(recipeId)
    if (!recipe) return 0
    
    const db = getDB()
    let totalCost = 0
    for (const ing of recipe.ingredients) {
      const product = await db.collection('products').findOne({ _id: new ObjectId(ing.productId) })
      if (product) {
        totalCost += (product.unitPrice || 0) * ing.quantity
      }
    }
    return recipe.yield > 0 ? totalCost / recipe.yield : totalCost
  }
}