import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  // check if user had a preference saved before
  const [theme, setTheme] = useState(
    localStorage.getItem('theme') || 'light'
  )

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
  }

  // apply theme class to body
  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// easy hook to use anywhere
export const useTheme = () => useContext(ThemeContext)