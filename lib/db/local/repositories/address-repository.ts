import { BaseRepository } from './base-repository'
import { Address, CreateAddressInput, UpdateAddressInput } from '@/types/address'
import { v4 as uuidv4 } from 'uuid'

export class AddressRepository extends BaseRepository<Address> {
  constructor() {
    super('addresses')
  }

  async create(userId: string, input: CreateAddressInput): Promise<Address> {
    const addresses = await this.findAll()
    
    // 기본 배송지로 설정하는 경우, 기존 기본 배송지 해제
    if (input.isDefault) {
      const userAddresses = addresses.filter(addr => addr.userId === userId)
      for (const addr of userAddresses) {
        if (addr.isDefault) {
          addr.isDefault = false
          await this.update(addr.id, addr)
        }
      }
    }

    const newAddress: Address = {
      id: uuidv4(),
      userId,
      ...input,
      isDefault: input.isDefault || false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    addresses.push(newAddress)
    await this.saveAll(addresses)
    return newAddress
  }

  async findByUserId(userId: string): Promise<Address[]> {
    const addresses = await this.findAll()
    return addresses.filter(addr => addr.userId === userId)
  }

  async findDefaultByUserId(userId: string): Promise<Address | null> {
    const addresses = await this.findByUserId(userId)
    return addresses.find(addr => addr.isDefault) || null
  }

  async updateAddress(input: UpdateAddressInput): Promise<Address | null> {
    const address = await this.findById(input.id)
    if (!address) return null

    // 기본 배송지로 변경하는 경우
    if (input.isDefault === true) {
      const userAddresses = await this.findByUserId(address.userId)
      for (const addr of userAddresses) {
        if (addr.isDefault && addr.id !== input.id) {
          addr.isDefault = false
          await this.update(addr.id, addr)
        }
      }
    }

    const updatedAddress: Address = {
      ...address,
      ...input,
      updatedAt: new Date()
    }

    await this.update(input.id, updatedAddress)
    return updatedAddress
  }

  async deleteAddress(id: string): Promise<boolean> {
    const address = await this.findById(id)
    if (!address) return false

    // 기본 배송지인 경우, 다음 주소를 기본으로 설정
    if (address.isDefault) {
      const userAddresses = await this.findByUserId(address.userId)
      const otherAddresses = userAddresses.filter(addr => addr.id !== id)
      if (otherAddresses.length > 0) {
        otherAddresses[0].isDefault = true
        await this.update(otherAddresses[0].id, otherAddresses[0])
      }
    }

    return await this.delete(id)
  }

  async getAddressCount(userId: string): Promise<number> {
    const addresses = await this.findByUserId(userId)
    return addresses.length
  }
}