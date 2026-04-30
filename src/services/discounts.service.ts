import { DiscountConfigModel, type DiscountConfig, type DiscountConfigInput } from '../models/DiscountConfig.model'

export class DiscountsService {
  async getConfig(): Promise<DiscountConfig> {
    return DiscountConfigModel.get()
  }

  async updateConfig(updates: DiscountConfigInput): Promise<DiscountConfig> {
    if (updates.minItemsForDiscount !== undefined && updates.minItemsForDiscount < 1) {
      throw new Error('Le nombre minimum d articles doit etre superieur a 0')
    }

    if (updates.tiers) {
      for (const tier of updates.tiers) {
        if (!tier.name?.trim()) throw new Error('Chaque palier doit avoir un nom')
        if (tier.minAmount < 0 || tier.maxAmount < 0) throw new Error('Les montants doivent etre positifs')
        if (tier.maxAmount < tier.minAmount) throw new Error('Le montant max doit etre superieur au montant min')
        if (tier.percent < 0 || tier.percent > 100) throw new Error('La remise doit etre entre 0 et 100%')
      }
    }

    return DiscountConfigModel.update(updates)
  }
}

export const discountsService = new DiscountsService()
