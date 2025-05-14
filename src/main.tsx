
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add the Playfair Display font for academic styling
const linkElement = document.createElement('link');
linkElement.rel = 'stylesheet';
linkElement.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&display=swap';
document.head.appendChild(linkElement);

createRoot(document.getElementById("root")!).render(<App />);
