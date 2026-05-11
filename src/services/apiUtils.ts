export async function parseApiResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return [] as T
  }

  if (!response.ok) {
    const body = await response.text()
    throw new Error(body || `API request failed with status ${response.status}`)
  }

  return (await response.json()) as T
}

export async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  return (await response.json()) as T
}
