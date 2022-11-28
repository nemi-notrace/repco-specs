import { useState } from 'react'

interface Props {}

export function usePlaylists(props: Props) {
  const [playlists, setPlaylists]: any = useState([])

  function setStorage(name: string, value: string) {
    const values = window.localStorage.getItem(name)
    const arr = values ? JSON.parse(values) : []
    arr.push(value)
    localStorage.setItem(name, JSON.stringify(arr))
  }

  function getStorage(name: string) {
    const values = window.localStorage.getItem(name)
    setPlaylists(values ? JSON.parse(values) : [])
  }

  return [playlists, getStorage, setStorage]
}
