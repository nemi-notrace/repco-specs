import type { LoaderFunction } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { gql } from '@urql/core'
import { Pager } from '~/components/pager'
import { SanitizedHTML } from '~/components/sanitized-html'
import { SearchBar } from '~/components/ui/searchBar'
import type {
  LoadContentItemsQuery,
  LoadContentItemsQueryVariables,
} from '~/graphql/types.js'
import { graphqlQuery, parsePagination } from '~/lib/graphql.server'

const QUERY = gql`
  query LoadContentItems(
    $first: Int
    $last: Int
    $after: Cursor
    $before: Cursor
  ) {
    contentItems(first: $first, last: $last, after: $after, before: $before) {
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      nodes {
        title
        uid
        summary
      }
    }
  }
`

type LoaderData = { data: LoadContentItemsQuery }

export const loader: LoaderFunction = ({ request }) => {
  const url = new URL(request.url)
  const pagination = parsePagination(url)
  return graphqlQuery<LoadContentItemsQuery, LoadContentItemsQueryVariables>(
    QUERY,
    pagination,
  )
}

export default function IndexRoute() {
  const { data } = useLoaderData<LoaderData>()
  if (!data) {
    return 'Ooops, something went wrong :('
  }
  if (!data.contentItems) {
    return 'No content items'
  }
  return (
    <main>
      <SearchBar></SearchBar>
      <Pager url="/items" pageInfo={data.contentItems.pageInfo} />
      <ul>
        {data.contentItems.nodes.map((node, i) => (
          <li key={i}>
            <h2>
              <Link to={`/item/${node.uid}`}>{node.title}</Link>
            </h2>
            <SanitizedHTML allowedTags={['a', 'p']} html={node.summary} />
          </li>
        ))}
      </ul>
    </main>
  )
}
