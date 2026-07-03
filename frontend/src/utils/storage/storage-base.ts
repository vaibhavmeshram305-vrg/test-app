export type StorageItemValue =
  | string
  | number
  | boolean
  | null
  | object;

export type AssertNoExtras<T extends never> = T;

export abstract class StorageBase {
  protected retrieve<Fallback extends StorageItemValue>(
    raw: string | null,
    fallback: Fallback,
  ): Fallback | null {
    if (raw === null) {
      return fallback;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  protected warn(
    method: string,
    key: string,
    error: unknown,
  ): void {
    console.warn(`[Storage:${method}] ${key}`, error);
  }
}