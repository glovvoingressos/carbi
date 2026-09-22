export async function resolveSessionOrTimeout<T>(
  getSession: () => Promise<T>,
  timeoutMs: number,
): Promise<T | null> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  const timeout = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => resolve(null), timeoutMs)
  })

  try {
    return await Promise.race([getSession(), timeout])
  } catch {
    return null
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId)
  }
}
