import { connectDB, getDB } from '../config/database'
import { hashPassword } from '../utils/bcrypt'
import { ObjectId } from 'mongodb'

// Helper function to safely get ID from MongoDB document
function getDocumentId<T extends { _id?: ObjectId }>(doc: T): ObjectId {
  if (!doc._id) {
    throw new Error('Document has no _id')
  }
  return doc._id
}

async function seed() {
  try {
    await connectDB()
    const db = getDB()
    
    // ============================================
    // 1. SUPPRIMER LES ANCIENNES DONNÉES
    // ============================================
    console.log('🗑️  Suppression des anciennes données...')
    await db.collection('categories').deleteMany({})
    await db.collection('subcategories').deleteMany({})
    await db.collection('products').deleteMany({})
    await db.collection('batches').deleteMany({})
    await db.collection('users').deleteMany({})
    await db.collection('recipe_categories').deleteMany({})
    await db.collection('recipes').deleteMany({})
    await db.collection('showcases').deleteMany({})
    await db.collection('production_orders').deleteMany({})
    await db.collection('showcase_items').deleteMany({})
    await db.collection('menu_categories').deleteMany({})
    await db.collection('menu_items').deleteMany({})
    await db.collection('supplements').deleteMany({})
    await db.collection('offers').deleteMany({})
    console.log('✅ Anciennes données supprimées')
    
    // ============================================
    // 2. CRÉER LES UTILISATEURS
    // ============================================
    console.log('\n👤 Création des utilisateurs...')
    
    const adminPassword = await hashPassword('admin123')
    const userPassword = await hashPassword('user123')
    const clientPassword = await hashPassword('client123')
    
    const users = [
      {
        email: 'admin@patisserie.tn',
        password: adminPassword,
        name: 'Administrateur',
        role: 'admin',
        phone: '+216 71 123 456',
        loyaltyPoints: 0,
        lifetimePoints: 0,
        loyaltyTier: 'bronze',
        totalSpent: 0,
        totalOrders: 0,
        referralCode: 'ADM-1234',
        referralCount: 0,
        walletBalance: 0,
        qrCode: 'QR-ADMIN-001',
        isActive: true,
        employeeRole: 'admin',
        permissions: [
          'dashboard', 'articles', 'menu', 'categories', 'suppliers',
          'batches', 'alerts', 'clients', 'clients_loyalty', 'rewards',
          'missions', 'games', 'special_days', 'referrals', 'pos', 'employees'
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'user@patisserie.tn',
        password: userPassword,
        name: 'Utilisateur Standard',
        role: 'user',
        phone: '+216 98 765 432',
        loyaltyPoints: 0,
        lifetimePoints: 0,
        loyaltyTier: 'bronze',
        totalSpent: 0,
        totalOrders: 0,
        referralCode: 'USR-5678',
        referralCount: 0,
        walletBalance: 0,
        qrCode: 'QR-USER-001',
        isActive: true,
        employeeRole: 'employee',
        permissions: ['dashboard', 'pos'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        email: 'client@test.com',
        password: clientPassword,
        name: 'Client Test',
        role: 'client',
        phone: '+216 55 123 789',
        loyaltyPoints: 150,
        lifetimePoints: 150,
        loyaltyTier: 'bronze',
        totalSpent: 75,
        totalOrders: 3,
        referralCode: 'CLT-9999',
        referralCount: 0,
        walletBalance: 0,
        qrCode: 'QR-CLIENT-001',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    for (const user of users) {
      const result = await db.collection('users').insertOne(user)
      console.log(`   ✅ ${user.email} (${user.role}) - ID: ${result.insertedId}`)
    }
    
    // ============================================
    // 3. CRÉER LES CATÉGORIES STOCK
    // ============================================
    console.log('\n📁 Création des catégories stock...')
    
    const categories = [
      {
        name: 'Patisserie',
        slug: 'patisserie',
        description: 'Produits pour la pâtisserie et viennoiseries',
        icon: '🎂',
        color: '#f59e0b',
        order: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Cafe',
        slug: 'cafe',
        description: 'Produits pour le café et boissons chaudes',
        icon: '☕',
        color: '#78350f',
        order: 2,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Restaurant',
        slug: 'restaurant',
        description: 'Ingrédients pour la cuisine du restaurant',
        icon: '🍽️',
        color: '#dc2626',
        order: 3,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    
    const insertedCategories: any[] = []
    for (const cat of categories) {
      const result = await db.collection('categories').insertOne(cat)
      insertedCategories.push({ ...cat, _id: result.insertedId })
      console.log(`   ✅ ${cat.name}`)
    }
    
    const patisserieId = insertedCategories.find(c => c.slug === 'patisserie')?._id
    const cafeId = insertedCategories.find(c => c.slug === 'cafe')?._id
    const restaurantId = insertedCategories.find(c => c.slug === 'restaurant')?._id
    
    if (!patisserieId || !cafeId || !restaurantId) {
      throw new Error('Failed to create categories')
    }
    
    // ============================================
    // 4. CRÉER LES SOUS-CATÉGORIES
    // ============================================
    console.log('\n📂 Création des sous-catégories...')
    
    const subCategories = [
      { categoryId: patisserieId, name: 'Chocolat', slug: 'chocolat', icon: '🍫', order: 1, isActive: true },
      { categoryId: patisserieId, name: 'Farine', slug: 'farine', icon: '🌾', order: 2, isActive: true },
      { categoryId: patisserieId, name: 'Produits Laitiers', slug: 'produits-laitiers', icon: '🥛', order: 3, isActive: true },
      { categoryId: patisserieId, name: 'Fruits', slug: 'fruits', icon: '🍓', order: 4, isActive: true },
      { categoryId: cafeId, name: 'Cafe en Grains', slug: 'cafe-grains', icon: '☕', order: 1, isActive: true },
      { categoryId: cafeId, name: 'Thé', slug: 'the', icon: '🍵', order: 2, isActive: true },
      { categoryId: cafeId, name: 'Sirops', slug: 'sirops', icon: '🍯', order: 3, isActive: true },
      { categoryId: restaurantId, name: 'Huiles', slug: 'huiles', icon: '🫒', order: 1, isActive: true },
      { categoryId: restaurantId, name: 'Épices', slug: 'epices', icon: '🌶️', order: 2, isActive: true },
      { categoryId: restaurantId, name: 'Conserves', slug: 'conserves', icon: '🥫', order: 3, isActive: true }
    ]
    
    const insertedSubCategories: any[] = []
    for (const sub of subCategories) {
      const now = new Date()
      const subData = {
        ...sub,
        description: `Sous-catégorie ${sub.name}`,
        order: sub.order,
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
      const result = await db.collection('subcategories').insertOne(subData)
      insertedSubCategories.push({ ...subData, _id: result.insertedId })
      console.log(`   ✅ ${sub.name}`)
    }
    
    const chocolatId = insertedSubCategories.find(s => s.name === 'Chocolat')?._id
    const farineId = insertedSubCategories.find(s => s.name === 'Farine')?._id
    const laitiersId = insertedSubCategories.find(s => s.name === 'Produits Laitiers')?._id
    const fruitsId = insertedSubCategories.find(s => s.name === 'Fruits')?._id
    const cafeGrainsId = insertedSubCategories.find(s => s.name === 'Cafe en Grains')?._id
    
    if (!chocolatId || !farineId || !laitiersId || !fruitsId || !cafeGrainsId) {
      throw new Error('Failed to create subcategories')
    }
    
    // ============================================
    // 5. CRÉER LES PRODUITS STOCK
    // ============================================
    console.log('\n📦 Création des produits stock...')
    
    const now = new Date()
    const products = [
      { subCategoryId: chocolatId, name: 'Chocolat Noir 70%', unit: 'kg', minQuantity: 5, unitPrice: 28.5, shelfLifeAfterOpening: 180, isActive: true },
      { subCategoryId: chocolatId, name: 'Chocolat Blanc', unit: 'kg', minQuantity: 5, unitPrice: 25.0, shelfLifeAfterOpening: 180, isActive: true },
      { subCategoryId: farineId, name: 'Farine T55', unit: 'kg', minQuantity: 20, unitPrice: 1.2, shelfLifeAfterOpening: 90, isActive: true },
      { subCategoryId: laitiersId, name: 'Beurre AOP', unit: 'kg', minQuantity: 10, unitPrice: 12.5, shelfLifeAfterOpening: 7, isActive: true },
      { subCategoryId: laitiersId, name: 'Crème Liquide 35%', unit: 'L', minQuantity: 5, unitPrice: 3.5, shelfLifeAfterOpening: 3, isActive: true },
      { subCategoryId: fruitsId, name: 'Fraise', unit: 'kg', minQuantity: 3, unitPrice: 8.0, isActive: true },
      { subCategoryId: cafeGrainsId, name: 'Cafe Arabica', unit: 'kg', minQuantity: 5, unitPrice: 18.0, shelfLifeAfterOpening: 30, isActive: true }
    ]
    
    const insertedProducts: any[] = []
    for (const prod of products) {
      const productData = {
        ...prod,
        description: `Produit ${prod.name}`,
        createdAt: now,
        updatedAt: now
      }
      const result = await db.collection('products').insertOne(productData)
      insertedProducts.push({ ...productData, _id: result.insertedId })
      console.log(`   ✅ ${prod.name}`)
    }
    
    const chocolatNoirId = insertedProducts.find(p => p.name === 'Chocolat Noir 70%')?._id
    const beurreId = insertedProducts.find(p => p.name === 'Beurre AOP')?._id
    const cremeId = insertedProducts.find(p => p.name === 'Crème Liquide 35%')?._id
    const cafeArabicaId = insertedProducts.find(p => p.name === 'Cafe Arabica')?._id
    
    if (!chocolatNoirId || !beurreId || !cremeId || !cafeArabicaId) {
      throw new Error('Failed to create products')
    }
    
    // ============================================
    // 6. CRÉER LES LOTS (BATCHES)
    // ============================================
    console.log('\n🏷️ Création des lots...')
    
    const today = new Date()
    const nextWeek = new Date(today)
    nextWeek.setDate(today.getDate() + 7)
    const nextMonth = new Date(today)
    nextMonth.setDate(today.getDate() + 30)
    const nextYear = new Date(today)
    nextYear.setDate(today.getDate() + 365)
    
    const batches = [
      { productId: chocolatNoirId, batchNumber: 'CHN-001', quantity: 15, unitCost: 25.0, receptionDate: today, expirationDate: nextYear, isOpened: false, createdAt: now, updatedAt: now },
      { productId: beurreId, batchNumber: 'BEU-001', quantity: 5, unitCost: 11.0, receptionDate: today, expirationDate: nextWeek, isOpened: false, createdAt: now, updatedAt: now },
      { productId: cremeId, batchNumber: 'CRE-001', quantity: 12, unitCost: 3.2, receptionDate: today, expirationDate: nextWeek, isOpened: false, createdAt: now, updatedAt: now },
      { productId: cafeArabicaId, batchNumber: 'CAF-001', quantity: 20, unitCost: 16.0, receptionDate: today, expirationDate: nextMonth, isOpened: false, createdAt: now, updatedAt: now }
    ]
    
    for (const batch of batches) {
      await db.collection('batches').insertOne(batch)
      console.log(`   ✅ ${batch.batchNumber} - ${batch.quantity} unités`)
    }
    
    // ============================================
    // 7. CRÉER LES CATÉGORIES DE RECETTES (PRODUCTION)
    // ============================================
    console.log('\n🍰 Création des catégories de recettes...')
    
    const recipeCategories = [
      { name: 'Patisseries', icon: '🎂', color: 'bg-pink-100 text-pink-800', isActive: true, createdAt: now, updatedAt: now },
      { name: 'Viennoiseries', icon: '🥐', color: 'bg-amber-100 text-amber-800', isActive: true, createdAt: now, updatedAt: now },
      { name: 'Boulangerie', icon: '🥖', color: 'bg-yellow-100 text-yellow-800', isActive: true, createdAt: now, updatedAt: now }
    ]
    
    const insertedRecipeCategories: any[] = []
    for (const cat of recipeCategories) {
      const result = await db.collection('recipe_categories').insertOne(cat)
      insertedRecipeCategories.push({ ...cat, _id: result.insertedId })
      console.log(`   ✅ ${cat.name}`)
    }
    
    const patisserieRecipeCatId = insertedRecipeCategories[0]?._id
    const viennoiserieRecipeCatId = insertedRecipeCategories[1]?._id
    
    if (!patisserieRecipeCatId || !viennoiserieRecipeCatId) {
      throw new Error('Failed to create recipe categories')
    }
    
    // ============================================
    // 8. CRÉER LES RECETTES (PRODUCTION)
    // ============================================
    console.log('\n📖 Création des recettes...')
    
    const recipes = [
      {
        name: 'Croissant Beurre',
        description: 'Croissant traditionnel au beurre',
        categoryId: viennoiserieRecipeCatId,
        ingredients: [
          { productId: beurreId, quantity: 0.5, unit: 'kg' },
          { productId: farineId, quantity: 0.25, unit: 'kg' }
        ],
        yield: 12,
        yieldUnit: 'pieces',
        preparationTime: 30,
        cookingTime: 18,
        shelfLife: 24,
        sellingPrice: 2.5,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Pain au Chocolat',
        description: 'Viennoiserie au chocolat noir',
        categoryId: viennoiserieRecipeCatId,
        ingredients: [
          { productId: beurreId, quantity: 0.5, unit: 'kg' },
          { productId: chocolatNoirId, quantity: 0.24, unit: 'kg' }
        ],
        yield: 12,
        yieldUnit: 'pieces',
        preparationTime: 30,
        cookingTime: 18,
        shelfLife: 24,
        sellingPrice: 3.0,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Eclair Cafe',
        description: 'Eclair garni de creme au cafe',
        categoryId: patisserieRecipeCatId,
        ingredients: [
          { productId: cremeId, quantity: 0.5, unit: 'L' },
          { productId: beurreId, quantity: 0.2, unit: 'kg' }
        ],
        yield: 10,
        yieldUnit: 'pieces',
        preparationTime: 40,
        cookingTime: 30,
        shelfLife: 24,
        sellingPrice: 5.0,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Macaron Chocolat',
        description: 'Macaron au chocolat noir intense',
        categoryId: patisserieRecipeCatId,
        ingredients: [
          { productId: chocolatNoirId, quantity: 0.15, unit: 'kg' },
          { productId: cremeId, quantity: 0.2, unit: 'L' }
        ],
        yield: 20,
        yieldUnit: 'pieces',
        preparationTime: 45,
        cookingTime: 15,
        shelfLife: 72,
        sellingPrice: 2.5,
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Cafe Expresso',
        description: 'Cafe expresso classique',
        categoryId: patisserieRecipeCatId,
        ingredients: [
          { productId: cafeArabicaId, quantity: 0.008, unit: 'kg' }
        ],
        yield: 1,
        yieldUnit: 'pieces',
        preparationTime: 2,
        cookingTime: 0,
        shelfLife: 0,
        sellingPrice: 2.0,
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ]
    
    const insertedRecipes: any[] = []
    for (const recipe of recipes) {
      const result = await db.collection('recipes').insertOne(recipe)
      insertedRecipes.push({ ...recipe, _id: result.insertedId })
      console.log(`   ✅ ${recipe.name}`)
    }
    
    const croissantId = insertedRecipes[0]?._id
    const painChocolatId = insertedRecipes[1]?._id
    const eclairId = insertedRecipes[2]?._id
    
    if (!croissantId || !painChocolatId || !eclairId) {
      throw new Error('Failed to create recipes')
    }
    
    // ============================================
    // 9. CRÉER LES VITRINES (SHOWCASES)
    // ============================================
    console.log('\n🏪 Création des vitrines...')
    
    const showcases = [
      {
        name: 'Vitrine Patisserie',
        type: 'refrigerated',
        temperature: '4-6°C',
        capacity: 50,
        location: 'Entrée principale',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Vitrine Viennoiseries',
        type: 'ambient',
        temperature: 'Ambiante',
        capacity: 80,
        location: 'Comptoir central',
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Comptoir Cafe',
        type: 'heated',
        temperature: 'Chaud',
        capacity: 30,
        location: 'Zone café',
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ]
    
    const insertedShowcases: any[] = []
    for (const showcase of showcases) {
      const result = await db.collection('showcases').insertOne(showcase)
      insertedShowcases.push({ ...showcase, _id: result.insertedId })
      console.log(`   ✅ ${showcase.name}`)
    }
    
    const vitrinePatisserieId = insertedShowcases[0]?._id
    const vitrineViennoiserieId = insertedShowcases[1]?._id
    const comptoirCafeId = insertedShowcases[2]?._id
    
    if (!vitrinePatisserieId || !vitrineViennoiserieId || !comptoirCafeId) {
      throw new Error('Failed to create showcases')
    }
    
    // ============================================
    // 10. CRÉER LES ORDRES DE PRODUCTION
    // ============================================
    console.log('\n🏭 Création des ordres de production...')
    
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    const productionOrders = [
      {
        recipeId: croissantId,
        showcaseId: vitrineViennoiserieId,
        quantity: 2,
        scheduledDate: tomorrow,
        status: 'planned',
        notes: 'Production matinale',
        createdAt: now,
        updatedAt: now
      },
      {
        recipeId: painChocolatId,
        showcaseId: vitrineViennoiserieId,
        quantity: 2,
        scheduledDate: tomorrow,
        status: 'planned',
        notes: 'Production matinale',
        createdAt: now,
        updatedAt: now
      },
      {
        recipeId: eclairId,
        showcaseId: vitrinePatisserieId,
        quantity: 1,
        scheduledDate: tomorrow,
        status: 'planned',
        notes: 'Production pour le weekend',
        createdAt: now,
        updatedAt: now
      }
    ]
    
    const insertedProductionOrders: any[] = []
    for (const order of productionOrders) {
      const result = await db.collection('production_orders').insertOne(order)
      insertedProductionOrders.push({ ...order, _id: result.insertedId })
      console.log(`   ✅ Ordre pour recette ${order.recipeId}`)
    }
    
    // ============================================
    // 11. CRÉER LES ITEMS EN VITRINE (STOCK FINAL)
    // ============================================
    console.log('\n🍰 Création des produits en vitrine...')
    
    const expDate = new Date(today)
    expDate.setDate(today.getDate() + 1)
    const expTime = '06:00'
    
    const showcaseItems = [
      {
        recipeId: croissantId,
        productionOrderId: insertedProductionOrders[0]?._id,
        showcaseId: vitrineViennoiserieId,
        batchNumber: 'CRO-001',
        quantity: 24,
        initialQuantity: 30,
        productionDate: today,
        productionTime: '06:00',
        expirationDate: expDate,
        expirationTime: expTime,
        unitCost: 0.8,
        sellingPrice: 2.5,
        status: 'available',
        createdAt: now,
        updatedAt: now
      },
      {
        recipeId: painChocolatId,
        productionOrderId: insertedProductionOrders[1]?._id,
        showcaseId: vitrineViennoiserieId,
        batchNumber: 'PC-001',
        quantity: 18,
        initialQuantity: 24,
        productionDate: today,
        productionTime: '06:00',
        expirationDate: expDate,
        expirationTime: expTime,
        unitCost: 1.1,
        sellingPrice: 3.0,
        status: 'available',
        createdAt: now,
        updatedAt: now
      },
      {
        recipeId: eclairId,
        productionOrderId: insertedProductionOrders[2]?._id,
        showcaseId: vitrinePatisserieId,
        batchNumber: 'ECL-001',
        quantity: 8,
        initialQuantity: 12,
        productionDate: today,
        productionTime: '07:00',
        expirationDate: expDate,
        expirationTime: expTime,
        unitCost: 2.2,
        sellingPrice: 5.0,
        status: 'available',
        createdAt: now,
        updatedAt: now
      }
    ]
    
    for (const item of showcaseItems) {
      if (item.productionOrderId) {
        await db.collection('showcase_items').insertOne(item)
        console.log(`   ✅ ${item.batchNumber} - ${item.quantity} unités`)
      } else {
        console.log(`   ⚠️ Skipped ${item.batchNumber} - productionOrderId missing`)
      }
    }
    
    // ============================================
    // 12. CRÉER LES CATÉGORIES MENU
    // ============================================
    console.log('\n📋 Création des catégories menu...')
    
    const menuCategories = [
      { name: 'Viennoiseries', slug: 'viennoiseries', icon: '🥐', order: 1, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Patisseries', slug: 'patisseries', icon: '🎂', order: 2, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Boissons Chaudes', slug: 'boissons-chaudes', icon: '☕', order: 3, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Boissons Fraîches', slug: 'boissons-fraiches', icon: '🥤', order: 4, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Salé', slug: 'sale', icon: '🥪', order: 5, isActive: true, createdAt: now, updatedAt: now },
      { name: 'Desserts', slug: 'desserts', icon: '🍰', order: 6, isActive: true, createdAt: now, updatedAt: now }
    ]
    
    const insertedMenuCategories: any[] = []
    for (const cat of menuCategories) {
      const result = await db.collection('menu_categories').insertOne(cat)
      insertedMenuCategories.push({ ...cat, _id: result.insertedId })
      console.log(`   ✅ ${cat.name}`)
    }
    
    const viennoiseriesCatId = insertedMenuCategories.find(c => c.slug === 'viennoiseries')?._id
    const patisseriesCatId = insertedMenuCategories.find(c => c.slug === 'patisseries')?._id
    const boissonsChaudesCatId = insertedMenuCategories.find(c => c.slug === 'boissons-chaudes')?._id
    const boissonsFraichesCatId = insertedMenuCategories.find(c => c.slug === 'boissons-fraiches')?._id
    const saleCatId = insertedMenuCategories.find(c => c.slug === 'sale')?._id
    const dessertsCatId = insertedMenuCategories.find(c => c.slug === 'desserts')?._id
    
    // ============================================
    // 13. CRÉER LES SUPPLEMENTS
    // ============================================
    console.log('\n➕ Création des suppléments...')
    
    const supplements = [
      { name: 'Chantilly', price: 1.5, points: 2, description: 'Chantilly fraîche maison', category: 'topping', isActive: true, createdAt: now, updatedAt: now },
      { name: 'Sirop Caramel', price: 1.0, points: 1, description: 'Sirop caramel artisanal', category: 'sirop', isActive: true, createdAt: now, updatedAt: now },
      { name: 'Sirop Vanille', price: 1.0, points: 1, description: 'Sirop vanille nature', category: 'sirop', isActive: true, createdAt: now, updatedAt: now },
      { name: 'Lait d\'Amande', price: 1.2, points: 1, description: 'Lait d\'amande sans lactose', category: 'lait', isActive: true, createdAt: now, updatedAt: now },
      { name: 'Lait d\'Avoine', price: 1.2, points: 1, description: 'Lait d\'avoine', category: 'lait', isActive: true, createdAt: now, updatedAt: now },
      { name: 'Shot Espresso', price: 1.5, points: 2, description: 'Shot d\'espresso supplémentaire', category: 'cafe', isActive: true, createdAt: now, updatedAt: now },
      { name: 'Nutella', price: 2.0, points: 2, description: 'Nutella maison', category: 'topping', isActive: true, createdAt: now, updatedAt: now },
      { name: 'Fruits Frais', price: 2.5, points: 3, description: 'Fruits frais de saison', category: 'fruits', isActive: true, createdAt: now, updatedAt: now }
    ]
    
    const insertedSupplements: any[] = []
    for (const sup of supplements) {
      const result = await db.collection('supplements').insertOne(sup)
      insertedSupplements.push({ ...sup, _id: result.insertedId })
      console.log(`   ✅ ${sup.name} - ${sup.price} TND`)
    }
    
    const chantillyId = insertedSupplements.find(s => s.name === 'Chantilly')?._id
    const siropCaramelId = insertedSupplements.find(s => s.name === 'Sirop Caramel')?._id
    const siropVanilleId = insertedSupplements.find(s => s.name === 'Sirop Vanille')?._id
    const laitAmandeId = insertedSupplements.find(s => s.name === "Lait d'Amande")?._id
    const laitAvoineId = insertedSupplements.find(s => s.name === "Lait d'Avoine")?._id
    const shotEspressoId = insertedSupplements.find(s => s.name === 'Shot Espresso')?._id
    const nutellaId = insertedSupplements.find(s => s.name === 'Nutella')?._id
    const fruitsFraisId = insertedSupplements.find(s => s.name === 'Fruits Frais')?._id
    
    // ============================================
    // 14. CRÉER LES ARTICLES MENU
    // ============================================
    console.log('\n🍽️ Création des articles menu...')
    
    const menuItems = [
      // Viennoiseries
      { name: 'Croissant Nature', description: 'Croissant feuilleté au beurre', price: 2.5, points: 3, categoryId: viennoiseriesCatId, image: '/images/croissant.jpg', allergens: ['Gluten', 'Lait'], isAvailable: true, supplements: [{ supplementId: nutellaId, isEnabled: true }, { supplementId: chantillyId, isEnabled: true }], createdAt: now, updatedAt: now },
      { name: 'Pain au Chocolat', description: 'Viennoiserie au chocolat noir', price: 3.0, points: 3, categoryId: viennoiseriesCatId, image: '/images/pain-chocolat.jpg', allergens: ['Gluten', 'Lait', 'Chocolat'], isAvailable: true, supplements: [{ supplementId: nutellaId, isEnabled: true }, { supplementId: chantillyId, isEnabled: true }], createdAt: now, updatedAt: now },
      { name: 'Croissant aux Amandes', description: 'Croissant garni de crème d\'amande', price: 4.0, points: 4, categoryId: viennoiseriesCatId, image: '/images/croissant-amande.jpg', allergens: ['Gluten', 'Lait', 'Amandes'], isAvailable: true, createdAt: now, updatedAt: now },
      
      // Patisseries
      { name: 'Tarte aux Fraises', description: 'Tarte sablée aux fraises fraîches', price: 25.0, points: 25, categoryId: patisseriesCatId, image: '/images/tarte-fraise.jpg', allergens: ['Gluten', 'Lait', 'Oeufs'], isAvailable: true, createdAt: now, updatedAt: now },
      { name: 'Éclair Café', description: 'Éclair garni de crème au café', price: 5.0, points: 5, categoryId: patisseriesCatId, image: '/images/eclair-cafe.jpg', allergens: ['Gluten', 'Lait', 'Oeufs'], isAvailable: true, createdAt: now, updatedAt: now },
      { name: 'Macaron Chocolat', description: 'Macaron au chocolat noir', price: 2.5, points: 3, categoryId: patisseriesCatId, image: '/images/macaron.jpg', allergens: ['Amandes', 'Oeufs', 'Chocolat'], isAvailable: true, createdAt: now, updatedAt: now },
      
      // Boissons Chaudes
      { name: 'Café Expresso', description: 'Café expresso corsé', price: 2.0, points: 2, categoryId: boissonsChaudesCatId, image: '/images/espresso.jpg', allergens: [], isAvailable: true, supplements: [{ supplementId: shotEspressoId, isEnabled: true }, { supplementId: laitAmandeId, isEnabled: true }, { supplementId: laitAvoineId, isEnabled: true }, { supplementId: siropCaramelId, isEnabled: true }, { supplementId: siropVanilleId, isEnabled: true }], createdAt: now, updatedAt: now },
      { name: 'Cappuccino', description: 'Cappuccino onctueux', price: 4.0, points: 4, categoryId: boissonsChaudesCatId, image: '/images/cappuccino.jpg', allergens: ['Lait'], isAvailable: true, supplements: [{ supplementId: shotEspressoId, isEnabled: true }, { supplementId: laitAmandeId, isEnabled: true }, { supplementId: laitAvoineId, isEnabled: true }, { supplementId: siropCaramelId, isEnabled: true }, { supplementId: siropVanilleId, isEnabled: true }], createdAt: now, updatedAt: now },
      { name: 'Chocolat Chaud', description: 'Chocolat chaud maison', price: 4.5, points: 5, categoryId: boissonsChaudesCatId, image: '/images/chocolat-chaud.jpg', allergens: ['Lait', 'Chocolat'], isAvailable: true, supplements: [{ supplementId: chantillyId, isEnabled: true }], createdAt: now, updatedAt: now },
      
      // Boissons Fraîches
      { name: 'Jus d\'Orange', description: 'Jus d\'orange frais pressé', price: 5.0, points: 5, categoryId: boissonsFraichesCatId, image: '/images/jus-orange.jpg', allergens: [], isAvailable: true, createdAt: now, updatedAt: now },
      { name: 'Limonade', description: 'Limonade maison', price: 4.0, points: 4, categoryId: boissonsFraichesCatId, image: '/images/limonade.jpg', allergens: [], isAvailable: true, createdAt: now, updatedAt: now },
      
      // Salé
      { name: 'Croque-Monsieur', description: 'Croque-monsieur gratiné', price: 8.0, points: 8, categoryId: saleCatId, image: '/images/croque.jpg', allergens: ['Gluten', 'Lait', 'Oeufs'], isAvailable: true, createdAt: now, updatedAt: now },
      { name: 'Quiche Lorraine', description: 'Quiche lorraine maison', price: 7.5, points: 8, categoryId: saleCatId, image: '/images/quiche.jpg', allergens: ['Gluten', 'Lait', 'Oeufs'], isAvailable: true, createdAt: now, updatedAt: now },
      
      // Desserts
      { name: 'Fondant Chocolat', description: 'Fondant au chocolat coulant', price: 6.0, points: 6, categoryId: dessertsCatId, image: '/images/fondant.jpg', allergens: ['Gluten', 'Lait', 'Oeufs', 'Chocolat'], isAvailable: true, supplements: [{ supplementId: chantillyId, isEnabled: true }], createdAt: now, updatedAt: now },
      { name: 'Cheesecake', description: 'Cheesecake New York', price: 7.0, points: 7, categoryId: dessertsCatId, image: '/images/cheesecake.jpg', allergens: ['Gluten', 'Lait', 'Oeufs'], isAvailable: true, supplements: [{ supplementId: fruitsFraisId, isEnabled: true }], createdAt: now, updatedAt: now }
    ]
    
    const insertedMenuItems: any[] = []
    for (const item of menuItems) {
      const result = await db.collection('menu_items').insertOne(item)
      insertedMenuItems.push({ ...item, _id: result.insertedId })
      console.log(`   ✅ ${item.name} - ${item.price} TND`)
    }
    
    // ============================================
    // 15. CRÉER LES OFFRES
    // ============================================
    console.log('\n🎁 Création des offres...')
    
    const petitDejeunerItems = insertedMenuItems.filter(i => i.categoryId === viennoiseriesCatId || i.categoryId === boissonsChaudesCatId).slice(0, 4)
    const croissantIdMenuItem = insertedMenuItems.find(i => i.name === 'Croissant Nature')?._id
    const cafeIdMenuItem = insertedMenuItems.find(i => i.name === 'Café Expresso')?._id
    const jusIdMenuItem = insertedMenuItems.find(i => i.name === "Jus d'Orange")?._id
    const croqueIdMenuItem = insertedMenuItems.find(i => i.name === 'Croque-Monsieur')?._id
    
    const offers = [
      {
        name: 'Formule Petit Déjeuner',
        description: 'Croissant + Café au choix + Jus d\'orange',
        originalPrice: 12.5,
        discountedPrice: 9.9,
        points: 10,
        items: [
          { itemId: croissantIdMenuItem, quantity: 1 },
          { itemId: cafeIdMenuItem, quantity: 1 },
          { itemId: jusIdMenuItem, quantity: 1 }
        ],
        schedule: { daysOfWeek: [1, 2, 3, 4, 5], startTime: '08:00', endTime: '11:00' },
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Offre Midi',
        description: 'Croque-Monsieur + Café ou Jus',
        originalPrice: 14.0,
        discountedPrice: 11.9,
        points: 12,
        items: [
          { itemId: croqueIdMenuItem, quantity: 1 },
          { itemId: cafeIdMenuItem, quantity: 1 }
        ],
        schedule: { daysOfWeek: [1, 2, 3, 4, 5], startTime: '12:00', endTime: '15:00' },
        isActive: true,
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'Goûter Gourmand',
        description: 'Pâtisserie au choix + Boisson chaude',
        originalPrice: 9.0,
        discountedPrice: 7.5,
        points: 8,
        items: [],
        schedule: { daysOfWeek: [1, 2, 3, 4, 5, 6], startTime: '15:00', endTime: '18:00' },
        isActive: true,
        createdAt: now,
        updatedAt: now
      }
    ]
    
    for (const offer of offers) {
      const result = await db.collection('offers').insertOne(offer)
      console.log(`   ✅ ${offer.name} - ${offer.discountedPrice} TND`)
    }
    
    // ============================================
    // 16. RÉSUMÉ FINAL
    // ============================================
    console.log('\n' + '='.repeat(60))
    console.log('🎉 SEED TERMINÉ AVEC SUCCÈS!')
    console.log('='.repeat(60))
    
    console.log('\n📊 STATISTIQUES:')
    console.log(`   👤 Utilisateurs: ${users.length}`)
    console.log(`   📁 Catégories Stock: ${categories.length}`)
    console.log(`   📂 Sous-catégories: ${subCategories.length}`)
    console.log(`   📦 Produits Stock: ${products.length}`)
    console.log(`   🏷️ Lots: ${batches.length}`)
    console.log(`   🍰 Catégories Recettes: ${recipeCategories.length}`)
    console.log(`   📖 Recettes: ${recipes.length}`)
    console.log(`   🏪 Vitrines: ${showcases.length}`)
    console.log(`   🏭 Ordres Production: ${productionOrders.length}`)
    console.log(`   🍰 Items Vitrine: ${showcaseItems.filter(i => i.productionOrderId).length}`)
    console.log(`   📋 Catégories Menu: ${menuCategories.length}`)
    console.log(`   🍽️ Articles Menu: ${menuItems.length}`)
    console.log(`   ➕ Suppléments: ${supplements.length}`)
    console.log(`   🎁 Offres: ${offers.length}`)
    
    console.log('\n📝 COMPTES DE TEST:')
    console.log('┌─────────────────────────────────────────────────────────────┐')
    console.log('│ Admin:      admin@patisserie.tn / admin123                 │')
    console.log('│ User:       user@patisserie.tn / user123                   │')
    console.log('│ Client:     client@test.com / client123                    │')
    console.log('└─────────────────────────────────────────────────────────────┘')
    
    console.log('\n📝 API ENDPOINTS DISPONIBLES:')
    console.log('   GET    /api/menu/categories     - Catégories menu')
    console.log('   GET    /api/menu/items          - Articles menu')
    console.log('   GET    /api/menu/supplements    - Suppléments')
    console.log('   GET    /api/menu/offers/current - Offres actuelles')
    
    console.log('\n✅ Prêt à être utilisé!')
    process.exit(0)
    
  } catch (error) {
    console.error('❌ Erreur lors du seed:', error)
    process.exit(1)
  }
}

seed()