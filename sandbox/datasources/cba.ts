// @ts-ignore
import { fetch } from 'fetch-undici'

import { DataSource } from "./datasource.js";
import { Entity, EntityBatch, ContentItem, ContentGrouping } from "./entity.js";
import { CbaPost, CbaSeries } from './cba/types.js';
import { HttpError } from '../helpers/httpErrors.js'
import { extractCursorAndMap, FetchOpts } from '../helpers/datamapping.js'



// series:
// https://cba.fro.at/wp-json/wp/v2/series?page=1&per_page=1&_embed&orderby=modified&order=asc&modified_after=2021-07-27T10:29:04
// stations:
// https://cba.fro.at/wp-json/wp/v2/station
// https://cba.fro.at/wp-json/wp/v2/station?modified_after=2010-07-27T10:29:04&per_page=1&orderby=modified&order=asc
// alernativ channel
// https://cba.fro.at/wp-json/wp/v2/channel
// channels:
// posts:
// https://cba.fro.at/wp-json/wp/v2/posts

export class CbaDataSource implements DataSource{
  endpoint: string
  constructor () {
    this.endpoint = 'https://cba.fro.at/wp-json/wp/v2'
  }
  async fetchUpdates(cursorString: string | null): Promise<EntityBatch> {
    const cursor = cursorString ? JSON.parse(cursorString) : {}
    const entities = []
    {
      const res = await this._fetchPosts(cursor.posts)
      if (res) {
        cursor.posts = res.cursor
        entities.push(...res.entities)
      }
    }
    {
      const res = await this._fetchSeries(cursor.series)
      if (res) {
        cursor.series = res.cursor
        entities.push(...res.entities)
      }
    }
    const batch = {
      cursor: JSON.stringify(cursor),
      entities
    }
    return batch
  }


  urn (type: string, id: string | number): string {
    return `urn:repco:cba.media:${type}:${id}`
  }

  private async _fetchSeries(cursor?: string) {
    if (!cursor) cursor = '1970-01-01T01:00:00'
    const perPage = 2
    const url = `/series?page=1&per_page=${perPage}&_embed&orderby=modified&order=asc&modified_after=${cursor}`
    const series = await this._fetch<CbaSeries[]>(url)

    return extractCursorAndMap(
      series,
      x => this._mapSeries(x),
      x => x.modified.toString()
    )
  }

  private async _fetchPosts(cursor?: string) {
    if (!cursor) cursor = '1970-01-01T01:00:00'
    const perPage = 2
    const url = `/posts?page=1&per_page=${perPage}&_embed&orderby=modified&order=asc&modified_after=${cursor}`
    const posts = await this._fetch<CbaPost[]>(url)
    if (!posts.length) return null
    return extractCursorAndMap(
      posts,
      x => this._mapPost(x),
      x => x.modified.toString()
    )
  }

  private _mapSeries(series: CbaSeries): Entity[] {
    const item: ContentGrouping = {
      uid: this.urn('series', series.id),
      title: series.title.rendered,
      description: series.content.rendered,
      licenseUid: 'missing',
      groupingType: 'show',
      subtitle: null,
      summary: null,
      broadcastSchedule: null,
      startingDate: null,
      terminationDate: null,
      variant: 'EPISODIC'
    }
    return [item]
  }

  private _mapPost(post: CbaPost): Entity[] {
    const item: ContentItem = {
      uid: this.urn('post', post.id),
      content: post.content.rendered,
      contentFormat: 'text/html',
      title: post.title.rendered,
      licenseUid: 'missing',
      primaryGroupingUid: 'missing',
      subtitle: 'missing',
      summary: post.excerpt.rendered,
    }
    return [item]
  }

  async _fetch<T = any>(urlString: string, opts: FetchOpts = {}): Promise<T> {
    const url = new URL(this.endpoint + urlString)
    if (opts.params) {
      for (const [key, value] of Object.entries(opts.params)) {
        url.searchParams.set(key, value)
      }
      opts.params = undefined
    }
    const res = await fetch(url.toString(), opts)
    if (!res.ok) {
      try {
        const errorJson = await res.json()
        throw new HttpError(res.code, errorJson.message, errorJson)
      } catch (err) {
        if (err instanceof HttpError) throw err
        else throw HttpError.fromResponse(res)
      }
    }
    const json = await res.json()
    return json as T
  }

  
}

