import styles from "./Sidebar.scss?type=global"

const Sidebar = ({ children }) => {
  return <div className="sidebar">
    {children}
    <style jsx>{styles}</style>
  </div>
}

export default Sidebar
