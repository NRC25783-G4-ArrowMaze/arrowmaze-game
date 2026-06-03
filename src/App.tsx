import React from 'react'
import './App.css'

const App: React.FC = () => {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Arrow Maze</h1>
        <p>Navigate through the maze by rotating arrows</p>
      </header>
      <main className="app-main">
        <section className="welcome">
          <p>Welcome to Arrow Maze!</p>
          <button className="btn btn-primary">Start Game</button>
        </section>
      </main>
    </div>
  )
}

export default App
