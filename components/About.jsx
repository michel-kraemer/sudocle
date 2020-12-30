import styles from "./About.scss"

const About = () => {
  let currentYear = new Date().getFullYear()

  return (<>
    <h2>About</h2>

    <h3>Sudoku v{process.env.version}</h3>
    <p>Copyright &copy; 2020{currentYear > 2020 && <>&ndash;{currentYear}</>} <a href="https://michelkraemer.com"
      target="_blank" rel="noreferrer">Michel Krämer</a></p>
    <p>This software is open source and has been released under
    the <a href="https://github.com/michel-kraemer/sudoku/blob/main/LICENSE"
      target="_blank" rel="noreferrer">MIT license</a>. The source code
      is available on <a href="https://github.com/michel-kraemer/sudoku"
      target="_blank" rel="noreferrer">GitHub</a>.</p>

    <h3>Aknowledgements</h3>
    <p>This software has been inspired by the official web app
      of <a href="https://www.youtube.com/c/CrackingTheCryptic"
      target="_blank" rel="noreferrer">Cracking the Cryptic</a>, the world’s most
      popular YouTube channel about Sudoku and other logic puzzles.</p>
    <p>The Wong colour palette is based on Wong, B. (2011). Points of view: Color
      blindness. <em>Nat Methods</em> 8, 441. <a href="https://doi.org/10.1038/nmeth.1618"
        target="_blank" rel="noreferrer">https://doi.org/10.1038/nmeth.1618</a></p>
    <style jsx>{styles}</style>
  </>)
}

export default About
