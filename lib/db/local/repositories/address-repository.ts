import { BaseRepository } from './base-repository'
import { Address } from '../models'

export class AddressRepository extends BaseRepository<Address> {
  protected tableName = 'addresses'
  
  constructor() {
    super()
  }

  async findByUserId(userId: string): Promise<Address[]> {
    const addresses = await this.findAll()
    return addresses.filter(address => address.userId === userId)
  }

  async findDefaultByUserId(userId: string): Promise<Address | null> {
    const addresses = await this.findByUserId(userId)
    return addresses.find(address => address.isDefault) || null
  }

  async setAsDefault(id: string, userId: string): Promise<Address | null> {
    // 기존 기본 배송지를 false로 변경
    const userAddresses = await this.findByUserId(userId)
    for (const address of userAddresses) {
      if (address.isDefault) {
        await this.update(address.id, { isDefault: false })
      }
    }

    // 새로운 기본 배송지 설정
    return await this.update(id, { isDefault: true })
  }

  async removeDefault(userId: string): Promise<void> {
    const userAddresses = await this.findByUserId(userId)
    for (const address of userAddresses) {
      if (address.isDefault) {
        await this.update(address.id, { isDefault: false })
      }
    }
  }
}