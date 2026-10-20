import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { servidor, zerarBanco } from './api-falsa'

// O jsdom (o "navegador" dos testes) ainda não implementa o <dialog> modal
// nem o Popover. Estes substitutos fazem só o necessário para os
// componentes funcionarem: abrir, fechar e disparar o evento "close".
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function (this: HTMLDialogElement) {
    if (!this.open) return
    this.open = false
    this.dispatchEvent(new Event('close'))
  }
}
// O jsdom esconde os elementos com [popover], mas não tem a API para abri-los
// (showPopover, hidePopover, togglePopover) nem abre o menu no clique de um
// botão com popovertarget. Este substituto faz as duas coisas e dispara o
// "beforetoggle", que o MoverPara usa para se posicionar.
if (!HTMLElement.prototype.showPopover) {
  const avisar = (el: HTMLElement, newState: 'open' | 'closed') =>
    el.dispatchEvent(Object.assign(new Event('beforetoggle'), { newState }))
  HTMLElement.prototype.showPopover = function (this: HTMLElement) {
    avisar(this, 'open')
    this.style.display = 'block'
    this.dataset.popoverAberto = ''
  }
  HTMLElement.prototype.hidePopover = function (this: HTMLElement) {
    if (!('popoverAberto' in this.dataset)) return
    avisar(this, 'closed')
    this.style.display = ''
    delete this.dataset.popoverAberto
  }
  HTMLElement.prototype.togglePopover = function (this: HTMLElement) {
    if ('popoverAberto' in this.dataset) this.hidePopover()
    else this.showPopover()
    return 'popoverAberto' in this.dataset
  }
}
document.addEventListener('click', (e) => {
  const botao = (e.target as Element | null)?.closest?.('[popovertarget]')
  const alvo = botao && document.getElementById(botao.getAttribute('popovertarget') ?? '')
  if (alvo) alvo.togglePopover()
})

beforeAll(() => {
  servidor.listen({ onUnhandledFrame: 'error' })
  // O fetch do Node não aceita endereço relativo ("/api/..."), que é o que o
  // app usa no navegador. Completamos com a origem da página de teste.
  const fetchOriginal = globalThis.fetch
  globalThis.fetch = (entrada, init) =>
    fetchOriginal(typeof entrada === 'string' ? new URL(entrada, window.location.origin) : entrada, init)
})

afterEach(() => {
  cleanup()
  servidor.resetHandlers()
  zerarBanco()
  localStorage.clear()
  document.title = 'Quadro de turno'
})

afterAll(() => servidor.close())
