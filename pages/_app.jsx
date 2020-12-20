import styles from "./_app.scss?type=global"

const App = ({ Component, pageProps }) => (
  <>
    <Component {...pageProps} />
    <style jsx>{styles}</style>
  </>
)

export default App
