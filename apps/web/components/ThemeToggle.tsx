'use client';
import {useEffect,useState} from 'react';
import {Moon,Sun} from 'lucide-react';
export default function ThemeToggle(){const [light,setLight]=useState(false);useEffect(()=>{const v=localStorage.getItem('vcu-theme');setLight(v==='light');document.documentElement.dataset.theme=v||'dark'},[]);function toggle(){const next=!light;setLight(next);document.documentElement.dataset.theme=next?'light':'dark';localStorage.setItem('vcu-theme',next?'light':'dark')}return <button onClick={toggle} className="icon-button" title={light?'Switch to dark theme':'Switch to light theme'} aria-label="Toggle theme">{light?<Sun size={17}/>:<Moon size={17}/>}</button>}
