import { LoaderFunction } from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { useEffect, useRef, useState } from 'react'
import { gql } from 'urql'
import { graphqlQuery } from '~/lib/graphql.server'

const LIMIT = 10

const QUERY = gql`
  query LoadContentItemsByOffset(
    $first: Int
    $last: Int
    $after: Cursor
    $before: Cursor
    $orderBy: [ContentItemsOrderBy!]
    $includes: String
  ) {
    contentItems(
      first: $first
      last: $last
      after: $after
      before: $before
      orderBy: $orderBy
      filter: { title: { includes: $includes } }
    ) {
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      totalCount
      nodes {
        title
        uid
        summary
      }
    }
  }
`
//TODO intersection observer query via offset .... bevor minus... next + offset

interface parseNumberParams {
  value: string | null
  defaultValue: number
}
const parseNumber = ({ value, defaultValue }: parseNumberParams) => {
  return typeof value === 'string' ? parseInt(value) : defaultValue
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)
  const after = url.searchParams.get('after')
  const before = url.searchParams.get('before')
  const last = before ? LIMIT : null
  const first = last ? null : LIMIT
  const orderBy = url.searchParams.get('order') || 'TITLE_ASC'
  const includes = url.searchParams.get('includes') || ''
  console.log('BEFORE', before, 'AFTER', after)
  return await graphqlQuery(QUERY, {
    first: first,
    last: last,
    after: after,
    before: before,
    orderBy: orderBy,
    includes: includes,
  })
}

export default function Ip() {
  const { data } = useLoaderData<typeof loader>()
  const [pageInfo, setPageInfo] = useState(data.contentItems.pageInfo)
  const [itemsToRender, setItemsToRender] = useState(data.contentItems.nodes)
  const [fetchMore, setFetchMore] = useState(false)

  const fetcher = useFetcher()
  const parentRef = useRef<any>(null)
  const startRef = useRef<any>(null)

  useEffect(() => {
    const observerEnd = new IntersectionObserver((entries: any) => {
      const end = entries[0]

      if (end.isIntersecting) {
        console.log(end)
        if (end.intersectionRatio >= 1) {
          return
        }

        if (!pageInfo.hasNextPage) return
        if (pageInfo.hasNextPage) {
          fetcher.load(`/ip?after=${pageInfo.endCursor}`)
          if (fetcher.data) {
            setItemsToRender(fetcher.data.data.contentItems.nodes)
            setPageInfo(fetcher.data.data.contentItems.pageInfo)
            observerEnd.disconnect()
            window.scrollBy(0, 10)
            return
          }
        }
      }
    })

    const observerStart = new IntersectionObserver((entries: any) => {
      const start = entries[0]

      if (start.isIntersecting) {
        if (start.intersectionRatio >= 1) {
          return
        }
        if (!pageInfo.hasPreviousPage) return
        if (pageInfo.hasPreviousPage) {
          console.log('PRE')
          fetcher.load(`/ip?before=${pageInfo.startCursor}`)

          if (fetcher.data) {
            setItemsToRender(fetcher.data.data.contentItems.nodes)
            setPageInfo(fetcher.data.data.contentItems.pageInfo)
            observerStart.disconnect()
            window.scrollBy(0, 10)

            return
          }
        }
      }
    })

    observerStart.observe(startRef.current)
    observerEnd.observe(parentRef.current)
  }, [
    fetchMore,
    fetcher,
    pageInfo,
    pageInfo.endCursor,
    pageInfo.hasNextPage,
    parentRef,
  ])

  return (
    <div>
      <div className="h-10 bg-black" ref={startRef}></div>
      {itemsToRender.map((e: any, index: any) => (
        <div className="h-32" key={e.uid}>
          {index}: {e.uid}
        </div>
      ))}
      <div className="h-4 bg-red" ref={parentRef}></div>
    </div>
  )
}
