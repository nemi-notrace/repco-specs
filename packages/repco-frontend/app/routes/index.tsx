import styles from '~/styles/styles.css'
import type { LinksFunction } from '@remix-run/node'
import { Theme, useTheme } from '~/utils/theme-provider'

export const links: LinksFunction = () => [{ rel: 'stylesheet', href: styles }]

export default function Index() {
  const [, setTheme] = useTheme()

  const toggleTheme = () => {
    setTheme((prevTheme) =>
      prevTheme === Theme.LIGHT ? Theme.DARK : Theme.LIGHT,
    )
  }
  return (
    <div className="px-6 py-6">
      <button onClick={toggleTheme}>Toggle</button>
      <h2 className="font-medium leading-tight text-4xl mt-0 mb-6 dark:text-pink-500  text-blue-600">
        Welcome
      </h2>
      <p>
        This UI is only a draft for curating the data in the Repco database.
      </p>
      <br />
      <p>
        It only aims to outline the possibilities Repco could offer in terms of
        editing own and other people's contributions.
      </p>
      <br />
      <p>
        In this version individual contributions can be selected and added to
        so-called playlists which could theoretically be published again on a
        corresponding portal.
      </p>
      <br />
      <p>
        This version is intended for demo purposes only. In a further iteration,
        technical and UI improvements should be made in addition to the required
        functions. This includes caching of data, editing of
        playlists/contributions, roles and user management, mobile capability
        and much more.
      </p>
      <br />
      <p>
        <b>We wish a lot of fun trying it out :P</b>
      </p>
      <br />
    </div>
  )
}
