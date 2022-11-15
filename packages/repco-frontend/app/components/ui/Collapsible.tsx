import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import {
  CheckIcon,
  PlayIcon,
  PlusIcon,
  TriangleRightIcon,
} from '@radix-ui/react-icons'
import { NavLink } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { addToLocalStorageArray, localStorageItemToArray } from '~/lib/helpers'
import { NewPlaylistBar } from './bars/NewPlaylistBar'

interface Props {
  node: string
}

export function CollapsiblePlaylist(props: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [playlists, setPlaylists] = useState([])
  const [showData, setShowData] = useState(true)
  const [added, setAdded] = useState('')

  function addToPlaylist(playlist: string, node: string) {
    addToLocalStorageArray(playlist, node)
    setPlaylists(localStorageItemToArray('playlists'))
    setAdded(playlist)
  }

  useEffect(() => {
    if (!showData) return
    if (typeof window !== 'undefined') {
      setPlaylists(localStorageItemToArray('playlists'))
      setShowData(false)
    }
  }, [showData])

  return (
    <CollapsiblePrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <CollapsiblePrimitive.Trigger
        className={
          'py-1 px-2 text-sm border rounded-md items-center transition-colors duration-100 cursor-default disabled:opacity-50 text-blue-700 bg-white-700 hover:text-purple-500 placeholder:focus:ring-purple-500 focus:ring-2 focus:outline-none inline-flex'
        }
      >
        <div>add to Playlist</div>
        <TriangleRightIcon className="transform duration-300 ease-in-out group-radix-state-open:rotate-90" />
      </CollapsiblePrimitive.Trigger>
      <CollapsiblePrimitive.Content>
        <NewPlaylistBar />
      </CollapsiblePrimitive.Content>
      <CollapsiblePrimitive.Content className="mt-4 flex flex-col space-y-4">
        {playlists.map((title, i) => (
          <div
            key={`collapsible-${title}-${i}`}
            className={
              'group ml-12 flex select-none items-center justify-between rounded-md px-4 py-2 text-left text-sm  bg-white text-gray-900 hover:bg-purple-400'
            }
          >
            {title}
            <div className="hidden items-center space-x-3 group-hover:flex">
              <button
                onClick={() => {
                  addToPlaylist(title, props.node)
                }}
              >
                <PlusIcon
                  className={
                    added.includes(title)
                      ? 'hidden'
                      : 'cursor-pointer text-gray-800 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }
                />
              </button>
              <CheckIcon className={added.includes(title) ? '' : 'hidden'} />

              <NavLink to={`/playlists/playlist/${title}`}>
                <PlayIcon className="cursor-pointer text-gray-800 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
              </NavLink>
            </div>
          </div>
        ))}
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  )
}
