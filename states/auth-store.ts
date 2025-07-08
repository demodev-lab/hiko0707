import { atom } from 'jotai'
import { User } from '@/lib/db/local/models'

export const currentUserAtom = atom<User | null>(null)
export const isAuthenticatedAtom = atom((get) => get(currentUserAtom) !== null)
export const isLoadingAuthAtom = atom(false)