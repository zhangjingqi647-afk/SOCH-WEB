import {createRoot} from 'react-dom/client';
import App from './App';
import 'swiper/css';
import 'swiper/css/effect-fade';
import './overrides.css';
createRoot(document.getElementById('root')!).render(<App/>);
