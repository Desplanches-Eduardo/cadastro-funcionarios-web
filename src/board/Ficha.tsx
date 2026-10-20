import { useState } from 'react'
import type { Funcionario } from '../api/types'
import { Ima } from '../ui/Ima'
import styles from './Ficha.module.css'

function iniciais(nome: string | null): string {
  const partes = (nome ?? '').trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return '?'
  const primeira = partes[0][0]
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : ''
  return (primeira + ultima).toUpperCase()
}

// A ficha de um funcionário, presa por um ímã da cor da tarefa em que está.
export function Ficha({ pessoa, corIma }: { pessoa: Funcionario; corIma: string }) {
  // Se a url_img estiver quebrada, cai para as iniciais.
  const [fotoFalhou, setFotoFalhou] = useState(false)
  const temFoto = Boolean(pessoa.url_img) && !fotoFalhou

  return (
    <article className={styles.ficha}>
      <Ima cor={corIma} className={styles.ima} />
      {temFoto ? (
        <img
          className={styles.avatar}
          src={pessoa.url_img!}
          alt=""
          onError={() => setFotoFalhou(true)}
        />
      ) : (
        <span className={styles.avatar} aria-hidden="true">
          {iniciais(pessoa.nome)}
        </span>
      )}
      <div className={styles.texto}>
        <h3 className={styles.nome}>{pessoa.nome || 'Sem nome'}</h3>
        {pessoa.cargo && <p className={styles.cargo}>{pessoa.cargo}</p>}
      </div>
    </article>
  )
}
