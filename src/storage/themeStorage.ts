import { createStorage } from '@src/storage/base'
import { type BaseStorage, StorageEnum, type Theme } from '@src/types/storage'

type ThemeStorage = BaseStorage<Theme> & {
	toggle: () => Promise<void>;
};

const storage = createStorage<Theme>('theme-storage-key', 'light', {
		storageEnum: StorageEnum.Local,
		liveUpdate: true
	}
)

// You can extend it with your own methods
export const themeStorage: ThemeStorage = {
	...storage,
	toggle: async () => {
		await storage.set(currentTheme => {
			return currentTheme === 'light' ? 'dark' : 'light'
		})
	}
}