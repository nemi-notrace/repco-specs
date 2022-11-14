import { Form } from '@remix-run/react'
import { cva, cx, VariantProps } from 'class-variance-authority'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { SanitizedHTML } from '../sanitized-html'

const styles = cva('p-4 rounded-lg border shadow-md', {
  variants: {
    disabled: {
      true: 'opacity-70 pointer-events-none cursor-not-allowed',
    },
    variantSize: {
      md: '',
      full: 'w-full',
    },
    variant: {
      default: [' dark:bg-gray-800 dark:border-gray-700'],
      centered: [
        'justify-center text-center',
        'dark:bg-gray-800 dark:border-gray-700',
      ],
      simple: [
        'max-w-sm bg-white rounded-lg border border-gray-200 shadow-md dark:bg-gray-800 dark:border-gray-700',
      ],
      bare: '',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export function Card(props: CardProps) {
  const className = cx(styles(props))
  return <div className={className} {...props}></div>
}

export function RepcoCard(props: CardProps) {
  const className = cx(styles(props))
  return (
    <div className={className} {...props}>
      <div className="p-5">
        <a href="#">
          <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            <SanitizedHTML
              allowedTags={['a', 'p']}
              html={props.repcoTitle || ''}
            />
          </h5>
        </a>
        <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
          <SanitizedHTML allowedTags={['a', 'p']} html={props.summary || ''} />
        </p>
        <a
          href={`/items/item/${props.uid}`}
          className="inline-flex items-center py-2 px-3 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        >
          Read more
          <svg
            aria-hidden="true"
            className="ml-2 -mr-1 w-4 h-4"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
              clip-rule="evenodd"
            ></path>
          </svg>
        </a>
      </div>
    </div>
  )
}

export function RepcoCardAdvanced(props: CardProps) {
  const className = cx(styles(props))
  const [show, setShow] = useState('invisible')
  const [focus, setFocus] = useState(false)
  const ref = useRef(null)
  const onFocus = () => setFocus(true)

  useEffect(() => {})

  return (
    <div className={className} {...props}>
      <div className="flex justify-end px-4 pt-4">
        <div className="relative inline-block text-left">
          <div>
            <button
              type="button"
              className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100"
              id="menu-button"
              aria-expanded="true"
              aria-haspopup="true"
              onClick={() => {
                show === 'invisible' ? setShow('visible') : setShow('invisible')
              }}
            >
              Options
              <svg
                className="-mr-1 ml-2 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>

          <div
            onFocus={onFocus}
            className={`${show} absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="menu-button"
          >
            <div className="py-1" role="none">
              <Form method="post" action="/playlists/add">
                <button
                  className="text-gray-800 block px-4 py-2 text-sm"
                  name="add-item"
                  value={props.uid}
                >
                  add to playlist
                </button>
              </Form>
              <Link
                to="#"
                className="text-gray-200 block px-4 py-2 text-sm"
                role="menuitem"
                id="menu-item-0"
              >
                Transcription
              </Link>
              <Link
                to="#"
                className="text-gray-200 block px-4 py-2 text-sm"
                role="menuitem"
                id="menu-item-0"
              >
                Translation
              </Link>
              <Link
                to="#"
                className="text-gray-200 block px-4 py-2 text-sm"
                role="menuitem"
                id="menu-item-0"
              >
                share
              </Link>
              <Link
                to="#"
                className="text-gray-200 block px-4 py-2 text-sm"
                role="menuitem"
                id="menu-item-0"
              >
                get similar
              </Link>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-col pb-10">
        <div className="p-5">
          <Link to={`/items/item/${props.uid}`}>
            <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              <SanitizedHTML
                allowedTags={['a', 'p']}
                html={props.repcoTitle || ''}
              />
            </h5>
          </Link>
          <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
            <SanitizedHTML
              allowedTags={['a', 'p']}
              html={props.summary || ''}
            />
          </p>
          <a
            href={`/items/item/${props.uid}`}
            className="inline-flex items-center py-2 px-3 text-sm font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Read more
            <svg
              aria-hidden="true"
              className="ml-2 -mr-1 w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clip-rule="evenodd"
              ></path>
            </svg>
          </a>
        </div>
      </div>
    </div>
  )
}

export type CardProps = CardBaseProps &
  React.DetailsHTMLAttributes<HTMLDivElement> &
  CardContent

export type CardContent = {
  summary: string | null
  repcoTitle: string
  uid: string
}
export interface CardBaseProps extends VariantProps<typeof styles> {}
