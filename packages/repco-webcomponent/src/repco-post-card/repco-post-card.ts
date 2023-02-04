import './repco-post-card-header'
import './repco-post-card-thumbnail'
import './repco-post-card-body'
import './repco-post-card-footer'
import { css, html, LitElement } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('repco-post-card')
export class RepcoPostCardElement extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      background-color: var(--repco-post-card-background-color, white);
      border: var(--repco-post-card-border, none);
      border-radius: var(--repco-post-card-border-radius, 0px);
      margin: var(--repco-post-card-margin, 3px);
      box-shadow: var(
        --repco-post-card-shadow,
        rgba(0, 0, 0, 0.15) 0px 1.95px 2.6px
      );
      padding: 2%;
    }

    .right {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    repco-post-card-thumbnail {
      --repco-post-card-thumbnail-height: var(--repco-post-card-height);
      --repco-post-card-thumbnail-border-left-radius: var(
        --repco-post-card-border-radius
      );
    }

    repco-post-card-header {
      --repco-post-card-header-color: var(--repco-post-card-header-color);
    }

    repco-post-card-body {
      --repco-post-card-body-color: var(--repco-post-card-body-color);
    }

    repco-post-card-footer {
      --repco-post-card-footer-color: var(--repco-post-card-footer-color);
    }
  `

  @property()
  thumbnail = ''

  @property()
  header = ''

  @property()
  subheader = ''

  @property()
  body = ''

  @property()
  footer = ''

  override render() {
    return html`
      <div class="left">
        <repco-post-card-thumbnail
          .src=${this.thumbnail}
        ></repco-post-card-thumbnail>
      </div>
      <div class="right">
        <repco-post-card-header
          .header="${this.header}"
          .subheader="${this.subheader}"
        ></repco-post-card-header>
        <repco-post-card-body .body="${this.body}"></repco-post-card-body>
        <repco-post-card-footer
          .footer="${this.footer}"
        ></repco-post-card-footer>
      </div>
    `
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'repco-post-card': RepcoPostCardElement
  }
}
