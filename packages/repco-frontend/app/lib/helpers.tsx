export function setStorage(name: string, value: string) {
  const values = window.localStorage.getItem(name)
  const arr = values ? JSON.parse(values) : []
  arr.push(value)
  localStorage.setItem(name, JSON.stringify(arr))
}

export function getStorage(name: string) {
  const values = window.localStorage.getItem(name)
  return values ? JSON.parse(values) : []
}
