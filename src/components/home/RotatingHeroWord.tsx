import styles from './RotatingHeroWord.module.css'

export default function RotatingHeroWord() {
  return (
    <span className={styles.rotator} data-hero-verb-rotator aria-hidden="true">
      <span className={styles.space}>Pesquise</span>
      <span className={`${styles.word} ${styles.find}`} data-hero-verb-word>Encontre</span>
      <span className={`${styles.word} ${styles.buy}`} data-hero-verb-word>Compre</span>
      <span className={`${styles.word} ${styles.sell}`} data-hero-verb-word>Venda</span>
      <span className={`${styles.word} ${styles.search}`} data-hero-verb-word>Pesquise</span>
    </span>
  )
}
