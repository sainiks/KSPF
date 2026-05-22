import PhoenixScene from './components/PhoenixScene'
import Overlay from './components/Overlay'


export default function App() {
  return (
    <main style={{ position: 'relative', width: '100%', minHeight: '100vh', background: '#030303' }}>
      {/* 3D Canvas Scene sitting fixed in the background */}
      <PhoenixScene />

      {/* HTML Scrollytelling content overlay sitting on top */}
      <Overlay />
    </main>
  )
}
